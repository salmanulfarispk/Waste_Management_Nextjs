"use client";

import { useState, useEffect } from "react";
import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { createReport, getRecentReports, getUserByEmail } from "@/lib/actions";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { uploadToFirebase } from "../../utils/firebase"
import imageCompression from 'browser-image-compression';


const markerIcon = new Icon({
  iconUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type MarkerPosition = { lat: number; lng: number };

export default function ReportPage() {
  const [user, setUser] = useState("") as any;
  const router = useRouter();

  const [reports, setReports] = useState<
    Array<{
      _id: number;
      location: string;
      wasteType: string;
      amount: string;
      createdAt: string;
    }>
  >([]);

  const [newReports, setNewReports] = useState({
    location: "",
    type: "",
    amount: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null) as any;

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");

  const [verificationResult, setVerificationResults] = useState<{
    wasteType: string;
    quantity: string;
    confidence: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [markerPosition, setMarkerPosition] = useState<MarkerPosition | null>(
    null
  );
  const [mapVisible, setMapVisible] = useState(false);

  const handlelocationChange = () => {
    setMapVisible(true);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: async (event) => {
        const { lat, lng } = event.latlng;

        setMarkerPosition({ lat, lng });

        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const address = response.data.display_name;
          setNewReports((prevReports) => ({
            ...prevReports,
            location: address,
          }));
        } catch (error) {
          console.error("Error fetching address:", error);
        }
      },
    });
    return null;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewReports({ ...newReports, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
  
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
  
      reader.readAsDataURL(selectedFile);
    }
  };

  
  const handleVerify = async () => {
    if (!file) return;

    setVerificationStatus("verifying");

    try {

     
      const options = {
        maxSizeMB: 1, 
        maxWidthOrHeight: 1920, 
        useWebWorker: true, 
      };
  
      const compressedFile = await imageCompression(file, options);
  
      const imageUrl = await uploadToFirebase(compressedFile);

      const payload = {
        inputs: imageUrl, 
        options: { wait_for_model: true },
      };

      const response = await axios.post(
        "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const parsedResult = response.data;
        

      try {
        if (parsedResult.length > 0) {
          const firstResult = parsedResult[0]; 
          if (
            firstResult.label &&
            firstResult.score != null 
          ) {
            
            const wasteTypes = parsedResult.map((item: { label: string }) => item.label);
            const scoreAsString = Math.max(Math.ceil(firstResult.score * 15 * 2), 0).toString();
            const percentage =   Math.max(Math.ceil(firstResult.score * 10 * 2), 0) * 5 /100 ;
            
            
            setVerificationResults({
              wasteType:  wasteTypes,
              quantity:   scoreAsString,
              confidence: percentage,
            });
            setVerificationStatus("success");
            setNewReports({
              ...newReports,
              type: firstResult.label,
              amount: scoreAsString, 
            });
          } else {
            console.error("Invalid verification results", firstResult);
            setVerificationStatus("failure");
          }
        } else {
          console.error("No results found in verification response");
          setVerificationStatus("failure");
        }
      } catch (error) {
        console.error("Failed to parse JSON response:", error);
        setVerificationStatus("failure");
      }
    } catch (error) {
      console.error("Error verifying waste:", error);
      setVerificationStatus("failure");
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== "success" || !user) {
      toast.error("Please verify the waste before submitting or log in");
      return;
    }

    setIsSubmitting(true);

    try {
      const report = (await createReport(
        user._id,
        newReports.location,
        newReports.type,
        newReports.amount,
        preview || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined
      )) as any;

      const formattedReport = {
        _id: report._id,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        createdAt: report.createdAt.toISOString().split("T")[0],
      } as any;

      setReports([formattedReport, ...reports]);
      setNewReports({ location: "", type: "", amount: "" });
      setFile(null);
      setPreview(null);
      setVerificationStatus("idle");
      setVerificationResults(null);

      toast.success(
        `Report Submitted succesfully! You've earned points for reporting waste`
      );
    } catch (error) {
      console.error("Error submitting report", error);
      toast.error("Failed to submit repor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem("userEmail");
      if (email) {
        let user = await getUserByEmail(email);
        setUser(user);

        const recentReports = (await getRecentReports()) as any;
        const formattedReports = recentReports.map((report: any) => ({
          ...report,
          createdAt: report.createdAt.toISOString().split("T")[0],
        }));

        setReports(formattedReports);
      } else {
        router.push("/login");
      }
    };

    checkUser();
  }, [router]);


  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Report waste
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg mb-12"
      >
        <div className="mb-8">
          <label
            htmlFor="waste-image"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Upload Waste Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="waste-image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="waste-image"
                    name="waste-image"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {preview && (
          <div className="mt-4 mb-8">
            <img
              src={preview}
              alt="Waste preview"
              className="max-w-full h-auto rounded-xl shadow-md"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleVerify}
          className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300"
          disabled={!file || verificationStatus === "verifying"}
        >
          {verificationStatus === "verifying" ? (
            <>
             <span className="flex items-center justify-center gap-2">
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"  />
              Verifying...
              </span>
            </>
          ) : (
            "Verify Waste"
          )}
        </button>

        {verificationStatus === "success" && verificationResult && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  Verification Successful
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Waste Type: {verificationResult.wasteType}</p>
                  <p>Quantity: Approximately {verificationResult.quantity} kg</p>
                  <p>
                    Confidence:{" "}
                    {(verificationResult.confidence * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="relative" onClick={handlelocationChange}>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={newReports.location}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 pr-12" // Added padding to the right for icon space
              placeholder="choose location"
            />
          </div>

          {mapVisible && (
            <div className="mt-4">
              <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: "300px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler />
                {markerPosition && (
                  <Marker position={markerPosition} icon={markerIcon} />
                )}
              </MapContainer>
              <button
                onClick={() => setMapVisible(false)}
                className="mt-2 p-2 border rounded bg-blue-500 text-white"
              >
                Close Map
              </button>
            </div>
          )}

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Waste Type
            </label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReports.type}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified waste type"
              readOnly
            />
          </div>
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Estimated Amount
            </label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReports.amount}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified amount"
              readOnly
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Submitting...
            </>
          ) : (
            "Submit Report"
          )}
        </button>
      </form>

      <h2 className="text-3xl font-semibold mb-6 text-gray-800">
        Recent Reports
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr
                  key={report._id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <MapPin className="inline-block w-4 h-4 mr-2 text-green-500 text-ellipsis" />
                    {report.location.split(' ').slice(0, 15).join(' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.wasteType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

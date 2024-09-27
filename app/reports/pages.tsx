
"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";
import { Libraries } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { createReport, getUserByEmail } from "@/lib/actions";





const geminiApiKey = process.env.GEMINI_API_KEY as any;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY as any;

const libraries: Libraries = ["places"];

export default function ReportPage() {
  const [user, setUser] = useState("") as any;
  const router = useRouter();

  const [reports, setReports] = useState<
    Array<{
      id: number;
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

  const [searchBox, setSearchBox] =
    useState<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  });

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlaceChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        setNewReports((prev) => ({
          ...prev,
          location: place.formatted_address || "",
        }));
      }
    }
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

    const readFileAsBase64 = (file: File): Promise<string> =>{    // binary-to-text encoding
        return new Promise((resolve, reject)=> {
            const reader= new FileReader();
             reader.onload=()=> resolve(reader.result  as string)
             reader.onerror = reject
             reader.readAsDataURL(file)
        })
    };

     
    const handleVerify = async()=>{
        if(!file) return ;

        setVerificationStatus("verifying")

        try {
             
            const genAI= new GoogleGenerativeAI(geminiApiKey);
            const model= genAI.getGenerativeModel({model: 'gemini-1.5-flash'});
            const base64Data= await readFileAsBase64(file)

            
            const imageParts= [
                {
                    inlineData: {
                        data: base64Data.split(',')[1],
                        MimeType: file.type,
                    },
                },
            ] as any;
             
      
            
            const promptPart = `You are an expert in waste management and recycling. Analyze this image and provide:
                  1. The type of waste (e.g., plastic, paper, glass, metal, organic)
                  2. An estimate of the quantity or amount (in kg or liters)
                  3. Your confidence level in this assessment (as a percentage)
    
                  Respond in JSON format like this:
                  {
                    "wasteType": "type of waste",
                    "quantity": "estimated quantity with unity",
                    "confidence": confidence level as a number between 0 and 1
                  }`;
              
             
              const result = await model.generateContent([promptPart, ...imageParts])
              const response= await result.response;
              const text= response.text();

               try {
                
                const parsedResult =JSON.parse(text);
                if(parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence){
                    setVerificationResults(parsedResult)
                    setVerificationStatus("success")
                    setNewReports({
                        ...newReports,
                        type: parsedResult.wasteType,
                        amount: parsedResult.quantity
                    })  
                }else{
                    console.error('Invalid varification results',parsedResult);
                    setVerificationStatus("failure")
                }
               } catch (error) {
                console.error("Failed to parse JSON response:", error);
                setVerificationStatus("failure");
               }
        } catch (error) {
            console.error("Error  verifying waste:", error);
            setVerificationStatus("failure");
        }
    };


    const handleSubmit = async(e:React.FormEvent)=>{
       e.preventDefault();
       if(verificationStatus !== "success" || !user){
        toast.error("Please verify the waste before submitting or log in")
        return 
       }

       setIsSubmitting(true)

       try {
        const report =await createReport(user._id, 
          newReports.location,
          newReports.type,
          newReports.amount,
           preview || undefined,
           verificationResult ? JSON.stringify(verificationResult) : undefined
          ) as any;


           const formattedReport ={
             _id: report._id,
             location: report.location,
             wasteType: report.wasteType,
             amount: report.amount,
             createdAt: report.createdAt.toISOString().split('T')[0],
           } as any;

           setReports([formattedReport, ...reports])
           setNewReports({location:"",type:"",amount:""});
           setFile(null)
           setPreview(null)
           setVerificationStatus('idle')
           setVerificationResults(null)


           toast.success(`Report Submitted succesfully! You've earned points for reporting waste`)

       } catch (error) {
         console.error("Error submitting report",error)
         toast.error('Failed to submit repor. Please try again.')
       }finally{
        setIsSubmitting(false)
       }

    };


     
     useEffect(()=>{
        const checkEmail= async()=>{
          const email=localStorage.getItem("userEmail")
          if(email){
            let user= await getUserByEmail(email);
            setUser(user)

            const recentReports= await getRecentReports()
          }
        }
     },[])


  return <>
  </>;
}

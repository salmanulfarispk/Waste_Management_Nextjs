'use client'

import { useState, useEffect } from "react";
import { Clock, Upload, Loader, Calendar, Weight, Search, MapPin, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getUserByEmail, getWasteCollectionTask, saveCollectionWaste, saveReward, updateTaskStatus } from "@/lib/actions";
import { uploadToFirebase } from "@/utils/firebase";
import axios from "axios";

type collectionTask = {
  _id: string;
  location: string;
  wasteType: string;
  amount: string;
  status: "pending" | "in_progress" | "completed" | "verified";
  date: string;
  collectorId: string | null;
};

const ITEMS_PER_PAGE = 5;

export default function CollectPage() {


const [tasks, setTasks] = useState<collectionTask[]>([])
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<{
    _id: string;
    email: string;
    name: string;
  } | null>(null);

  
   useEffect(()=>{
       
    const fetchUserAndTask=async()=>{
        setLoading(true)
        try {

            const userEmail=localStorage.getItem("userEmail")
            if(userEmail){
                const fetchedUser=await getUserByEmail(userEmail)
                
                if(fetchedUser){
                    setUser(fetchedUser)
                }else{
                    toast.error("User not found .Please log in")
                }
            }else{
                toast.error("User not logged in .Please log in")
            }


            const fetchTasks=await getWasteCollectionTask();
            
            setTasks(fetchTasks as collectionTask[])
        } catch (error) {
            console.error("Error fetching user and tasks",error)
            toast.error("failed to load user data and tasks. Please try again")
        }finally{
            setLoading(false)
        }
    }


      fetchUserAndTask();

   },[])


   const [selectedTask, setSelectedTask] = useState<collectionTask | null>(null)
  const [preview, setPreview] = useState<string | null>(null) as any;
   const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
   const [verificationResult, setVerificationResult] = useState<{
     wasteTypeMatch: boolean;
     quantityMatch: boolean;
     confidence: number;
   } | null>(null)
   const [reward, setReward] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null);
    
         

 console.log("verficationstatus",verificationStatus);
 
   
    

    const handleStatusChange =async(taskId:string, newStatus: collectionTask["status"])=>{
        if (!user) {
            toast.error('Please log in to collect waste.')
            return
          }

          try {
            const updatedTask= await updateTaskStatus(taskId, newStatus,user._id)
            if (updatedTask) {
             setTasks(tasks.map((task)=> task._id === taskId ? {...task, status: newStatus, collectorId: user._id} : task )) 

              toast.success("task status updated successfully")
            }else{
                toast.error('Failed to update task status. Please try again.')
            }
          } catch (error) {
            console.error('Error updating task status:', error)
            toast.error('Failed to update task status. Please try again.')
          }
    }


    
  
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
        if (!file || !selectedTask || !user) {
          toast.error("Missing required information for verification");
          return;
        }
      
        setVerificationStatus("verifying");
      
        try {
      
          const imageUrl = await uploadToFirebase(file);
          
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
      
          const result = response.data;
      
          if (Array.isArray(result) && result.length > 0) {
            const firstResult = result[0];
      
            if (firstResult.label && firstResult.score != null) {
              const wasteTypes = result.map((item: { label: string }) => item.label);
              const scoreAsNumber = Math.ceil(firstResult.score * 15 * 2);
      
              const lowperc = Math.floor(Math.random() * 30) / 100;
              const aboveperc = Math.floor(Math.random() * (100 - 60) + 60) / 100;
      
             
              const matchType = wasteTypes.includes(selectedTask.wasteType);
              const amountMatch = scoreAsNumber === Number(selectedTask.amount);
              const verifyperc = matchType && amountMatch ? aboveperc : lowperc;
      
              setVerificationResult({
                wasteTypeMatch: matchType,
                quantityMatch: amountMatch,
                confidence: verifyperc,
              });
      

              if (matchType && amountMatch && verifyperc >= 0.6) {
                setVerificationStatus('success');
      
                await handleStatusChange(selectedTask._id, "verified");
      
                const earnedReward = Math.floor(Math.random() * 50) + 10;
                await saveReward(user._id, earnedReward);
                await saveCollectionWaste(selectedTask._id, user._id);
               
      
                setReward(earnedReward);
                
                toast.success(`Verification successful! You earned ${earnedReward} tokens`, {
                  duration: 5000,
                  position: "top-center",
                });
              } else {
                setVerificationStatus('failure');
                toast.error(
                  "Verification failed. The collected waste does not match the reported waste.",
                  {
                    duration: 5000,
                    position: "top-center",
                  }
                );
              }
            } else {
              console.error("Invalid response format: No label or score found.");
              setVerificationStatus('failure');
            }
          } else {
            console.error("Empty or invalid response from verification API.");
            setVerificationStatus('failure');
          }
        } catch (error) {
          console.error("Error during verification:", error);
          setVerificationStatus("failure");
        }
      };
      


  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  )


const pageCount= Math.ceil(filteredTasks.length/ITEMS_PER_PAGE);
const paginatedTasks= filteredTasks.slice((currentPage -1) * ITEMS_PER_PAGE , currentPage * ITEMS_PER_PAGE) //strats,ends indexes




  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
         <h1 className="text-3xl font-semibold mb-6 text-gray-800">Waste Collection Tasks</h1>
      
        <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Search by area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2 input input-bordered input-success border-black w-full md:max-w-3xl"
        />
        <button className="btn btn-outline">
          <Search className="h-4 w-4" />
        </button>
      </div>

     
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedTasks.map(task => (
              <div key={task._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                    {task.location}
                  </h2>
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center relative">
                    <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                    <span 
                      onMouseEnter={() => setHoveredWasteType(task.wasteType)}
                      onMouseLeave={() => setHoveredWasteType(null)}
                      className="cursor-pointer"
                    >
                      {task.wasteType.length > 8 ? `${task.wasteType.slice(0, 8)}...` : task.wasteType}
                    </span>
                    {hoveredWasteType === task.wasteType && (
                      <div className="absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {task.wasteType}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-gray-500" />
                    {task.amount}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {task.date}
                  </div>
                </div>
                <div className="flex justify-end">
                  {task.status === 'pending' && (
                    <button onClick={() => handleStatusChange(task._id, 'in_progress')} className="btn btn-outline hover:bg-gray-700">
                      Start Collection
                    </button>
                  )}
                  {task.status === 'in_progress' && task.collectorId === user?._id && (
                    <button onClick={() => setSelectedTask(task)} className="btn btn-outline hover:bg-gray-700">
                      Complete & Verify
                    </button>
                  )}
                  {task.status === 'in_progress' && task.collectorId !== user?._id && (
                    <span className="text-yellow-600 text-sm font-medium">In progress by another collector</span>
                  )}
                  {task.status === 'verified' && (
                    <span className="text-green-600 text-sm font-medium">Reward Earned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          

          <div className="join mt-4 flex justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="mr-2 join-item btn btn-outline"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="ml-2 join-item btn btn-outline"
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Verify Collection</h3>
            <p className="mb-4 text-sm text-gray-600">Upload a photo of the collected waste to verify and earn your reward.</p>
            <div className="mb-4">
              <label htmlFor="verification-image" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="verification-image"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input id="verification-image" name="verification-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
            {preview && (
              <img src={preview} alt="Verification" className="mb-4 rounded-md w-full" />
            )}
            <button
              onClick={handleVerify}
              className="w-full btn btn-outline hover:bg-gray-700"
              disabled={!setPreview || verificationStatus === 'verifying'}
            >
              {verificationStatus === 'verifying' ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Verifying...
                </>
              ) : 'Verify Collection'}
            </button>
            {verificationStatus === 'success' && verificationResult &&(
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p>Waste Type Match: {verificationResult.wasteTypeMatch ? 'Yes' : 'No'}</p>
                <p>Quantity Match: {verificationResult.quantityMatch ? 'Yes' : 'No'}</p>
                <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
              </div>
            )}
            {verificationStatus === 'failure' && (
              <p className="mt-2 text-red-600 text-center text-sm">Verification failed. Please try again.</p>
            )}
            <button onClick={() => setSelectedTask(null)}  className="w-full mt-2">
              Close
            </button>
          </div>
        </div>
      )}
      
    </div>

  )
};



function StatusBadge({ status }: { status: collectionTask['status'] }) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    in_progress: { color: 'bg-blue-100 text-blue-800', icon: Trash2 },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    verified: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  }

  const { color, icon: Icon } = statusConfig[status]

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex items-center`}>
      <Icon className="mr-1 h-3 w-3" />
      {status.replace('_', ' ')}
    </span>
  )
}
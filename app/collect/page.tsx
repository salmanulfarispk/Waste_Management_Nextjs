import { useState, useEffect } from "react";
import { Clock, Upload, Loader, Calendar, Weight, Search } from "lucide-react";
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
  data: string;
  collecterId: number | null;
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
   const [verificationImage, setVerificationImage] = useState<string | null>(null)
   const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
   const [verificationResult, setVerificationResult] = useState<{
     wasteTypeMatch: boolean;
     quantityMatch: boolean;
     confidence: number;
   } | null>(null)
   const [reward, setReward] = useState<number | null>(null)


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


    
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setVerificationImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }


  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) {
      toast.error("Missing required information for verification");
      return;
    }
  
    setVerificationStatus("verifying");
  
    try {
 
      const imageUrl = await uploadToFirebase(verificationImage);
  

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
          const scoreAsString = Math.max(Math.ceil(firstResult.score * 15 * 2), 0).toString();
          const confidence = Math.max(Math.ceil(firstResult.score * 10 * 2), 0) * 5 / 100;
  
          
          const matchType = wasteTypes.includes(selectedTask.wasteType);
          const amountMatch = scoreAsString === selectedTask.amount;
  
          setVerificationResult({
            wasteTypeMatch: matchType,
            quantityMatch: amountMatch,
            confidence: confidence,
          });
  
          setVerificationStatus("success");
  
        
          if (matchType && amountMatch && confidence > 0.7) {
         
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
          setVerificationStatus("failure");
        }
      } else {
        console.error("Empty or invalid response from verification API.");
        setVerificationStatus("failure");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      setVerificationStatus("failure");
    }
  };
  









  return <></>;
}

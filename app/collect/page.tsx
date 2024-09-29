import { useState, useEffect } from "react";
import { Clock, Upload, Loader, Calendar, Weight, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getUserByEmail, getWasteCollectionTask, updateTaskStatus } from "@/lib/actions";

type collectionTask = {
  _id: number;
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
             setTasks
          } catch (error) {
            
          }
    }




  return <></>;
}

'use server'
import mongoose from "mongoose";
import { Users,Notifications, Transactions, Reports,Rewards, CollectedWastes} from "../models/schema"
import dbConnect from "./dbConfig";
import { ObjectId } from 'mongodb';


interface Notification {
    _id: string | number; 
    type: string;        
    message: string;     
}

interface Report {
    _id: string; 
    user_id: string; 
    location: string;
    wasteType: string;
    amount: string;
    imageUrl?: string; 
    verification_result?: any; 
    status: string;
    collectorId?: string;
    createdAt?: Date; 
}

interface Reward {
    _id: string;
    name: string;
    points: number;
    description: string;
    collectionInfo: string;
}

interface Transaction {
    _id: string;
    type: string;
    amount: number;
    description: string;
    date: string;  
}

export const createUser= async(email:string,name:string): Promise<{ email: string; name: string } | null>=>{

    try {
         await dbConnect();
         const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return { email: existingUser.email, name: existingUser.name };
        }
        const  user=await Users.create({
            email,
            name
        });
        
        return { email: user.email, name: user.name };
        
    } catch (error) {
        console.error("Error creating user",error)
        return null;
        
    }
};



export const getUserByEmail=async(email: string): Promise<any | null>=>{
    try {
        
        await dbConnect();
        const user=await Users.findOne({email}).lean()  //// lean converts mongoose document to a plain object
        return user ? { ...user, _id: user._id.toString() } : null;
    
         
    } catch (error) {
        console.error("Error fetching user by email",error);
        return null;
    }
}


export async function getUnreadNotifications(userId: string): Promise<Notification[]>{
    try {
        await dbConnect();
        const notifications = await Notifications.find({
            userId,
            isRead: false,
        })
        .select('_id type message')
        .lean()as Notification[];

        return notifications.map((notification) => ({
            ...notification,
            _id: notification._id.toString() 
        }));

    } catch (error) {
        console.error("Error fetching unread notifications", error);
        return []; 
    }
}

export async function getUserBalance(userId: string): Promise<number>{
    try {
        await dbConnect();
        const transactions = await getRewardTransactions(userId) || []; 

        if (transactions.length === 0) return 0;

        const balance = transactions.reduce((acc: number, transaction: any) => {
            if (transaction && transaction.type) {
                return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount;
            }
            return acc; 
        }, 0);

        return Math.max(balance, 0);
    } catch (error) {
        console.error("Error calculating user balance:", error);
        return 0;
    }
}

export async function getRewardTransactions(userId: string): Promise<Transaction[] | null>{
    try {
      
        const transactions = await Transactions.find({
            userId
        }).select({
            type: 1,
            amount: 1,
            description: 1,
            date: 1
        }).sort({ date: -1})
          .limit(10);   
 
          const formattedTransactions: Transaction[] = transactions.map((t) => ({
            _id: t._id.toString(),
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.date.toISOString().split('T')[0] // 'YYYY-MM-DD'
        }));
          return formattedTransactions;
            
    } catch (error) {
         console.error("Error fetching unread notifications",error);
         return null
    }
}



export async function  markNotificationAsRead(notificationId: string | number){
    try {

        await dbConnect();
        await Notifications.updateOne({ _id: notificationId},{
           $set : {isRead:true }
        });
        
    } catch (error) {
        console.error("Error in mark notifications",error);
        return null
    }
}


export async function createReport(userId:string,location:string,wasteType:string,
    amount:string,imageUrl:string,verificationResult?:any){

        try {
            await dbConnect();
            const report = await Reports.create({
              user_id: userId.toString(),
              location,
              wasteType,
              amount,
              imageUrl,
              verification_result: verificationResult,
              status: 'pending',
            });
        
            const plainReport = report.toObject();

            if (Buffer.isBuffer(plainReport._id)) {
                plainReport._id = plainReport._id.toString();
              } else if (typeof plainReport._id !== 'string') {
                plainReport._id = String(plainReport._id);
              }
        
            if (Buffer.isBuffer(plainReport.user_id)) {
                plainReport.user_id = plainReport.user_id.toString();
              } else if (typeof plainReport.user_id !== 'string') {
                plainReport.user_id = String(plainReport.user_id);
              }
            
            plainReport.createdAt = plainReport.createdAt.toISOString().split("T")[0];
            plainReport.updatedAt = plainReport.updatedAt.toISOString();
        
           
          
            
        
            const pointsEarned = 10;
            await updateRewardPoints(userId, pointsEarned);
            await createTransactions(userId, 'earned_report', pointsEarned, 'Points earned for reporting waste');
            await createNotification(userId, `You've earned ${pointsEarned} points for reporting waste!`, 'reward');
        
            return {
              _id: plainReport._id,
              user_id: plainReport.user_id,
              location: plainReport.location,
              wasteType: plainReport.wasteType,
              amount: plainReport.amount,
              imageUrl: plainReport.imageUrl,
              createdAt: plainReport.createdAt,
              updatedAt: plainReport.updatedAt,
            };

          
        }catch(error){
            console.error("Error creating report", error);
            return null;
        }
            
}


export async function updateRewardPoints(userId:string,PointsToAdd:number){
     try {

        const updatedReward = await Rewards.findOneAndUpdate(
            { userId }, 
            { $inc: { points: PointsToAdd } } ,
            { new: true } 
        );

        return updatedReward;
        
     } catch (error) {
        console.error("Error updating reward points",error);
        return null;
     }

    };


    export async function createTransactions(userId:string,type: 'earned_report' | 'earned_collect' | 'redeemed',
        amount: number,description:string ){
         
            try {
                const transaction = new Transactions({
                  userId: new ObjectId(userId),
                  type,
                  amount,
                  description,
                  date: new Date(),
                });
            
                await transaction.save(); 
            
                return transaction;
              } catch (error) {
                console.error("Error creating transaction:", error);
                throw error;
              }
    };


    export async function createNotification(userId:string,message:string,type:string){
        try {
          
            const notification=await Notifications.create({
                userId,
                message,
                type
            });

            return notification;
            
        } catch (error) {
            console.error('Error creating Notifications..',error)
            throw error;
        }
    };



    export async function getRecentReports(limit:number=10): Promise<Report[]>{
        try {
            const reports = await Reports.find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean() as [Report];
            
                return reports.map(report => ({
                    ...report,
                    _id: report._id.toString(), 
                }));

        } catch (error) {
            console.error("Error fetching recent reports:", error);
            return [];
        }
    }


    export async function getAvailableRewards(userId: string): Promise<Reward[]> {
        
        try {
            const userTransactions = await getRewardTransactions(userId);
            if (!userTransactions || userTransactions.length === 0) {
                return []; 
            }
    
            const userPoints = userTransactions.reduce((total: number, transaction: any) => {
                if (transaction.type && typeof transaction.type === 'string') {
                    return transaction.type.startsWith('earned') ? total + transaction.amount : total - transaction.amount;
                }
                return total; 
            }, 0);
               
            const availableRewards = await Rewards.find({
                isAvailable: true,
                points: { $lte: userPoints }
            }).lean().select('_id name points description collectionInfo')as Reward[];
           
            
    
            const allRewards = [
                {
                    _id: '0',
                    name: "Your points",
                    points: userPoints,
                    description: "Redeem your earned points",
                    collectionInfo: "Points earned from reporting and collecting waste"
                },
                ...availableRewards
            ]
    
            
          return allRewards.map(reward => ({
            ...reward,
            _id: reward._id.toString()
           })); 
    
        } catch (error) {
            console.error("Error fetching available rewards:", error);
            return [];
        }
    }




export async function getWasteCollectionTask(limit:number = 20){
    try {
         
        const tasks = await Reports.find({})
            .select('user_id location wasteType amount status collectorId createdAt') 
            .limit(limit)
            .lean()
            .exec(); 
        
         
        return tasks.map((task:any)=> ({
            ...task,
            _id: task._id.toString(),
            createdAt: task.createdAt.toISOString().split('T')[0]
        }))
    } catch (error) {
        console.error("Error fetching waste collection tasks:", error);
        return []; 
    }
}



export async function updateTaskStatus(reportId: string, newStatus: string, collectorId?: string): Promise<Report | null> {
    try {
      
      const updateData: any = { status: newStatus };

      if (collectorId) {
        updateData.collectorId = new mongoose.Types.ObjectId(collectorId); 
      }
  
     
      const updatedReport = await Reports.findByIdAndUpdate(
        reportId,       
        { $set: updateData }, 
        { new: true }     
      ).lean()as Report;
  
      
      if (updatedReport) {
        return {
            ...updatedReport,
            _id: updatedReport._id.toString(), 
        };
    }

    return null;

    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  }






export async function getOrCreateReward(userId:string) {
    try {
 
       await dbConnect();
      const reward = await Rewards.findOne({ userId });
  
      if (reward) {
        return reward; 
      } else {
        const newReward = {
          userId,
          name: 'Default Reward',
          collectionInfo: 'Default Collection Info',
          points: 0,
          level: 1,
          isAvailable: true,
        };
  
        const result = await Rewards.create(newReward);
        return { ...newReward, _id: result.insertedId }; 
      }
    } catch (error) {
      console.error("Error getting or creating reward:", error);
      return null;
   
  }
}


export async function saveReward(userId:string, amount:number) {
    try {
       
       await dbConnect();
      const reward = await Rewards.create({
        userId,
        name: 'Waste Collection Reward',
        collectionInfo: 'Points earned from waste collection',
        points: amount,
        level: 1,
        isAvailable: true,
      }); 
  
      
      await createTransactions(userId, 'earned_collect', amount, 'Points earned for collecting waste');


      return JSON.parse(JSON.stringify(reward));

    } catch (error) {
      console.error("Error saving reward:", error);
      throw error;
    }
  }






export async function saveCollectionWaste(reportId:string, collectorId:string,) {
    try {
       await dbConnect();

      const collectedWaste = await CollectedWastes.create({
        reportId,
        collectorId,
        collectedDate: new Date(),
        status: 'verified',
      });
  
      return JSON.parse(JSON.stringify(collectedWaste));
    } catch (error) {
      console.error("Error saving collected waste:", error);
      throw error;
    }
  };



    export async function redeemReward(userId: string, rewardId: string) {
        try {


          const userReward = await getOrCreateReward(userId);
          
          if (rewardId === '0') {

            const updatedReward = await Rewards.findOneAndUpdate(
              { userId: new ObjectId(userId) },
              { 
                $set: { 
                  points: 0, 
                  updatedAt: new Date() 
                }
              },
              { new: true } // Return the updated document
            );
      
            await createTransactions(userId, 'redeemed', userReward.points, `Redeemed all points: ${userReward.points}`);
            return updatedReward.value; 
        
          } else {

           
            const availableReward = await Rewards.findById(new ObjectId(rewardId)); 
             
             
            if (!userReward || !availableReward || userReward.points < availableReward.points) {
              throw new Error("Insufficient points or invalid reward.");
            }
          
            
            const updatedReward = await Rewards.findOneAndUpdate(
                { userId: userId }, 
                { 
                  $inc: { points: -availableReward.points },  
                  updatedAt: new Date(),  
                },
                { new: true }  // Return the updated document
              );
             
      
            await createTransactions(userId, 'redeemed', availableReward.points, `Redeemed: ${availableReward.name}`);
      
            return updatedReward.value;
          }
        } catch (error) {
          console.error("Error redeeming reward:", error);
          throw error;
        }
      }


       
      export async function getAllRewards() {
        try {
          const rewards = await Rewards.aggregate([
            {
              $lookup: {
                from: 'users',  
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails'
              }
            },
            {
              $unwind: '$userDetails'  
            },
            {
              $project: {
                id: '$_id',
                userId: 1,
                points: 1,
                level: 1,
                createdAt: 1,
                userName: '$userDetails.name'  
              }
            },
            {
              $sort: { points: -1 }  
            }
          ]);
      
          return rewards;
        } catch (error) {
          console.error("Error fetching all rewards:", error);
          return [];
        }
      }

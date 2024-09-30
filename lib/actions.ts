'use server'
import mongoose from "mongoose";
import { Users,Notifications, Transactions, Reports,Rewards, CollectedWastes} from "../models/schema"
import dbConnect from "./dbConfig";


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
        const user=await Users.findOne({email}).lean()
         return user;
    } catch (error) {
        console.error("Error fetching user by email",error);
        return null;
    }
}


export async function getUnreadNotifications(userId: string | number){
    try {
        await dbConnect();
        const notifications = await Notifications.find({
            userId,
            isRead: false,
        })
        .select('_id type message')
        .lean(); 

        return notifications; 
    } catch (error) {
        console.error("Error fetching unread notifications", error);
        return []; 
    }
}

export async function getUserBalance(userId: string | number): Promise<number>{
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

export async function getRewardTransactions(userId: string | number){
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

          const formattedTransactions= transactions.map((t)=> ({
                 ...t,
                 date: t.date.toISOString().split('T')[0]  // 'YYYY-MM-DD'
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
                user_id: userId,
                location,
                wasteType,
                amount,
                imageUrl,
                verification_result: verificationResult,
                status: 'pending',
            })

            const plainReport = report.toObject();
            
            const pointsEarned=10;
              await updateRewardPoints(userId, pointsEarned)
              await createTransactions(userId , 'earned_report', pointsEarned,'Points earned for reporting waste')
              await createNotification(userId, `You've earned ${pointsEarned} points for reporting waste!`,'reward')

            return plainReport;

        } catch (error) {
            console.error("Error creating report",error)
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

                const transaction= await Transactions.create({
                    userId,
                    type,
                    amount,
                    description
                })

                return transaction;
                
            } catch (error) {
                console.error('Error creating transactions',error)
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



    export async function getRecentReports(limit:number=10){
        try {
            const reports = await Reports.find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(); 
            return reports;
        } catch (error) {
            console.error("Error fetching recent reports:", error);
            return [];
        }
    }


    export async function getAvailableRewards(userId: string){
        
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
            }).select('_id name points description collectionInfo');
    
            const allRewards = [
                {
                    _id: 'your-points-id',
                    name: "Your points",
                    points: userPoints,
                    description: "Redeem your earned points",
                    collectionInfo: "Points earned from reporting and collecting waste"
                },
                ...availableRewards
            ];
    
            return allRewards;
    
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
            createdAt: task.createdAt.toISOString().split('T')[0]
        }))
    } catch (error) {
        console.error("Error fetching waste collection tasks:", error);
        return []; 
    }
}



export async function updateTaskStatus(reportId: string, newStatus: string, collectorId?: string) {
    try {
      
      const updateData: any = { status: newStatus };

      if (collectorId) {
        updateData.collectorId = new mongoose.Types.ObjectId(collectorId); 
      }
  
     
      const updatedReport = await Reports.findByIdAndUpdate(
        reportId,       
        { $set: updateData }, 
        { new: true }     
      ).lean(); 
  
      return updatedReport;
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
  
      return reward;

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
  
      return collectedWaste;
    } catch (error) {
      console.error("Error saving collected waste:", error);
      throw error;
    }
  }
"use server"
import { Users,Notifications, Transactions, Reports,Rewards} from "../models/schema"
import connectDB from "./dbConfig";


export const createUser= async(email:string,name:string): Promise<any | null>=>{

    try {
        await connectDB();
        const  user=await Users.create({
            email,
            name
        });
         
        return user;
        
    } catch (error) {
        console.error("Error creating user",error)
        return null;
        
    }
};



export const getUserByEmail=async(email: string): Promise<any | null>=>{
    try {
        
        await connectDB();
        const user=await Users.findOne({email})
         return user;
    } catch (error) {
        console.error("Error fetching user by email",error);
        return null;
    }
}


export async function getUnreadNotifications(userId: string | number){
    try {
        
        await connectDB();
         return await Notifications.find({
            userId,
            isRead: false
        });
        
    } catch (error) {
        console.error("Error fetching unraed notifications",error);
        return null
    }
}

export async function getUserBalance(userId: string | number): Promise<number>{
    try {

        await connectDB();
        const transactions = await getRewardTransactions(userId) || []; 
        if(!transactions) return 0;
         const balance= transactions?.reduce((acc:number, transaction:any)=> {
            return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount;
         },0)

         return Math.max(balance,0)

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

        await connectDB();
        await Notifications.updateOne({ _id: notificationId},{
           $set : {isRead:true }
        });
        
    } catch (error) {
        console.error("Error in mark notifications",error);
        return null
    }
}


export async function createReport(userId:number,location:string,wasteType:string,
    amount:string,imageUrl:string,verificationResult?:any){

        try {
            const report = await Reports.create({
                user_id: userId,
                location,
                wasteType,
                amount,
                imageUrl,
                verification_result: verificationResult,
                status: 'pending',
            })
            
            const pointsEarned=10;
              await updateRewardPoints(userId, pointsEarned)
              await createTransactions(userId , 'earned_report', pointsEarned,'Points earned for reporting waste')
              await createNotification(userId, `You've earned ${pointsEarned} points for reporting waste!`,'reward')

            return report;
        } catch (error) {
            console.error("Error creating report",error)
            return null;
            
        }
}


export async function updateRewardPoints(userId:number,PointsToAdd:number){
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


    export async function createTransactions(userId:number,type: 'earned_report' | 'earned_collect' | 'redeemed',
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


    export async function createNotification(userId:number,message:string,type:string){
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
    }
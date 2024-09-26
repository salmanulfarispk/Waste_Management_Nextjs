"use server"
import { Users,Notifications, Transactions} from "../models/schema"
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
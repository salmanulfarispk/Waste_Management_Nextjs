"use client"

import { useState,useEffect } from "react"
import { Coins, ArrowUpRight, ArrowDownRight, Gift, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createTransactions, getAvailableRewards, getRewardTransactions, getUserByEmail, redeemReward } from "@/lib/actions"



type Transaction = {
    _id: string
    type: 'earned_report' | 'earned_collect' | 'redeemed'
    amount: number
    description: string
    date: string
  }
  
  type Reward = {
    _id: string
    name: string
    points: number
    description: string | null
    collectionInfo: string
  }
  


export default function RewardsPage(){

    const [user, setUser] = useState<{ _id: string; email: string; name: string } | null>(null)
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)

      
    // console.log(rewards.map(r=> r._id));

  useEffect(()=>{
   
    const fetchUserDataAndRewards = async()=>{
        setLoading(true)

        try {

            const userEmail=localStorage.getItem("userEmail")
            if(userEmail){
                const fetchUser= await getUserByEmail(userEmail)
               
                
                if(fetchUser){
                    setUser({_id:fetchUser._id,email:fetchUser.email, name:fetchUser.name})

                    const fetchTransactions= await getRewardTransactions(fetchUser._id)
                    setTransactions(fetchTransactions as Transaction[])

                    const fetchedRewards= await getAvailableRewards(fetchUser._id)
                    
                    
                    setRewards(fetchedRewards.filter(r => r.points > 0)) 

                    const calculatedBalance = (fetchTransactions ?? []).reduce((acc, transaction) => {
                        const amount = transaction.amount ?? 0;   //If trans.amount is null or undefined, return 0.otherwise return tran.amonut
                        return transaction.type.startsWith('earned') ? acc + amount : acc - amount;
                    }, 0);
                    
                    setBalance(Math.max(calculatedBalance, 0));// ensures the returned value is not less than zero. 

                }else{
                    toast.error('User not found. Please log in again.')
                }

            }else{
                toast.error('User not logged in. Please log in.')
            }
            
        } catch (error) {
            console.error('Error fetching user data and rewards:', error)
            toast.error('Failed to load rewards data. Please try again.')
        }finally {
            setLoading(false)
          }
    }


    fetchUserDataAndRewards();

  },[])

  
  const handleRedeemReward = async (rewardId: string) => {
    if (!user) {
      toast.error('Please log in to redeem rewards.')
      return
    }
    
          
    const reward = rewards.find(r => r._id === rewardId);
    
    
    if (reward && balance >= reward.points && reward.points > 0) {
      
       
      try {
        if (balance < reward.points) {
          toast.error('Insufficient balance to redeem this reward')
          return
        }
          
          
        await redeemReward(user._id, rewardId);
        
        await createTransactions(user._id, 'redeemed', reward.points, `Redeemed ${reward.name}`);

        await refreshUserData();

        toast.success(`You have successfully redeemed: ${reward.name}`)
      } catch (error) {
        console.error('Error redeeming reward:', error)
        toast.error('Failed to redeem reward. Please try again.')
      }
    } else {
      toast.error('Insufficient balance or invalid reward cost')
    }
  }
     

  const handleRedeemAllPoints = async () => {
    if (!user) {
      toast.error('Please log in to redeem points.');
      return;
    }

    if (balance > 0) {
      try {

        await redeemReward(user._id, "0");
        
        await createTransactions(user._id, 'redeemed', balance, 'Redeemed all points');

        await refreshUserData();

        toast.success(`You have successfully redeemed all your points!`);
      } catch (error) {
        console.error('Error redeeming all points:', error);
        toast.error('Failed to redeem all points. Please try again.');
      }
    } else {
      toast.error('No points available to redeem')
    }
  }

  const refreshUserData = async () => {
    if (user) {
      const fetchedUser = await getUserByEmail(user.email);
      if (fetchedUser) {
        const fetchedTransactions = await getRewardTransactions(fetchedUser.id);
        
        console.log(fetchedTransactions);
        
        const validTransactions = fetchedTransactions ?? []; 
        setTransactions(validTransactions as Transaction[]);
  
        const fetchedRewards = await getAvailableRewards(fetchedUser.id);
        setRewards(fetchedRewards.filter(r => r.points > 0)); 
  
        const calculatedBalance = validTransactions.reduce((acc, transaction) => {
          return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount;
        }, 0);
        
        setBalance(Math.max(calculatedBalance, 0)); // Ensure balance is never negative
      }
    }
  };
  
 

    
  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <Loader className="animate-spin h-8 w-8 text-gray-600" />
    </div>
  }

    return (
        <div className="p-8 max-w-4xl mx-auto">
         <h1 className="text-3xl font-semibold mb-6 text-gray-800">Rewards</h1>


         <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full border-l-4 border-green-500 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Reward Balance</h2>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center">
            <Coins className="w-10 h-10 mr-3 text-green-500" />
            <div>
              <span className="text-4xl font-bold text-green-500">{balance}</span>
              <p className="text-sm text-gray-500">Available Points</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Recent Transactions</h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {transactions.length > 0 ? (
              transactions.map(transaction => (
                <div key={transaction._id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    {transaction.type === 'earned_report' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-500 mr-3" />
                    ) : transaction.type === 'earned_collect' ? (
                      <ArrowUpRight className="w-5 h-5 text-blue-500 mr-3" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${transaction.type.startsWith('earned') ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type.startsWith('earned') ? '+' : '-'}{transaction.amount}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No transactions yet</div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Available Rewards</h2>
          <div className="space-y-4">
            {rewards.length > 0 ? (
              rewards.map(reward => (
                <div key={reward._id} className="bg-white p-4 rounded-xl shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{reward.name}</h3>
                    <span className="text-green-500 font-semibold">{reward.points} points</span>
                  </div>
                  <p className="text-gray-600 mb-2">{reward.description}</p>
                  <p className="text-sm text-gray-500 mb-4">{reward.collectionInfo}</p>
                  {reward._id === '0'? ( 
                    <div className="space-y-2">
                      <button 
                        onClick={handleRedeemAllPoints}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                        disabled={balance === 0}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Redeem All Points
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleRedeemReward(reward._id)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center py-2 rounded-md"
                      disabled={balance < reward.points}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Reward 
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-yellow-400 mr-3" />
                  <p className="text-yellow-700">No rewards available at the moment.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

          

        </div>
    )
}
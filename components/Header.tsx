"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu ,Coins,Leaf,Search,Bell,User,ChevronDown,LogIn,LogOut} from "lucide-react"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK} from "@web3auth/base"
import { EthereumPrivateKeyProvider} from "@web3auth/ethereum-provider"
import { createUser, getUnreadNotifications, getUserBalance, getUserByEmail,markNotificationAsRead } from "@/utils/db/actions"
// import { useMediaQuery } from ""




const clientId = process.env.WEB3_AUTH_CLIENT_ID ;



const chainConfig={
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0xaa36a7',      //from chainlist
    rpcTarget: 'https://rpc.ankr.com/eth_sepolia',
    displayName: 'Sepolia Testnet',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    logo: 'https://assets.web3auth.io/evm-chains/sepolia.png'
};

const privateKeyProvider= new EthereumPrivateKeyProvider({
    config: {chainConfig}
})

const web3Auth= new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
    privateKeyProvider
})


interface HeaderProps{
  onMenuClick: ()=> void;
  totalEarnings: number;
}

const Header = ({ onMenuClick, totalEarnings }: HeaderProps) => {

const [provider,setProvider]=useState<IProvider | null>(null)
const [loggedIn,setLoggedIn]=useState(false)
const [loading,setLoading]=useState(true)
const [userInfo,setUserInfo]=useState<any>(null)
const pathname=usePathname()
const [notification,setNotification]=useState<Notification[]>([])
const [balace,setBalance]=useState(0)


   useEffect(()=>{
      const init= async()=>{
        try {
            await web3Auth.initModal();
            setProvider(web3Auth.provider)

            if(web3Auth.connected){
                setLoggedIn(true)
                const user= await web3Auth.getUserInfo()
                setUserInfo(user)

                if(user.email){
                    localStorage.setItem('userEmail',user.email)
                    try {
                    await createUser(user?.email,user.name || "Anonymous user")
                    } catch (error) {
                        console.error("Error in creating user",error);
                        
                    }
                }
            }
        } catch (error) {
            console.error("Error in initializing  web3auth",error);
            
        }finally{
            setLoading(false)
        }
      };

        init()
   },[])


      useEffect(()=>{
        const fetchNotifications= async()=> {
            try {
                if(userInfo && userInfo.email){
                    const user= await getUserByEmail(userInfo.email)
                    if(user){
                        const unreadNotifications= await getUnreadNotifications(user._id)
                        setNotification(unreadNotifications)
                    }
                }
            } catch (error) {
            console.error("Error in fetching notifications",error);
            }
        }

          fetchNotifications();

          const notificationInterval= setInterval(fetchNotifications,30000)
          return ()=> clearInterval(notificationInterval)
          
      },[userInfo]);



        useEffect(()=>{
          const fetchUserBalance= async()=>{
            try {
                if(userInfo && userInfo){
                    const user=await getUserByEmail(userInfo.email)
                    if(user){
                        const userBalance= await getUserBalance(user._id)
                        setBalance(userBalance)
                    }
                }
            } catch (error) {
            console.error("Error in fetching balance",error);
            }
          }

            fetchUserBalance();

            const handleBalanceUpdate= (event: CustomEvent)=>{
               setBalance(event.detail)
            }

             window.addEventListener('balanceUpdate',handleBalanceUpdate  as EventListener)

             return ()=>{
             window.removeEventListener('balanceUpdate',handleBalanceUpdate  as EventListener)   
             }

        },[userInfo])



      const login=async()=>{
        if(!web3Auth) {
           console.log("WQeb3Auth is not initialized");
           return;  
        }

        try {
            const web3authProvider =await web3Auth.connect();
             setProvider(web3authProvider)
             setLoggedIn(true)

             const user=await web3Auth.getUserInfo();
             setUserInfo(user);

             if(user.email){
                localStorage.setItem('userEmail', user.email);
                try {
                    await createUser(user.email, user.name || 'Anonymous User');
                 } catch (error) {
                  console.log("Error in Creating user.. ",error); 
                 }
             }
        } catch (error) {
            console.log("Error logging in ",error);
        }
      };




      const logout= async()=>{
        if(!web3Auth) {
            console.log("WQeb3Auth is not initialized");
            return;  
         }

         try {
             await web3Auth.logout();
             setProvider(null)
             setLoggedIn(false)
             setUserInfo(null)
             localStorage.removeItem("userEmail")
         } catch (error) {
            console.log("Error in  logged out ",error);
            
         }
      };


      const getUserInfo= async()=>{
         if(web3Auth.connected){
            const user= await web3Auth.getUserInfo()
            setUserInfo(user)

            if(user.email){
                localStorage.setItem('userEmail', user.email);
                try {
                    await createUser(user.email, user.name || 'Anonymous User');
                 } catch (error) {
                  console.log("Error in Creating user.. ",error); 
                 }
             }
         }
      };


      const handleNotificationClick = async(notificatinId: string | number)=>{
           await markNotificationAsRead(notificatinId)
      };
      

      if(loading){
        return <div>Loading web3 auth.....</div>
      }




  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center">
            <button className="btn mr-2 md:mr-4" onClick={onMenuClick}>
                 <Menu className="h-6 w-6" />
            </button>
            </div>
        </div>
    </header>
  )
}

export default Header
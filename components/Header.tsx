"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu ,Coins,Leaf,Search,Bell,User,ChevronDown,LogIn,LogOut} from "lucide-react"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK} from "@web3auth/base"
import { EthereumPrivateKeyProvider} from "@web3auth/ethereum-provider"
import { createUser, getUnreadNotifications, getUserBalance, getUserByEmail,markNotificationAsRead } from "@/lib/actions"
import { useMediaQuery } from "@/hooks/useMediaQuery"





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
    clientId:process.env.WEB3_AUTH_CLIENT_ID as any,
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
const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
const pathname=usePathname()
const [notification,setNotification]=useState<Notification[]>([])
const [balance,setBalance]=useState(0)

const isMobile= useMediaQuery("(max-width: 768px)");

useEffect(() => {
  const init = async () => {
    try {
      await web3Auth.initModal();
      setProvider(web3Auth.provider);

      if (web3Auth.connected) {
        setLoggedIn(true);
        const user = await web3Auth.getUserInfo();

        setUserInfo({
          email: user.email as string,
          name: user.name || "Anonymous User",
        });


        if (user.email) {
          localStorage.setItem("userEmail", user.email);
          try {
            const createdUser = await createUser(user.email, user.name || "Anonymous User");
            
          } catch (error) {
            console.error("Error in creating user", error);
          }
        }
      } else {
      
        localStorage.removeItem("userEmail");
        setLoggedIn(false);
      }
    } catch (error) {
      console.error("Error in initializing web3auth", error);
    } finally {
      setLoading(false);
    }
  };

  init(); 
}, []); 


 useEffect(() => {
  const fetchNotifications = async () => {
    try {
        if (userInfo && userInfo.email) {
            const user = await getUserByEmail(userInfo.email);
            if (user) {
                const unreadNotifications = await getUnreadNotifications(user._id) as any;
                if (Array.isArray(unreadNotifications)) {
                    setNotification(unreadNotifications); 
                } else {
                    console.error("No unread notifications found or error occurred");
                }
            } else {
                console.error("User not found");
            }
        }
    } catch (error) {
        console.error("Error in fetching notifications", error);
    }
};

  fetchNotifications();

  const notificationInterval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(notificationInterval);

}, [userInfo]);


useEffect(() => {
  const fetchUserBalance = async () => {
      try {
          if (userInfo && userInfo.email) {
              const user = await getUserByEmail(userInfo.email);
              
              
              if (user) {
                  const plainUser = JSON.parse(JSON.stringify(user)); 
                  const userBalance = await getUserBalance(plainUser._id);
                  setBalance(userBalance);
              }
          }
      } catch (error) {
          console.error("Error in fetching balance", error);
      }
  };

  fetchUserBalance();

  const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail);
  };

  window.addEventListener('balanceUpdate', handleBalanceUpdate as EventListener);

  return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
  };
}, [userInfo]);



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
             setUserInfo({
              email: user.email as string,
              name: user.name as string
            })

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
             localStorage.removeItem("userEmail")
             localStorage.removeItem("Web3Auth-cachedAdapter");
             localStorage.removeItem("auth_store");
             setLoggedIn(false)
             setUserInfo(null)

         } catch (error) {
            console.log("Error in  logged out ",error);
            
         }
      };


      const getUserInfo= async()=>{
         if(web3Auth.connected){
            const user= await web3Auth.getUserInfo()
            setUserInfo({
              email: user.email as string,
              name: user.name as string
            })

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
                 <Menu className="h-5 w-5 text-gray-800" />
            </button>
            <Link href='/' className="flex items-center">
               <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2"/>
               <span className="font-bold text-base md:text-lg text-gray-800">WasteZen</span>
            </Link>
            </div>

           {!isMobile && (
                <div className="flex-1 max-w-xl mx-4">
                   <div className="relative">
                        <input
                        type="text"
                        placeholder="search...."
                        className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 opacity-70"/>
                   </div>
                </div>
             )}

          <div className="flex items-center">
                { isMobile && (
                  <button className="btn mr-2">
                    <Search className="h-5 w-5" />
                 </button>
                )}
    <div>
    <details className="dropdown dropdown-bottom dropdown-end">
    <summary className="btn mr-2 relative bg-transparent shadow-none border-none hover:bg-gray-100">
    <Bell className="h-5 w-5 text-gray-800"/>
          {notification.length > 0 &&(
                 <div className="badge badge-neutral px-2 min-w-[1.2rem] h-5">
                   {notification.length}
                 </div>
                 )}
     </summary>
      <div className="menu dropdown-content bg-base-100 rounded-md z-[1] w-64 p-1 shadow">
        {notification.length > 0 ? (
            
            notification.map((notific:any)=> (
              <div  key={notific._id}
               onClick={()=> handleNotificationClick(notific._id)}
                className="flex flex-col p-3"
               >
               <span className="font-medium">{notific.type}</span>
               <span className="text-sm text-gray-500">{notific.message}</span>   
             </div>   
            ))
             
        ):(
            <div className="flex flex-col w-full h-fit">
             <span className="font-medium hover:bg-gray-100 p-2 rounded-md">No new notifications</span>
             </div>
        )}

      </div>
       </details>
       </div>    


         <div className="mr-2 md:mr-2 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
            <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500"/>
            <span className="font-semibold text-sm md:text-base text-gray-800">
              {balance.toFixed(2)}
            </span>
         </div>


           {!loggedIn ? (

                <button className="py-2 px-3 rounded-md  bg-green-600 hover:bg-green-700 text-white text-sm md:text-base" onClick={login}>
                    <span className="flex">Login
                   <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5 mt-[.1rem]"/>
                    </span>
                </button>

           ): (

            <div className="dropdown dropdown-hover  dropdown-bottom dropdown-end">
            <div tabIndex={0} role="button" className="px-3 py-2 rounded-md m-1 items-center flex bg-transparent hover:bg-gray-50">
                <User className="h-5 w-5 mr-1"/>
                <ChevronDown className="w-4 h-4"/>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-md z-[1] w-fit p-1 shadow font-semibold">
              <li onClick={getUserInfo}>
                <a>{userInfo ?  userInfo.name : "Profile"}</a>
              </li>
              <li>
                <Link href={'/settings'}>
                   Settings
                </Link>
              </li>
              <li onClick={logout}>
                <a>
                Logout
                </a>
              </li>
            </ul>
             </div>
           )}

          </div>    
         </div>
    </header>
  )
}

export default Header
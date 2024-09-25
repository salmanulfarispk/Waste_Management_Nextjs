"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu ,Coins,Leaf,Search,Bell,User,ChevronDown,LogIn,LogOut} from "lucide-react"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK} from "@web3auth/base"
import { EthereumPrivateKeyProvider} from "@web3auth/ethereum-provider"
import { createUser, getUnreadNotifications, getUserBalance, getUserByEmail } from "@/utils/db/actions"
// import { useMediaQuery } from ""




const clientId = process.env.WEB3_AUTH_CLIENT_ID;

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
    config: chainConfig
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

  return (
    <div>Header</div>
  )
}

export default Header
"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu ,Coins,Leaf,Search,Bell,User,ChevronDown,LogIn,LogOut} from "lucide-react"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK} from "@web3auth/base"
import { EthereumPrivateKeyProvider} from "@web3auth/ethereum-provider"
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
                    await createUser(user.name,user.email)
                }
            }
        } catch (error) {
            
        }
      }
   },[])

  return (
    <div>Header</div>
  )
}

export default Header
"use client"
// import "./globals.css";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });



// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//         {children}
//       </body>
//     </html>
//   );
// }

import { useState, useEffect } from "react"
import { Inter } from "next/font/google"
import "./globals.css";
import { Toaster } from "react-hot-toast"
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";



const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {


  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {

  }, [])

  return (

    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen min-w-full bg-gray-50 flex flex-col">

          {/* header */}
               <Header onMenuClick={()=> setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings} />

                <div className="flex flex-1">
                 {/* sidebar */}
                  <Sidebar open={sidebarOpen}/>

                 <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64  transition-all duration-300">
                   {children}
                 </main>
                 </div>
        </div>

        <Toaster
          position="bottom-right"
          reverseOrder={true}
        />
      </body>
    </html>
  )
}
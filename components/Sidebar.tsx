import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Trash, Coins, Medal, Settings, Home } from "lucide-react";

const sidebarItems = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/report",
    label: "Report Waste",
    icon: MapPin,
  },
  {
    href: "/collect",
    label: "Collect Waste",
    icon: Trash,
  },
  {
    href: "/reward",
    label: "Rewards",
    icon: Coins,
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Medal,
  },
];

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-white border-r pt-20 border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30
             transform transition-transform duration-300 ease-in-out ${
               open ? "translate-x-0" : "-translate-x-full"
             } lg:translate-x-0`}
    >
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6 space-y-8">
          {sidebarItems.map((item) => (
            <Link href={item.href} key={item.href}>
              <div
                className={`flex items-center w-full justify-start py-3 px-3 rounded-lg transition-colors duration-300
                 ${
                   pathname === item.href
                     ? "bg-green-100 text-green-800 hover:bg-green-200"
                     : "text-gray-600 hover:bg-gray-100"
                 }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span className="text-base font-semibold">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <Link href="/settings">
            <div
              className={`flex items-center w-full justify-start py-3 px-3 rounded-lg transition-colors duration-300
                 ${
                   pathname === "/settings"
                     ? "bg-green-700 text-white hover:bg-green-600 hover:text-white"
                     : "text-gray-600 hover:bg-gray-100"
                 }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              <span className="text-base font-semibold">Settings</span>
            </div>
          </Link>
        </div>
      </nav>
    </aside>
  );
}

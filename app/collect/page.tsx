import { useState, useEffect } from "react";
import { Clock, Upload, Loader, Calendar, Weight, Search } from "lucide-react";
import toast from "react-hot-toast";

type collectionTask = {
  _id: number;
  location: string;
  wasteType: string;
  amount: string;
  status: "pending" | "in_progress" | "completed" | "verified";
  data: string;
  collecterId: number | null;
};

const ITEMS_PER_PAGE = 5;

export default function CollectPage() {
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);
  return <></>;
}

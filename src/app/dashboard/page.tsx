"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Leaf, Zap, Flame, TrendingDown, Award, Send, LogOut,
  Map, Shield, ChevronRight, Check, Sparkles, Trophy, BarChart3, Globe,
  ShoppingBag, Download, Lock, CreditCard, Star, ShieldCheck, List, ChevronDown,
  Clock, Cog, Users, Bell, HelpCircle, TrendingUp, Activity, ArrowUpRight,
  ArrowDownRight, MoreHorizontal, Eye, Target, Lightbulb, Plus
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

interface UserData {
  id: string;
  username: string;
  role: string;
  sustainabilityScore: number;
  totalCarbonFootprint: number;
  streakCount: number;
  level: number;
  xp: number;
  fullName: string;
  place: string;
  defaultRegion: string;
  baselineCo2: number;
}

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  co2Emission: number;
  timestamp: string;
  formulaUsed: string;
  sourceDetails: string;
}

interface Quest {
  id: string;
  questId: string;
  title: string;
  description: string;
  xpReward: number;
  co2Reduction: number;
  completed: boolean;
}

const SAFETY_LEVELS = [
  { level: 1, name: "Eco-Champion", max: 2.0, color: "#10b981", emoji: "🟢", bg: "rgba(16,185,129,0.12)" },
  { level: 2, name: "Eco-Friendly", max: 5.0, color: "#06b6d4", emoji: "🌐", bg: "rgba(6,182,212,0.12)" },
  { level: 3, name: "Moderate", max: 15.0, color: "#f59e0b", emoji: "🟡", bg: "rgba(245,158,11,0.12)" },
  { level: 4, name: "Elevated", max: 30.0, color: "#f97316", emoji: "🟠", bg: "rgba(249,115,22,0.12)" },
  { level: 5, name: "Critical", max: Infinity, color: "#ef4444", emoji: "🔴", bg: "rgba(239,68,68,0.12)" },
];

const PIE_COLORS = ["#10b981", "#06b6d4", "#a855f7", "#f59e0b", "#ef4444", "#f97316"];

const CATEGORY_ICONS: Record<string, string> = {
  transportation: "🚗",
  food: "🍔",
  electricity: "⚡",
  fuel: "🔥",
  delivery: "📦",
  plastic: "♻️",
  offset: "🌱",
};

function getSafetyLevel(co2: number) {
  for (const lvl of SAFETY_LEVELS) {
    if (co2 <= lvl.max) return lvl;
  }
  return SAFETY_LEVELS[4];
}

function getPlanetCount(co2: number) {
  if (co2 <= 0) return 0;
  return Math.round((co2 / 6.3) * 10) / 10;
}

function ConfettiOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {Array.from({ length: 60 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 1.5 + Math.random() * 2.5;
        const color = ["#10b981", "#06b6d4", "#a855f7", "#f59e0b", "#ef4444", "#f97316"][i % 6];
        const size = 6 + Math.random() * 8;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${left}vw`, rotate: 0, opacity: 1 }}
            animate={{
              y: "105vh",
              x: `${left + (Math.random() * 20 - 10)}vw`,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: 0.1
            }}
            transition={{ duration, delay, ease: "linear", repeat: 0 }}
            style={{
              position: "absolute",
              width: size,
              height: size,
              background: color,
              borderRadius: i % 2 === 0 ? "50%" : "3px",
              boxShadow: `0 0 10px ${color}80`
            }}
          />
        );
      })}
    </div>
  );
}

const MANUAL_CATEGORIES = [
  { id: "transportation", label: "🚗 Transportation" },
  { id: "food", label: "🍔 Food & Diet" },
  { id: "electricity", label: "⚡ Electricity" },
  { id: "fuel", label: "🔥 Household Fuel" },
  { id: "delivery", label: "📦 Deliveries" },
  { id: "plastic", label: "♻️ Plastics & Waste" },
  { id: "offset", label: "🌱 Offsets & Green Acts" }
];

const MANUAL_SUBCATEGORIES: Record<string, { id: string; label: string; unit: string }[]> = {
  transportation: [
    { id: "petrol-car", label: "Petrol Car", unit: "km" },
    { id: "diesel-car", label: "Diesel Car", unit: "km" },
    { id: "electric-car", label: "Electric Car", unit: "km" },
    { id: "bus-travel", label: "Bus Travel", unit: "km" },
    { id: "train-travel", label: "Train Travel", unit: "km" },
    { id: "flight-short-haul", label: "Short-haul Flight", unit: "km" },
    { id: "flight-long-haul", label: "Long-haul Flight", unit: "km" },
    { id: "bike-travel", label: "Bicycle / Walking", unit: "km" },
    { id: "auto-rickshaw", label: "Auto Rickshaw", unit: "km" },
    { id: "motorcycle", label: "Motorcycle / Scooter", unit: "km" }
  ],
  food: [
    { id: "beef-diet", label: "Beef", unit: "kg" },
    { id: "lamb-diet", label: "Lamb", unit: "kg" },
    { id: "chicken-diet", label: "Chicken", unit: "kg" },
    { id: "fish-diet", label: "Fish", unit: "kg" },
    { id: "egg-diet", label: "Egg", unit: "kg" },
    { id: "rice-diet", label: "Rice", unit: "kg" },
    { id: "vegetarian-meal", label: "Vegetarian Meal", unit: "meal" },
    { id: "vegan-meal", label: "Vegan Meal", unit: "meal" },
    { id: "biryani-chicken", label: "Chicken Biryani", unit: "plate" },
    { id: "biryani-mutton", label: "Mutton Biryani", unit: "plate" },
    { id: "biryani-veg", label: "Vegetable Biryani", unit: "plate" }
  ],
  electricity: [
    { id: "grid-power-GLOBAL", label: "Grid Power (Global Avg)", unit: "kWh" },
    { id: "grid-power-IN", label: "Grid Power (India)", unit: "kWh" },
    { id: "grid-power-US", label: "Grid Power (USA)", unit: "kWh" },
    { id: "grid-power-UK", label: "Grid Power (UK)", unit: "kWh" }
  ],
  fuel: [
    { id: "petrol-fuel", label: "Petrol Fuel", unit: "litre" },
    { id: "diesel-fuel", label: "Diesel Fuel", unit: "litre" },
    { id: "lpg-fuel", label: "LPG Gas", unit: "litre" },
    { id: "natural-gas", label: "Natural Gas", unit: "m³" }
  ],
  delivery: [
    { id: "delivery-package", label: "Online Shopping Package", unit: "order" },
    { id: "food-delivery", label: "Food Delivery Order", unit: "order" }
  ],
  plastic: [
    { id: "single-use-bottle", label: "Single-use Plastic Bottle", unit: "item" },
    { id: "plastic-bag", label: "Single-use Plastic Bag", unit: "item" },
    { id: "mixed-plastic", label: "Mixed Plastic Waste", unit: "kg" }
  ],
  offset: [
    { id: "plant-tree", label: "Tree Planted", unit: "tree" },
    { id: "solar-funding", label: "Solar Funding Block", unit: "block" },
    { id: "wind-funding", label: "Wind Funding Block", unit: "block" }
  ]
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [nlpInput, setNlpInput] = useState("");
  const [nlpLoading, setNlpLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"dashboard" | "activity-logger" | "analytics" | "quests" | "marketplace" | "community" | "history" | "settings">("dashboard");
  const [checkoutItem, setCheckoutItem] = useState<{
    type: "project" | "subscription";
    id: string;
    title: string;
    price: string;
    co2Reduction: number;
    xpReward: number;
  } | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [completedSponsored, setCompletedSponsored] = useState<string[]>([]);
  const [logMethod, setLogMethod] = useState<"ai" | "manual">("ai");
  const [manualCategory, setManualCategory] = useState("transportation");
  const [manualSubcategory, setManualSubcategory] = useState("petrol-car");
  const [manualQuantity, setManualQuantity] = useState<number | "">("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [customOffset, setCustomOffset] = useState(100);
  const [theme, setTheme] = useState<string>("default");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPlace, setEditPlace] = useState("");
  const [editAge, setEditAge] = useState<number | "">("");
  const [editGender, setEditGender] = useState("");
  const [editRegion, setEditRegion] = useState("Global");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("all");
  const [questsFilter, setQuestsFilter] = useState<"all" | "active" | "completed">("all");

  const quotes = [
    "Small choices today, a better planet tomorrow. 🌿",
    "We do not inherit the Earth from our ancestors; we borrow it from our children.",
    "The greatest threat to our planet is the belief that someone else will save it.",
    "Small acts, when multiplied by millions of people, can transform the world.",
  ];
  const [currentQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("carbon-theme") || "default";
    setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);
    const savedPlan = localStorage.getItem("carbon-premiumPlan");
    if (savedPlan) setPremiumPlan(savedPlan);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    if (newTheme !== "default" && !premiumPlan) {
      toast.error("Premium Visual Theme! Subscribe to unlock. 👑");
      setActiveView("marketplace");
      return;
    }
    setTheme(newTheme);
    localStorage.setItem("carbon-theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
    toast.success(`Theme updated to ${newTheme}! 🎨`);
  };

  const handleCategoryChange = (cat: string) => {
    setManualCategory(cat);
    const subs = MANUAL_SUBCATEGORIES[cat];
    if (subs && subs.length > 0) setManualSubcategory(subs[0].id);
  };

  const handleManualSubmit = async () => {
    if (!manualQuantity || Number(manualQuantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    setManualLoading(true);
    try {
      const selectedSub = MANUAL_SUBCATEGORIES[manualCategory]?.find(s => s.id === manualSubcategory);
      const label = selectedSub?.label || manualSubcategory;
      const unit = selectedSub?.unit || "";
      const name = manualDescription.trim() || `${label} (${manualQuantity} ${unit})`;
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: manualCategory, subcategory: manualSubcategory, quantity: Number(manualQuantity), unit }),
      });
      if (res.ok) {
        toast.success("Activity recorded! 🌿");
        setManualQuantity("");
        setManualDescription("");
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to record activity");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setManualLoading(false);
    }
  };

  const sponsoredQuests = [
    { id: "sp-tesla", title: "Tesla Model 3/Y Test Drive", brand: "Tesla", description: "Book and complete a carbon-free test drive of an electric vehicle.", xpReward: 500, co2Reduction: 10.0, subcategory: "solar-funding", quantity: 0.2, buttonText: "Book Test Drive", color: "#e82127" },
    { id: "sp-oatly", title: "Oatly Plant-Milk Swap", brand: "Oatly", description: "Swap standard dairy milk with Oatly Oatmilk for your breakfast or beverage.", xpReward: 150, co2Reduction: 1.5, subcategory: "plant-tree", quantity: 0.069, buttonText: "Claim Oatly Reward", color: "#bfbc9d" },
    { id: "sp-sunrun", title: "Sunrun Solar Consultation", brand: "Sunrun", description: "Get a free 5-minute home solar virtual estimate.", xpReward: 600, co2Reduction: 25.0, subcategory: "solar-funding", quantity: 0.5, buttonText: "Get Solar Quote", color: "#ffc20e" },
  ];

  const handleCompleteSponsoredQuest = async (quest: typeof sponsoredQuests[0]) => {
    if (completedSponsored.includes(quest.id)) return;
    const loadingToast = toast.loading(`Connecting to ${quest.brand}...`);
    try {
      const logRes = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Sponsored: ${quest.brand} - ${quest.title}`, category: "offset", subcategory: quest.subcategory, quantity: quest.quantity, unit: quest.subcategory === "plant-tree" ? "tree" : "block" }),
      });
      if (!logRes.ok) { toast.dismiss(loadingToast); toast.error("Failed to register sponsored offset"); return; }
      const xpMultiplier = premiumPlan ? 2 : 1;
      const earnedXp = quest.xpReward * xpMultiplier;
      const newXp = (user?.xp || 0) + earnedXp;
      const newLevel = Math.floor(newXp / 500) + 1;
      await fetch("/api/auth/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ xp: earnedXp, level: newLevel }) });
      toast.dismiss(loadingToast);
      toast.success(`Completed! +${earnedXp} XP & -${quest.co2Reduction} kg CO₂ offset! 🎉`);
      setCompletedSponsored(prev => [...prev, quest.id]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      fetchData();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Connection error completing sponsored quest");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, activitiesRes, questsRes] = await Promise.all([
        fetch("/api/auth/profile"),
        fetch("/api/activities"),
        fetch("/api/quests"),
      ]);
      if (!profileRes.ok) { router.push("/"); return; }
      const profileData = await profileRes.json();
      setUser(profileData.user);
      if (profileData.user) {
        setEditFullName(profileData.user.fullName || "");
        setEditPlace(profileData.user.place || "");
        setEditAge(profileData.user.age || "");
        setEditGender(profileData.user.gender || "");
        setEditRegion(profileData.user.defaultRegion || "Global");
      }
      if (activitiesRes.ok) { const actData = await activitiesRes.json(); setActivities(actData.activities || []); }
      if (questsRes.ok) { const questData = await questsRes.json(); setQuests(questData.quests || []); }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/leaderboard?limit=15");
      if (res.ok) { const data = await res.json(); setLeaderboard(data.leaderboard || []); }
    } catch { toast.error("Failed to load leaderboard"); }
    finally { setLeaderboardLoading(false); }
  };

  useEffect(() => { if (activeView === "community") fetchLeaderboard(); }, [activeView]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: editFullName, place: editPlace, age: editAge === "" ? undefined : Number(editAge), gender: editGender }),
      });
      if (res.ok) { toast.success("Profile updated! 👤"); fetchData(); }
      else toast.error("Failed to update profile");
    } catch { toast.error("Connection error"); }
    finally { setProfileSubmitting(false); }
  };

  // Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayActivities = activities.filter(a => a.timestamp.split("T")[0] === todayStr);
  const todayCo2 = todayActivities.reduce((sum, a) => sum + a.co2Emission, 0);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const yesterdayCo2 = activities.filter(a => a.timestamp.split("T")[0] === yesterdayStr).reduce((sum, a) => sum + a.co2Emission, 0);
  const co2Delta = yesterdayCo2 > 0 ? Math.round(((todayCo2 - yesterdayCo2) / yesterdayCo2) * 100) : 0;
  const safetyLevel = getSafetyLevel(todayCo2);
  const planetCount = getPlanetCount(todayCo2);

  // Weekly chart data
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const dayActs = activities.filter(a => a.timestamp.split("T")[0] === ds);
    const dayCo2 = dayActs.reduce((sum, a) => sum + a.co2Emission, 0);
    weeklyData.push({ day: d.toLocaleDateString("en", { weekday: "short" }), co2: Math.round(dayCo2 * 100) / 100 });
  }

  // Sparkline (mini chart data for stat cards)
  const sparklineData = weeklyData.map(d => ({ v: d.co2 }));
  const weeklyAverage = weeklyData.reduce((sum, d) => sum + d.co2, 0) / 7;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  activities.forEach(a => { categoryMap[a.category] = (categoryMap[a.category] || 0) + a.co2Emission; });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    rawName: name,
    value: Math.round(value * 100) / 100,
  }));
  const totalCo2 = pieData.reduce((s, d) => s + d.value, 0);

  // AI Insights
  const aiInsights = [
    { icon: "🌿", text: `Your transportation emissions are lower than ${Math.max(50, 100 - Math.floor(todayCo2 * 5))}% of users this week. Great job! 🎉`, color: "#10b981" },
    { icon: "🚌", text: `Using public transport 2 more times can reduce ~1.3 kg CO₂ this week.`, color: "#06b6d4" },
    { icon: "❄️", text: `Try reducing AC usage by 1 hour daily to save 0.8 kg CO₂ weekly.`, color: "#a855f7" },
  ];

  const handleNlpSubmit = async () => {
    if (!nlpInput.trim()) return;
    setNlpLoading(true);
    try {
      const parseRes = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlpInput }),
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok || !parseData.parsed) {
        toast.error(parseData.error || "Could not understand. Try: 'drove 10 km' or 'ate 1 plate biryani'");
        return;
      }
      const logRes = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseData.parsed),
      });
      if (logRes.ok) {
        const logData = await logRes.json();
        toast.success(`Logged: ${logData.activity.name} → ${logData.activity.co2Emission.toFixed(2)} kg CO₂`, { duration: 4000 });
        setNlpInput("");
        fetchData();
      } else toast.error("Failed to log activity");
    } catch { toast.error("Connection error"); }
    finally { setNlpLoading(false); }
  };

  const handleCompleteQuest = async (questId: string) => {
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (res.ok) {
        const data = await res.json();
        const xp = data.quest?.xpReward || 100;
        const co2 = data.quest?.co2Reduction || 0;
        toast.success(`Quest completed! +${xp} XP & -${co2} kg CO₂ offset! 🎉`, { duration: 4000 });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to complete quest");
      }
    } catch { toast.error("Failed to complete quest"); }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;
    if (!cardNumber || !cardName || !cardExpiry || !cardCvc) { toast.error("Please fill in all payment fields"); return; }
    if (cardNumber.replace(/\s/g, "").length < 16) { toast.error("Please enter a valid 16-digit card number"); return; }
    setCheckoutLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      let subcategory = "plant-tree", quantity = 1;
      if (checkoutItem.id === "solar") subcategory = "solar-funding";
      else if (checkoutItem.id === "wind") subcategory = "wind-funding";
      else if (checkoutItem.id === "custom-offset") { subcategory = "solar-funding"; quantity = checkoutItem.co2Reduction / 50; }
      else if (checkoutItem.id === "sub-seedling") { subcategory = "plant-tree"; quantity = 5; }
      else if (checkoutItem.id === "sub-guardian") { subcategory = "solar-funding"; quantity = 5; }
      else if (checkoutItem.id === "sub-champion") { subcategory = "wind-funding"; quantity = 5; }
      const actRes = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Offset: ${checkoutItem.title}`, category: "offset", subcategory, quantity, unit: subcategory === "plant-tree" ? "tree" : "block" }),
      });
      if (actRes.ok) {
        const newXp = (user?.xp || 0) + checkoutItem.xpReward;
        const newLevel = Math.floor(newXp / 500) + 1;
        await fetch("/api/auth/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ xp: checkoutItem.xpReward, level: newLevel }) });
        if (checkoutItem.type === "subscription") { setPremiumPlan(checkoutItem.title); localStorage.setItem("carbon-premiumPlan", checkoutItem.title); }
        toast.success(`Purchase successful! Offset ${checkoutItem.co2Reduction} kg CO₂ & earned +${checkoutItem.xpReward} XP! 🌍`, { duration: 5000 });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setCheckoutItem(null);
        setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvc("");
        fetchData();
      } else toast.error("Failed to record offset in database");
    } catch { toast.error("Checkout transaction error"); }
    finally { setCheckoutLoading(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const getHourGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  const isSafe = safetyLevel.level <= 2;
  const xpToNextLevel = 500 - (user.xp % 500);
  const xpProgress = ((user.xp % 500) / 500) * 100;
  const scoreProgress = Math.min((user.sustainabilityScore / 100) * 100, 100);

  // Stat cards config
  const statCards = [
    {
      id: "co2",
      title: "Today's CO₂",
      icon: <TrendingDown size={16} />,
      iconColor: "#10b981",
      value: `${todayCo2.toFixed(1)} kg`,
      subtext: co2Delta !== 0 ? `${co2Delta > 0 ? "+" : ""}${co2Delta}% vs Yesterday` : "No data yesterday",
      subtextColor: co2Delta <= 0 ? "#10b981" : "#ef4444",
      subtextIcon: co2Delta <= 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />,
      sparkColor: "#10b981",
      accentColor: "#10b981",
      showSparkline: true,
      targetView: "activity-logger" as const,
    },
    {
      id: "score",
      title: "Sustainability Score",
      icon: <Shield size={16} />,
      iconColor: "#06b6d4",
      value: `${user.sustainabilityScore}/100`,
      subtext: user.sustainabilityScore >= 80 ? "Great job! Keep improving 🌱" : "Keep tracking to improve!",
      subtextColor: "#06b6d4",
      accentColor: "#06b6d4",
      showRing: true,
      ringProgress: scoreProgress,
      ringColor: "#06b6d4",
      targetView: "analytics" as const,
    },
    {
      id: "footprint",
      title: "Total Footprint",
      icon: <Globe size={16} />,
      iconColor: "#a855f7",
      value: `${(user.totalCarbonFootprint || 0).toFixed(1)} kg`,
      subtext: "This Month",
      subtextColor: "var(--text-secondary)",
      accentColor: "#a855f7",
      showSparkline: false,
      targetView: "analytics" as const,
    },
    {
      id: "xp",
      title: "XP / Level",
      icon: <Zap size={16} />,
      iconColor: "#f59e0b",
      value: `${user.xp} XP • L${user.level}`,
      subtext: `${xpToNextLevel} XP to Level ${user.level + 1}`,
      subtextColor: "#f59e0b",
      accentColor: "#f59e0b",
      showXpBar: true,
      xpProgress,
      targetView: "quests" as const,
    },
  ];

  // Quest suggestions for display
  const questSuggestions = [
    { label: "🚲 Travel", text: "Commuted 5 km by bicycle today" },
    { label: "🍔 Food", text: "Ate 1 vegan meal for lunch" },
    { label: "⚡ Energy", text: "Saved 2 kWh by unplugging standby electronics" },
    { label: "🛍️ Shopping", text: "Ordered 1 delivery package" },
    { label: "♻️ Waste", text: "Avoided 3 single-use plastic bags today" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", display: "flex" }}>
      <ConfettiOverlay active={showConfetti} />

      {/* ══════════════════════════════════════════
          LEFT SIDEBAR NAVIGATION
      ══════════════════════════════════════════ */}
      <aside style={{
        width: "220px",
        minWidth: "220px",
        background: "linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(22,27,34,0.98) 30%, var(--bg-glass) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(16,185,129,0.15)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid rgba(16,185,129,0.10)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(16,185,129,0.4)",
            }}>
              <Leaf size={18} color="#000" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", lineHeight: 1.1, background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CarbonTracker</div>
              <div style={{ fontSize: "9px", color: "var(--text-secondary)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>AI Dashboard</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          <div style={{ fontSize: "9px", color: "rgba(139,148,158,0.6)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "0 10px", marginBottom: "6px" }}>Main</div>
          {[
            { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} />, accent: "#10b981" },
            { id: "activity-logger", label: "Activity Logger", icon: <Activity size={16} />, accent: "#10b981" },
            { id: "analytics", label: "Analytics", icon: <TrendingUp size={16} />, accent: "#06b6d4" },
            { id: "quests", label: "Eco-Quests", icon: <Zap size={16} />, accent: "#f59e0b" },
          ].map((item, idx) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => setActiveView(item.id as any)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px", borderRadius: "10px", marginBottom: "2px",
                  background: isActive ? `linear-gradient(135deg, ${item.accent}18, ${item.accent}08)` : "transparent",
                  border: isActive ? `1px solid ${item.accent}30` : "1px solid transparent",
                  color: isActive ? item.accent : "var(--text-secondary)",
                  fontFamily: "'Outfit', sans-serif", fontSize: "13px",
                  fontWeight: isActive ? 700 : 500, cursor: "pointer",
                  transition: "all 0.2s", textAlign: "left",
                  boxShadow: isActive ? `0 0 12px ${item.accent}10` : "none",
                }}
              >
                <span style={{ color: isActive ? item.accent : "var(--text-secondary)", display: "flex" }}>{item.icon}</span>
                {item.label}
                {isActive && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: item.accent, boxShadow: `0 0 6px ${item.accent}` }} />}
              </button>
            );
          })}

          <div style={{ fontSize: "9px", color: "rgba(139,148,158,0.6)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "12px 10px 6px", marginTop: "4px" }}>Explore</div>
          {[
            { id: "marketplace", label: "Marketplace", icon: <ShoppingBag size={16} />, accent: "#a855f7" },
            { id: "community", label: "Community", icon: <Users size={16} />, accent: "#06b6d4" },
            { id: "history", label: "History", icon: <Clock size={16} />, accent: "#8b949e" },
            { id: "settings", label: "Settings", icon: <Cog size={16} />, accent: "#8b949e" },
          ].map((item, idx) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={`explore-${item.id}-${idx}`}
                onClick={() => setActiveView(item.id as any)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px", borderRadius: "10px", marginBottom: "2px",
                  background: isActive ? `linear-gradient(135deg, ${item.accent}18, ${item.accent}08)` : "transparent",
                  border: isActive ? `1px solid ${item.accent}30` : "1px solid transparent",
                  color: isActive ? item.accent : "var(--text-secondary)",
                  fontFamily: "'Outfit', sans-serif", fontSize: "13px",
                  fontWeight: isActive ? 700 : 500, cursor: "pointer",
                  transition: "all 0.2s", textAlign: "left",
                }}
              >
                <span style={{ color: isActive ? item.accent : "var(--text-secondary)", display: "flex" }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          {/* Heatmap shortcut */}
          <div style={{ margin: "8px 0", height: "1px", background: "rgba(16,185,129,0.08)" }} />
          <button
            onClick={() => router.push("/heatmap")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: "9px 12px", borderRadius: "10px",
              background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
              color: "#10b981", fontFamily: "'Outfit', sans-serif", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "left",
            }}
          >
            <Map size={16} />
            View Heatmap
          </button>
        </nav>

        {/* Bottom: Streak + User Profile */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(16,185,129,0.10)" }}>
          {/* Streak bar */}
          <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: "10px", padding: "8px 10px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
              <Flame size={12} color="#f97316" />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#f97316" }}>{user.streakCount} Day Streak</span>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginLeft: "auto" }}>🔥</span>
            </div>
            <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min((user.streakCount / 7) * 100, 100)}%`, background: "linear-gradient(90deg, #f97316, #facc15)", borderRadius: "2px" }} />
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "3px" }}>Keep it going!</div>
          </div>

          {/* Invite card */}
          <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))", border: "1px solid rgba(16,185,129,0.12)", borderRadius: "10px", padding: "10px", textAlign: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "18px", marginBottom: "2px" }}>🤝</div>
            <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "2px" }}>Invite Friends</div>
            <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginBottom: "7px" }}>Earn <span style={{ color: "#f59e0b", fontWeight: 700 }}>100 XP</span> per friend!</div>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.username}`); toast.success("Referral link copied! 📋"); }}
              style={{ width: "100%", padding: "6px", fontSize: "11px", borderRadius: "7px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
            >
              Invite Now
            </button>
          </div>

          {/* User profile card */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)" }}>
            <img
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt="Avatar"
              style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #10b981", flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.fullName || user.username}</div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>L{user.level} · {user.xp} XP</div>
            </div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px", display: "flex" }} title="Logout">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          RIGHT CONTENT AREA
      ══════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>

        {/* ── COMPACT TOPBAR ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "rgba(13,17,23,0.92)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(16,185,129,0.10)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: "54px", gap: "16px",
        }}>
          {/* Greeting summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700 }}>
              {getHourGreeting()},{" "}
              <span style={{ color: "#f59e0b" }}>{(user.fullName || user.username).split(" ")[0]}</span>{" "}👋
            </span>
            {premiumPlan && (
              <span style={{ fontSize: "10px", fontWeight: 700, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", padding: "2px 8px", borderRadius: "20px", display: "inline-flex", alignItems: "center" }}>
                👑 {premiumPlan}
              </span>
            )}
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Theme */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "8px", padding: "4px 10px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Theme:</span>
              <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}
                style={{ background: "transparent", color: "var(--text-primary)", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="default">🌌 Carbon Dark</option>
                <option value="forest">🌲 Forest Green</option>
                <option value="aurora">🌌 Aurora Neon 👑</option>
                <option value="polar">❄️ Polar Light 👑</option>
              </select>
            </div>
            <button style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "5px", borderRadius: "7px", display: "flex" }} title="Notifications"><Bell size={16} /></button>
            <button style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "5px", borderRadius: "7px", display: "flex" }} title="Help"><HelpCircle size={16} /></button>
            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="Avatar"
              style={{ width: "30px", height: "30px", borderRadius: "50%", border: "2px solid #10b981", cursor: "pointer" }}
              onClick={handleLogout} title="Logout" />
          </div>
        </header>

        {/* ── MAIN SCROLLABLE CONTENT ── */}
        <main style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>

          {/* Quote */}
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontStyle: "italic", marginBottom: "18px" }}>
            &ldquo;{currentQuote}&rdquo;
          </p>

          {/* ── STATS ROW ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "18px" }}>
            {statCards.map((card) => (
              <div key={card.id} className="glass-card clickable-stat-card" onClick={() => setActiveView(card.targetView)} style={{
                padding: "14px 16px",
                borderTop: `3px solid ${card.accentColor}`,
                borderLeft: `1px solid ${card.accentColor}18`,
                cursor: "pointer",
                boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 ${card.accentColor}10`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <div style={{ color: card.iconColor, padding: "4px", borderRadius: "6px", background: `${card.accentColor}15`, display: "flex" }}>{card.icon}</div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>{card.title}</span>
                    </div>
                    <div style={{ fontSize: card.id === "xp" ? "16px" : "20px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: "4px" }}>
                      {card.value}
                    </div>
                    {card.showXpBar && (
                      <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", marginTop: "6px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${card.xpProgress}%`, background: `linear-gradient(90deg, ${card.accentColor}, #fbbf24)`, borderRadius: "2px", transition: "width 0.5s ease" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      {card.subtextIcon && <span style={{ color: card.subtextColor }}>{card.subtextIcon}</span>}
                      <span style={{ fontSize: "10px", color: card.subtextColor, fontWeight: 500 }}>{card.subtext}</span>
                    </div>
                  </div>
                  {card.showSparkline && (
                    <div style={{ width: "72px", height: "36px", flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id={`spark-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={card.sparkColor || card.accentColor} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={card.sparkColor || card.accentColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke={card.sparkColor || card.accentColor} fill={`url(#spark-${card.id})`} strokeWidth={1.5} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {card.showRing && (
                    <div style={{ position: "relative", width: "46px", height: "46px", flexShrink: 0 }}>
                      <svg width="46" height="46" viewBox="0 0 46 46">
                        <circle cx="23" cy="23" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                        <circle cx="23" cy="23" r="18" fill="none" stroke={card.ringColor} strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${(card.ringProgress! / 100) * 113.1} 113.1`}
                          transform="rotate(-90 23 23)" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── DYNAMIC PANEL RENDERING ── */}
          {activeView === "dashboard" && (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "14px", alignItems: "start" }}>

              {/* ── LEFT COLUMN ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* ── REALISTIC CARBON EARTH STATUS ── */}
                <div className="glass-card" style={{ padding: "18px", textAlign: "center", background: "linear-gradient(145deg, rgba(4,20,14,0.95), rgba(22,27,34,0.92))", border: "1px solid rgba(16,185,129,0.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <Globe size={15} color="#10b981" />
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>Carbon Earth Status</span>
                  </div>

                  {/* REALISTIC SPINNING 3D EARTH GLOBE */}
                  <div className={`earth-sphere-realistic ${
                    isSafe ? "earth-glow-safe" : safetyLevel.level === 3 ? "earth-glow-warning" : "earth-glow-danger"
                  }`}>
                    {/* Ocean Layer */}
                    <div className={`earth-ocean ${
                      isSafe ? "earth-ocean-safe" : safetyLevel.level === 3 ? "earth-ocean-warning" : "earth-ocean-danger"
                    }`} />
                    
                    {/* Continents Layer (spins via keyframes) */}
                    <div className={`earth-continents-realistic ${
                      isSafe ? "earth-continents-safe" : safetyLevel.level === 3 ? "earth-continents-warning" : "earth-continents-danger"
                    }`} />
                    
                    {/* Clouds Layer (spins independently) */}
                    <div className="earth-clouds-realistic" />
                    
                    {/* 3D Atmospheric Shadowing */}
                    <div className="earth-shadow-realistic" />
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "5px 14px", borderRadius: "20px",
                    background: safetyLevel.bg, border: `1px solid ${safetyLevel.color}40`,
                    color: safetyLevel.color, fontWeight: 700, fontSize: "13px",
                    marginBottom: "6px", boxShadow: `0 0 12px ${safetyLevel.color}20`,
                  }}>
                    <Leaf size={13} />
                    {safetyLevel.name}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    You are doing better than{" "}
                    <span style={{ color: "#10b981", fontWeight: 700 }}>{Math.max(50, 100 - Math.floor(todayCo2 * 5))}%</span>{" "}
                    of users today!
                  </p>
                  {planetCount > 0 && (
                    <div style={{ marginTop: "6px", fontSize: "10px", color: "var(--text-secondary)" }}>
                      🌍 Planet usage:{" "}
                      <span style={{ color: planetCount <= 1 ? "#10b981" : planetCount <= 2 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>
                        {planetCount}x Earth
                      </span>
                    </div>
                  )}
                </div>

                {/* Daily Eco-Quests */}
                <div className="glass-card" style={{ padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>Daily Eco-Quests</span>
                    </div>
                    <button onClick={() => setActiveView("quests")}
                      style={{ background: "none", border: "none", color: "#10b981", fontSize: "11px", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                      View All
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    {quests.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "16px", color: "var(--text-secondary)", fontSize: "12px" }}>All quests completed! 🎉</div>
                    ) : (
                      quests.slice(0, 4).map((quest, i) => {
                        const icons = ["🚴", "👻", "🥗", "♻️"];
                        const colors = ["#10b981", "#a855f7", "#10b981", "#06b6d4"];
                        return (
                          <div key={quest.id} style={{
                            display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "9px",
                            background: quest.completed ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${quest.completed ? "rgba(16,185,129,0.2)" : "var(--border-glass)"}`,
                          }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `${colors[i % colors.length]}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                              {icons[i % icons.length]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{quest.title}</div>
                              <div style={{ fontSize: "9px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{quest.description}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                              <span style={{ fontSize: "9px", color: "#10b981", fontWeight: 700 }}>+{quest.xpReward}</span>
                              {quest.completed ? (
                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Check size={10} color="#10b981" />
                                </div>
                              ) : (
                                <button onClick={() => handleCompleteQuest(quest.id)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: "1px" }}>
                                  <ChevronRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {quests.every(q => q.completed) && quests.length > 0 && (
                    <div style={{ textAlign: "center", fontSize: "10px", color: "#f59e0b", marginTop: "7px", fontWeight: 600 }}>
                      Complete all quests to earn bonus 200 XP! 📦
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* AI Activity Tracker */}
                <div className="glass-card" style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: "0", marginBottom: "12px", borderBottom: "1px solid var(--border-glass)" }}>
                    {[
                      { id: "ai", label: "AI Activity Tracker", icon: <Sparkles size={12} /> },
                      { id: "manual", label: "Quick Log", icon: <List size={12} /> },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setLogMethod(tab.id as "ai" | "manual")}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px",
                          background: "none", border: "none",
                          borderBottom: logMethod === tab.id ? "2px solid #10b981" : "2px solid transparent",
                          color: logMethod === tab.id ? "#10b981" : "var(--text-secondary)",
                          fontFamily: "'Outfit', sans-serif", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", marginBottom: "-1px", transition: "all 0.2s",
                        }}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                  {logMethod === "ai" ? (
                    <div>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "7px" }}>Describe your activity naturally...</p>
                      <div style={{ display: "flex", gap: "7px", marginBottom: "10px" }}>
                        <input value={nlpInput} onChange={e => setNlpInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleNlpSubmit()}
                          placeholder="e.g., drove 8 km in my car, ate a veg meal, used AC for 2 hours"
                          className="input-field" style={{ flex: 1, height: "40px", fontSize: "12px" }} />
                        <button onClick={handleNlpSubmit} disabled={nlpLoading}
                          style={{ width: "40px", height: "40px", borderRadius: "9px", flexShrink: 0, background: nlpLoading ? "rgba(16,185,129,0.3)" : "#10b981", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: nlpLoading ? "not-allowed" : "pointer" }}>
                          {nlpLoading ? <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} /> : <Send size={14} color="#000" />}
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Suggestions:</span>
                        {questSuggestions.map((s, i) => (
                          <button key={i} onClick={() => setNlpInput(s.text)} className="suggestion-chip" style={{ fontSize: "10px", padding: "3px 9px" }}>{s.label}</button>
                        ))}
                        <button className="suggestion-chip" style={{ fontSize: "10px", padding: "3px 9px", display: "flex", alignItems: "center", gap: "3px" }}>More <ChevronDown size={9} /></button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                        <select value={manualCategory} onChange={e => handleCategoryChange(e.target.value)} className="input-field" style={{ height: "38px", fontSize: "11px" }}>
                          {MANUAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <select value={manualSubcategory} onChange={e => setManualSubcategory(e.target.value)} className="input-field" style={{ height: "38px", fontSize: "11px" }}>
                          {(MANUAL_SUBCATEGORIES[manualCategory] || []).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                        <input type="number" min="0" step="0.1" value={manualQuantity} onChange={e => setManualQuantity(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Quantity" className="input-field" style={{ height: "38px", fontSize: "11px" }} />
                        <input value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="Description (optional)" className="input-field" style={{ height: "38px", fontSize: "11px" }} />
                      </div>
                      <button onClick={handleManualSubmit} disabled={manualLoading}
                        style={{ height: "38px", borderRadius: "9px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#000", fontWeight: 700, fontSize: "12px", cursor: manualLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", fontFamily: "'Outfit', sans-serif", boxShadow: "0 0 14px rgba(16,185,129,0.3)" }}>
                        {manualLoading ? <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} /> : <><Plus size={13} /> Log Activity</>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Weekly Footprint Chart */}
                <div className="glass-card" style={{ padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>Weekly Footprint (kg CO₂)</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "7px", padding: "3px 9px" }}>
                      <span style={{ fontSize: "10px", color: "#10b981" }}>This Week</span>
                      <ChevronDown size={11} color="#10b981" />
                    </div>
                  </div>
                  <div style={{ height: "110px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                        <defs>
                          <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "rgba(13,17,23,0.95)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", fontFamily: "Outfit", fontSize: "10px" }} formatter={(val: any) => [`${val} kg`, "CO₂"]} />
                        <Area type="monotone" dataKey="co2" stroke="#10b981" fill="url(#weeklyGrad)" strokeWidth={2} dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#10b981" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut + Insights */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {/* CO₂ by Category */}
                  <div className="glass-card" style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
                      <Target size={13} color="#a855f7" />
                      <span style={{ fontSize: "12px", fontWeight: 700 }}>CO₂print by Category</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div className="donut-chart-container" style={{ width: "120px", height: "120px", flexShrink: 0 }}>
                        <ResponsiveContainer width={120} height={120}>
                          <PieChart>
                            <Pie data={pieData.length ? pieData : [{ name: "None", value: 1 }]} dataKey="value" cx="50%" cy="50%" outerRadius={52} innerRadius={36} paddingAngle={2} strokeWidth={0}>
                              {pieData.length ? (
                                pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)
                              ) : (<Cell fill="rgba(255,255,255,0.06)" />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center-overlay">
                          <div className="donut-center-value" style={{ fontSize: "14px" }}>{totalCo2.toFixed(1)}</div>
                          <div className="donut-center-label">kg CO₂</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        {pieData.length > 0 ? pieData.slice(0, 5).map((d, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontSize: "9px", color: "var(--text-secondary)" }}>{d.name}</span>
                            </div>
                            <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-primary)" }}>{totalCo2 > 0 ? Math.round((d.value / totalCo2) * 100) : 0}%</span>
                          </div>
                        )) : <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>No data yet!</div>}
                      </div>
                    </div>
                    <button onClick={() => setActiveView("analytics")}
                      style={{ width: "100%", marginTop: "8px", padding: "6px", borderRadius: "7px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", color: "#10b981", fontSize: "10px", cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <Eye size={11} /> View Detailed Analytics
                    </button>
                  </div>

                  {/* AI Insights */}
                  <div className="glass-card" style={{ padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Lightbulb size={13} color="#f59e0b" />
                        <span style={{ fontSize: "12px", fontWeight: 700 }}>AI Insights</span>
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 700, background: "#10b981", color: "#000", padding: "2px 6px", borderRadius: "4px" }}>New</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      {aiInsights.map((insight, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px", borderRadius: "9px", background: `rgba(${i === 0 ? "16,185,129" : i === 1 ? "6,182,212" : "168,85,247"},0.05)`, border: `1px solid rgba(${i === 0 ? "16,185,129" : i === 1 ? "6,182,212" : "168,85,247"},0.12)`, cursor: "pointer" }}>
                          <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: `${insight.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>{insight.icon}</div>
                          <div style={{ flex: 1, fontSize: "10px", color: "var(--text-secondary)", lineHeight: 1.4 }}>{insight.text}</div>
                          <ChevronRight size={10} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                        </div>
                      ))}
                    </div>
                    <button style={{ width: "100%", marginTop: "8px", padding: "6px", borderRadius: "7px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "10px", cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <Lightbulb size={11} /> Get More Insights
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeView === "activity-logger" && (
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "16px", alignItems: "start" }}>
              {/* Left Column: Logging Inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="glass-card" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "0", marginBottom: "12px", borderBottom: "1px solid var(--border-glass)" }}>
                    {[
                      { id: "ai", label: "AI Activity Tracker", icon: <Sparkles size={12} /> },
                      { id: "manual", label: "Quick Log", icon: <List size={12} /> },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setLogMethod(tab.id as "ai" | "manual")}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px",
                          background: "none", border: "none",
                          borderBottom: logMethod === tab.id ? "2px solid #10b981" : "2px solid transparent",
                          color: logMethod === tab.id ? "#10b981" : "var(--text-secondary)",
                          fontFamily: "'Outfit', sans-serif", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", marginBottom: "-1px", transition: "all 0.2s",
                        }}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                  {logMethod === "ai" ? (
                    <div>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "7px" }}>Describe your activity naturally...</p>
                      <div style={{ display: "flex", gap: "7px", marginBottom: "10px" }}>
                        <input value={nlpInput} onChange={e => setNlpInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleNlpSubmit()}
                          placeholder="e.g., drove 8 km in my car, ate a veg meal, used AC for 2 hours"
                          className="input-field" style={{ flex: 1, height: "40px", fontSize: "12px" }} />
                        <button onClick={handleNlpSubmit} disabled={nlpLoading}
                          style={{ width: "40px", height: "40px", borderRadius: "9px", flexShrink: 0, background: nlpLoading ? "rgba(16,185,129,0.3)" : "#10b981", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: nlpLoading ? "not-allowed" : "pointer" }}>
                          {nlpLoading ? <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} /> : <Send size={14} color="#000" />}
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Suggestions:</span>
                        {questSuggestions.map((s, i) => (
                          <button key={i} onClick={() => setNlpInput(s.text)} className="suggestion-chip" style={{ fontSize: "10px", padding: "3px 9px" }}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                        <select value={manualCategory} onChange={e => handleCategoryChange(e.target.value)} className="input-field" style={{ height: "38px", fontSize: "11px" }}>
                          {MANUAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <select value={manualSubcategory} onChange={e => setManualSubcategory(e.target.value)} className="input-field" style={{ height: "38px", fontSize: "11px" }}>
                          {(MANUAL_SUBCATEGORIES[manualCategory] || []).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                        <input type="number" min="0" step="0.1" value={manualQuantity} onChange={e => setManualQuantity(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Quantity" className="input-field" style={{ height: "38px", fontSize: "11px" }} />
                        <input value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="Description (optional)" className="input-field" style={{ height: "38px", fontSize: "11px" }} />
                      </div>
                      <button onClick={handleManualSubmit} disabled={manualLoading}
                        style={{ height: "38px", borderRadius: "9px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#000", fontWeight: 700, fontSize: "12px", cursor: manualLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", fontFamily: "'Outfit', sans-serif", boxShadow: "0 0 14px rgba(16,185,129,0.3)" }}>
                        {manualLoading ? <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} /> : <><Plus size={13} /> Log Activity</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Ledger with disclosure */}
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={18} color="#10b981" />
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>Activity Ledger & Transparency Disclosures</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{activities.length} total entries</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto", paddingRight: "4px" }}>
                  {activities.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                      <Activity size={32} style={{ opacity: 0.3, marginBottom: "10px" }} />
                      <p>No activities recorded yet. Use the logger on the left to start!</p>
                    </div>
                  ) : (
                    activities.map((a) => {
                      const isExpanded = expandedActivityId === a.id;
                      const isOffset = a.category === "offset" || a.co2Emission < 0;
                      return (
                        <div key={a.id} className="glass-card" style={{
                          padding: "12px 16px",
                          border: isExpanded ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border-glass)",
                          background: isExpanded ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.01)",
                          transition: "all 0.2s"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "36px", height: "36px", borderRadius: "8px",
                              background: isOffset ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
                              flexShrink: 0
                            }}>
                              {CATEGORY_ICONS[a.category] || "📦"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                {new Date(a.timestamp).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "14px", fontWeight: 800, color: isOffset ? "#10b981" : "#ef4444" }}>
                                {isOffset ? "" : "+"}{a.co2Emission.toFixed(2)} kg CO₂
                              </div>
                              <button
                                onClick={() => setExpandedActivityId(isExpanded ? null : a.id)}
                                style={{
                                  background: "none", border: "none", color: "#10b981", fontSize: "10px",
                                  fontWeight: 600, cursor: "pointer", fontFamily: "Outfit", padding: "4px 0 0",
                                  display: "inline-flex", alignItems: "center", gap: "2px"
                                }}
                              >
                                {isExpanded ? "Hide Details" : "View Disclosure"} <ChevronDown size={10} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{
                              marginTop: "12px", paddingTop: "12px",
                              borderTop: "1px dashed rgba(16,185,129,0.15)",
                              fontSize: "11px", color: "var(--text-secondary)",
                              display: "flex", flexDirection: "column", gap: "6px"
                            }}>
                              <div>
                                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Calculation Formula:</span>
                                <code style={{
                                  display: "block", background: "rgba(0,0,0,0.3)", padding: "6px 10px",
                                  borderRadius: "6px", marginTop: "4px", fontSize: "10px", color: "#34d399",
                                  border: "1px solid rgba(16,185,129,0.1)"
                                }}>
                                  {a.formulaUsed || "Standard activity carbon conversion factor."}
                                </code>
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Data Source & Verification:</span>
                                <p style={{
                                  margin: "4px 0 0", background: "rgba(16,185,129,0.03)", padding: "6px 10px",
                                  borderRadius: "6px", fontSize: "10px", border: "1px dashed rgba(16,185,129,0.1)"
                                }}>
                                  {a.sourceDetails || "UNFCCC Climate Neutral Now standard conversion database."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Comparative Benchmarks */}
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <TrendingUp size={18} color="#06b6d4" />
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>Global Footprint Benchmarks</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "18px", lineHeight: 1.4 }}>
                  Compare your daily average carbon footprint against regional grid averages and the 2030 Paris Climate Target (limit warming to 1.5°C).
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { label: "Your 7-Day Average", value: weeklyAverage, color: "#10b981", isUser: true },
                    { label: "Paris Climate Target (Max/Day)", value: 5.5, color: "#34d399", isTarget: true },
                    { label: "India National Average", value: 5.2, color: "#06b6d4" },
                    { label: "UK National Average", value: 17.8, color: "#f59e0b" },
                    { label: "US National Average", value: 44.4, color: "#ef4444" },
                  ].map((benchmark, idx) => {
                    const maxValue = 50; // clamp for scaling
                    const percentage = Math.min((benchmark.value / maxValue) * 100, 100);
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                          <span style={{ fontWeight: benchmark.isUser ? 800 : 500, color: benchmark.isUser ? "#10b981" : "var(--text-primary)" }}>
                            {benchmark.label} {benchmark.isUser && "⭐"} {benchmark.isTarget && "🎯"}
                          </span>
                          <span style={{ fontWeight: 700, color: benchmark.color }}>
                            {benchmark.value.toFixed(1)} kg CO₂/day
                          </span>
                        </div>
                        <div style={{ height: "10px", borderRadius: "5px", background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
                          <div style={{
                            height: "100%", width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${benchmark.color}cc, ${benchmark.color})`,
                            borderRadius: "5px",
                            boxShadow: benchmark.isUser ? "0 0 10px rgba(16,185,129,0.5)" : "none"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stacked Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Re-use Weekly footprint area chart but larger */}
                <div className="glass-card" style={{ padding: "18px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "14px" }}>Weekly Footprint Trend</span>
                  <div style={{ height: "200px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                        <defs>
                          <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "rgba(13,17,23,0.95)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", fontFamily: "Outfit", fontSize: "11px" }} formatter={(val: any) => [`${val} kg`, "CO₂"]} />
                        <Area type="monotone" dataKey="co2" stroke="#10b981" fill="url(#analyticsGrad)" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#10b981" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut and breakdown */}
                <div className="glass-card" style={{ padding: "18px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "14px" }}>Emission Breakdown</span>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "200px" }}>
                    <div className="donut-chart-container" style={{ width: "140px", height: "140px", flexShrink: 0 }}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={pieData.length ? pieData : [{ name: "None", value: 1 }]} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={48} paddingAngle={2} strokeWidth={0}>
                            {pieData.length ? (
                              pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)
                            ) : (<Cell fill="rgba(255,255,255,0.06)" />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="donut-center-overlay">
                        <div className="donut-center-value" style={{ fontSize: "16px" }}>{totalCo2.toFixed(1)}</div>
                        <div className="donut-center-label">kg CO₂</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 700 }}>{totalCo2 > 0 ? Math.round((d.value / totalCo2) * 100) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "quests" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", alignItems: "start" }}>
              {/* Left side: Quest Checklist & Sponsored Quests */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Checklist Card */}
                <div className="glass-card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Star size={18} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: "15px", fontWeight: 700 }}>Daily Quest Checklist</span>
                    </div>
                    {/* Filters */}
                    <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", padding: "2px" }}>
                      {(["all", "active", "completed"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setQuestsFilter(filter)}
                          style={{
                            background: questsFilter === filter ? "rgba(16,185,129,0.15)" : "transparent",
                            border: "none",
                            color: questsFilter === filter ? "#10b981" : "var(--text-secondary)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform: "capitalize",
                            fontFamily: "Outfit"
                          }}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {quests
                      .filter((q) => {
                        if (questsFilter === "active") return !q.completed;
                        if (questsFilter === "completed") return q.completed;
                        return true;
                      })
                      .map((quest) => (
                        <div key={quest.id} className="glass-card" style={{
                          padding: "14px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          background: quest.completed ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.01)",
                          border: quest.completed ? "1px solid rgba(16,185,129,0.2)" : "1px solid var(--border-glass)",
                          opacity: quest.completed ? 0.8 : 1,
                        }}>
                          <div style={{
                            width: "32px", height: "32px", borderRadius: "8px",
                            background: quest.completed ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "16px", flexShrink: 0
                          }}>
                            {quest.completed ? "✅" : "⚡"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{quest.title}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{quest.description}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>+{quest.xpReward} XP</div>
                            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>-{quest.co2Reduction} kg CO₂</div>
                          </div>
                          <div style={{ marginLeft: "10px" }}>
                            {quest.completed ? (
                              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Check size={12} color="#10b981" />
                              </div>
                            ) : (
                              <button
                                onClick={() => handleCompleteQuest(quest.id)}
                                style={{
                                  background: "linear-gradient(135deg, #10b981, #059669)",
                                  border: "none", color: "#000",
                                  padding: "6px 12px", borderRadius: "6px",
                                  fontSize: "11px", fontWeight: 700, cursor: "pointer",
                                  fontFamily: "Outfit"
                                }}
                              >
                                Claim
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    {quests.length === 0 && (
                      <div style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)", fontSize: "12px" }}>
                        No quests found in this category.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sponsored Quests */}
                <div className="glass-card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <Award size={18} color="#f59e0b" />
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>Sponsored Eco-Quests</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {sponsoredQuests.map((quest) => {
                      const isDone = completedSponsored.includes(quest.id);
                      return (
                        <div key={quest.id} className="glass-card" style={{
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          border: `1px solid ${quest.color}33`,
                          background: `linear-gradient(135deg, ${quest.color}0a, rgba(22,27,34,0.8))`
                        }}>
                          <div>
                            <span style={{
                              fontSize: "9px", fontWeight: 800, color: "#fff",
                              background: quest.color, padding: "2px 6px",
                              borderRadius: "4px", textTransform: "uppercase"
                            }}>
                              {quest.brand}
                            </span>
                            <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "8px", color: "var(--text-primary)" }}>{quest.title}</div>
                            <p style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.3 }}>{quest.description}</p>
                          </div>
                          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "10px" }}>
                              <span style={{ color: "#10b981", fontWeight: 700 }}>+{quest.xpReward} XP</span>
                              <span style={{ color: "var(--text-secondary)", marginLeft: "6px" }}>-{quest.co2Reduction} kg</span>
                            </div>
                            <button
                              disabled={isDone}
                              onClick={() => handleCompleteSponsoredQuest(quest)}
                              style={{
                                background: isDone ? "rgba(255,255,255,0.05)" : quest.color,
                                border: "none", color: isDone ? "var(--text-secondary)" : "#fff",
                                padding: "5px 10px", borderRadius: "5px",
                                fontSize: "10px", fontWeight: 700, cursor: isDone ? "default" : "pointer",
                                fontFamily: "Outfit"
                              }}
                            >
                              {isDone ? "Completed ✓" : quest.buttonText}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right side: Climate Advocate Certificate Card */}
              <div className="glass-card" style={{
                padding: "20px",
                background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(22,27,34,0.98) 100%)",
                border: "1px solid rgba(16,185,129,0.2)",
                textAlign: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", textAlign: "left" }}>
                  <ShieldCheck size={18} color="#10b981" />
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>Climate Advocate Certificate</span>
                </div>

                <div style={{
                  padding: "24px 16px",
                  borderRadius: "12px",
                  border: "2px solid rgba(16,185,129,0.3)",
                  background: "rgba(0,0,0,0.4)",
                  position: "relative",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  marginBottom: "16px"
                }}>
                  {/* Decorative corners */}
                  <div style={{ position: "absolute", top: "8px", left: "8px", width: "12px", height: "12px", borderTop: "2px solid #10b981", borderLeft: "2px solid #10b981" }} />
                  <div style={{ position: "absolute", top: "8px", right: "8px", width: "12px", height: "12px", borderTop: "2px solid #10b981", borderRight: "2px solid #10b981" }} />
                  <div style={{ position: "absolute", bottom: "8px", left: "8px", width: "12px", height: "12px", borderBottom: "2px solid #10b981", borderLeft: "2px solid #10b981" }} />
                  <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "12px", height: "12px", borderBottom: "2px solid #10b981", borderRight: "2px solid #10b981" }} />

                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", letterSpacing: "1px", textTransform: "uppercase" }}>Certificate of Advocacy</div>
                  <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "2px" }}>CARBONTRACKER AI NETWORK</div>
                  
                  <div style={{ margin: "20px 0" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontStyle: "italic" }}>This is proudly presented to:</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#f59e0b", margin: "6px 0", fontFamily: "Outfit" }}>{user.fullName || user.username}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", lineHeight: 1.4, padding: "0 10px" }}>
                      for outstanding performance in reducing daily greenhouse gas emissions and maintaining a sustainability score of <span style={{ color: "#10b981", fontWeight: 700 }}>{user.sustainabilityScore}%</span>.
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-primary)" }}>Lvl {user.level}</div>
                      <div style={{ fontSize: "8px", color: "var(--text-secondary)" }}>Advocate Level</div>
                    </div>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #fbbf24, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: "0 0 10px rgba(245,158,11,0.4)" }}>
                      🛡️
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-primary)" }}>{user.totalCarbonFootprint.toFixed(0)} kg</div>
                      <div style={{ fontSize: "8px", color: "var(--text-secondary)" }}>Total Offset</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => { toast.success("Certificate download initialized... 📄"); }}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", background: "rgba(16,185,129,0.08)", color: "#10b981", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", fontFamily: "Outfit" }}
                  >
                    <Download size={12} /> Download PDF
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`Check out my Climate Advocate Certificate! Sustainability Score: ${user.sustainabilityScore}/100.`); toast.success("Copied shareable badge link! 🔗"); }}
                    style={{ flex: 1, padding: "8px 12px", border: "none", borderRadius: "8px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", fontFamily: "Outfit" }}
                  >
                    <Star size={12} fill="#000" /> Share Badge
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === "marketplace" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Offset Projects */}
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <ShoppingBag size={18} color="#a855f7" />
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>Verified Carbon Offset Projects</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                  {[
                    { id: "tree", title: "Global Reforestation Initiative", desc: "Planted tree saplings in degraded rainforest reserves.", cost: "$5.00", co2: 100, xp: 250, badge: "🌳 Tree Planting" },
                    { id: "solar", title: "Community Solar Cooperative", desc: "Fund community microgrid solar setups to offset fossil energy.", cost: "$12.00", co2: 300, xp: 600, badge: "☀️ Solar Infrastructure" },
                    { id: "wind", title: "Coastal Wind Farm Expansion", desc: "Invest in industrial wind turbines displacing regional grids.", cost: "$25.00", co2: 700, xp: 1500, badge: "💨 Wind Power" },
                  ].map((project) => (
                    <div key={project.id} className="glass-card" style={{
                      padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                      border: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.01)"
                    }}>
                      <div>
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#a855f7", background: "rgba(168,85,247,0.12)", padding: "3px 8px", borderRadius: "10px" }}>
                          {project.badge}
                        </span>
                        <h4 style={{ fontSize: "13px", fontWeight: 700, marginTop: "10px", color: "var(--text-primary)" }}>{project.title}</h4>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.4 }}>{project.desc}</p>
                      </div>
                      <div style={{ marginTop: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "10px", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Off-set Amount:</span>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>-{project.co2} kg CO₂</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "15px", fontWeight: 800 }}>{project.cost}</span>
                          <button
                            onClick={() => setCheckoutItem({ type: "project", id: project.id, title: project.title, price: project.cost, co2Reduction: project.co2, xpReward: project.xp })}
                            style={{
                              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                              border: "none", color: "#fff",
                              padding: "6px 12px", borderRadius: "6px",
                              fontSize: "11px", fontWeight: 700, cursor: "pointer",
                              fontFamily: "Outfit"
                            }}
                          >
                            Offset Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscriptions */}
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <Award size={18} color="#f59e0b" />
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>Premium Membership visual tiers</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                  {[
                    { id: "sub-seedling", title: "Seedling tier", desc: "Unlock custom visual themes & double daily quest XP.", price: "$2.99 / mo", co2: 150, xp: 400 },
                    { id: "sub-guardian", title: "Guardian tier", desc: "Unlock custom visual themes, double quest XP, and premium badge.", price: "$5.99 / mo", co2: 350, xp: 900 },
                    { id: "sub-champion", title: "Champion tier", desc: "All premium features + automatic weekly offset certificate & gold icon.", price: "$9.99 / mo", co2: 800, xp: 2000 },
                  ].map((tier) => (
                    <div key={tier.id} className="glass-card" style={{
                      padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                      border: premiumPlan === tier.title ? "1px solid #f59e0b" : "1px solid var(--border-glass)",
                      background: premiumPlan === tier.title ? "rgba(245,158,11,0.03)" : "rgba(255,255,255,0.01)"
                    }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{tier.title}</h4>
                          {premiumPlan === tier.title && (
                            <span style={{ fontSize: "9px", fontWeight: 800, color: "#000", background: "#f59e0b", padding: "2px 6px", borderRadius: "10px" }}>Active</span>
                          )}
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.4 }}>{tier.desc}</p>
                      </div>
                      <div style={{ marginTop: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "10px" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Included monthly offset:</span>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>-{tier.co2} kg CO₂/mo</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: 800 }}>{tier.price}</span>
                          <button
                            disabled={premiumPlan === tier.title}
                            onClick={() => setCheckoutItem({ type: "subscription", id: tier.id, title: tier.title, price: tier.price.split(" ")[0], co2Reduction: tier.co2, xpReward: tier.xp })}
                            style={{
                              background: premiumPlan === tier.title ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #fbbf24, #d97706)",
                              border: "none", color: premiumPlan === tier.title ? "var(--text-secondary)" : "#000",
                              padding: "6px 12px", borderRadius: "6px",
                              fontSize: "11px", fontWeight: 700, cursor: premiumPlan === tier.title ? "default" : "pointer",
                              fontFamily: "Outfit"
                            }}
                          >
                            {premiumPlan === tier.title ? "Subscribed" : "Subscribe"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === "community" && (
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trophy size={18} color="#06b6d4" />
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>Community Carbon Leaderboard</span>
                </div>
                <button
                  onClick={fetchLeaderboard}
                  disabled={leaderboardLoading}
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-glass)",
                    color: "var(--text-primary)", fontSize: "11px", fontWeight: 600, padding: "5px 10px",
                    borderRadius: "6px", cursor: "pointer", fontFamily: "Outfit"
                  }}
                >
                  {leaderboardLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {leaderboardLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <div className="spinner" />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "10px" }}>Rank</th>
                        <th style={{ padding: "10px" }}>User</th>
                        <th style={{ padding: "10px" }}>Sustainability Score</th>
                        <th style={{ padding: "10px" }}>Level / XP</th>
                        <th style={{ padding: "10px", textAlign: "right" }}>Total Offset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item, index) => {
                        const isSelfUser = item.username === user.username;
                        return (
                          <tr key={item.id || index} style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            background: isSelfUser ? "rgba(16,185,129,0.08)" : "transparent",
                            fontWeight: isSelfUser ? 700 : 500
                          }}>
                            <td style={{ padding: "12px 10px", color: index === 0 ? "#fbbf24" : index === 1 ? "#9ca3af" : index === 2 ? "#b45309" : "var(--text-secondary)" }}>
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                            </td>
                            <td style={{ padding: "12px 10px", display: "flex", alignItems: "center", gap: "8px" }}>
                              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`} alt="avatar" style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #06b6d4" }} />
                              <span style={{ color: isSelfUser ? "#10b981" : "var(--text-primary)" }}>{item.fullName || item.username} {isSelfUser && "(You)"}</span>
                            </td>
                            <td style={{ padding: "12px 10px", color: "#10b981", fontWeight: 700 }}>
                              {item.sustainabilityScore}/100
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              Lvl {item.level} ({item.xp} XP)
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: "#06b6d4", fontWeight: 700 }}>
                              {(item.totalCarbonFootprint || 0).toFixed(1)} kg CO₂
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeView === "history" && (
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={18} color="#8b949e" />
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>Chronological Emission History</span>
                </div>
                {/* Search / Filter Controls */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search activities..."
                    className="input-field"
                    style={{ height: "32px", fontSize: "11px", width: "160px" }}
                  />
                  <select
                    value={historyCategoryFilter}
                    onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                    className="input-field"
                    style={{ height: "32px", fontSize: "11px", width: "110px" }}
                  >
                    <option value="all">All Categories</option>
                    {MANUAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label.split(" ")[1]}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activities, null, 2));
                      const downloadAnchor = document.createElement("a");
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `carbon_history_${user.username}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      toast.success("History JSON exported! 📋");
                    }}
                    style={{
                      background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
                      color: "#10b981", fontSize: "11px", fontWeight: 700, padding: "5px 10px",
                      borderRadius: "6px", cursor: "pointer", fontFamily: "Outfit", display: "flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <Download size={12} /> Export
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "10px" }}>Category</th>
                      <th style={{ padding: "10px" }}>Activity Details</th>
                      <th style={{ padding: "10px" }}>Timestamp</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Emission (kg CO₂)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities
                      .filter((a) => {
                        const matchesSearch = a.name.toLowerCase().includes(historySearch.toLowerCase());
                        const matchesCategory = historyCategoryFilter === "all" || a.category === historyCategoryFilter;
                        return matchesSearch && matchesCategory;
                      })
                      .map((a, idx) => {
                        const isOffset = a.category === "offset" || a.co2Emission < 0;
                        return (
                          <tr key={a.id || idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ fontSize: "14px", marginRight: "6px" }}>{CATEGORY_ICONS[a.category] || "📦"}</span>
                              <span style={{ textTransform: "capitalize", color: "var(--text-secondary)", fontSize: "11px" }}>{a.category}</span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: 600 }}>{a.name}</td>
                            <td style={{ padding: "12px 10px", color: "var(--text-secondary)", fontSize: "11px" }}>
                              {new Date(a.timestamp).toLocaleString()}
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: isOffset ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                              {isOffset ? "" : "+"}{a.co2Emission.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    {activities.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                          No matching history logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === "settings" && (
            <div className="glass-card" style={{ padding: "20px", maxWidth: "560px", margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Cog size={18} color="#8b949e" />
                <span style={{ fontSize: "15px", fontWeight: 700 }}>Profile & General Settings</span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.4 }}>
                Keep your details updated to calculate accurate baselines and regional grid offsets.
              </p>

              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>Full Name</label>
                  <input
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="E.g. Harshan R"
                    className="input-field"
                    style={{ height: "38px", fontSize: "12px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>Place / Location</label>
                    <input
                      value={editPlace}
                      onChange={(e) => setEditPlace(e.target.value)}
                      placeholder="E.g. Chennai, India"
                      className="input-field"
                      style={{ height: "38px", fontSize: "12px" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>Age</label>
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="E.g. 26"
                      className="input-field"
                      style={{ height: "38px", fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="input-field"
                      style={{ height: "38px", fontSize: "12px" }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Decline</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>Grid Region (Default)</label>
                    <select
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      className="input-field"
                      style={{ height: "38px", fontSize: "12px" }}
                      disabled
                    >
                      <option value="Global">Global Grid Average</option>
                      <option value="India">India Grid (CO₂/kWh = 0.82)</option>
                      <option value="USA">USA Grid (CO₂/kWh = 0.37)</option>
                      <option value="UK">UK Grid (CO₂/kWh = 0.21)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileSubmitting}
                  style={{
                    height: "38px", background: "linear-gradient(135deg, #10b981, #059669)",
                    border: "none", color: "#000", fontWeight: 700, fontSize: "12px", borderRadius: "9px",
                    cursor: profileSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "5px", fontFamily: "Outfit", marginTop: "10px"
                  }}
                >
                  {profileSubmitting ? <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} /> : "Save Profile Changes"}
                </button>
              </form>
            </div>
          )}

          {/* ── STREAK FOOTER ── */}
          <div className="streak-footer-card" style={{ marginTop: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>🚀</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>
                  Keep going! You&apos;re on a <span style={{ color: "#f59e0b" }}>{user.streakCount} day streak.</span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                  Build a 7-day streak to unlock the &quot;Green Warrior&quot; badge!
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isCompleted = day <= user.streakCount;
                const isToday = day === user.streakCount + 1;
                const isLocked = !isCompleted && !isToday;
                return (
                  <div key={day} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <div
                      className={`streak-day-node ${isCompleted ? "active" : isLocked ? "locked" : ""}`}
                      style={isToday ? { border: "2px solid #f59e0b", color: "#f59e0b", background: "rgba(245,158,11,0.08)" } : {}}
                    >
                      {isCompleted ? <Check size={11} /> : isLocked ? <Lock size={9} /> : day}
                    </div>
                    {day < 7 && (
                      <div style={{ width: "14px", height: "2px", borderRadius: "1px", background: isCompleted ? "#10b981" : "rgba(255,255,255,0.06)" }} />
                    )}
                  </div>
                );
              })}
              <div className="streak-badge-container"><span style={{ fontSize: "18px" }}>🏆</span></div>
            </div>
          </div>

        </main>
      </div>

      {/* ── CHECKOUT MODAL ── */}
      <AnimatePresence>
        {checkoutItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
            onClick={(e) => { if (e.target === e.currentTarget) setCheckoutItem(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ maxWidth: "420px", width: "100%", padding: "26px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "6px" }}>Complete Purchase</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "18px" }}>
                {checkoutItem.title} — {checkoutItem.price} | -{checkoutItem.co2Reduction} kg CO₂ | +{checkoutItem.xpReward} XP
              </p>
              <form onSubmit={handleCheckoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))} placeholder="Card Number (16 digits)" maxLength={19} className="input-field" />
                <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Cardholder Name" className="input-field" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM / YY" maxLength={7} className="input-field" />
                  <input value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="CVC" maxLength={3} className="input-field" />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setCheckoutItem(null)} className="btn-secondary" style={{ flex: 1, padding: "9px" }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: "9px" }} disabled={checkoutLoading}>
                    {checkoutLoading ? "Processing..." : `Pay ${checkoutItem.price}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
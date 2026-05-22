"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Shield, Users, Flame, BarChart3, ArrowLeft, Leaf, Download,
  TrendingUp, Activity, Database,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface AdminStats {
  totalUsers: number;
  totalEmissions: number;
  recentActivityCount: number;
  avgSustainabilityScore: number;
  categoryBreakdown: { category: string; total: number; percentage: number }[];
}

interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  place: string;
  job: string;
  age: number;
  sustainabilityScore: number;
  totalCarbonFootprint: number;
  level: number;
  xp: number;
  _count: { activities: number };
}

const CHART_COLORS = ["#00ff87", "#00e0ff", "#a855f7", "#ff8800", "#ff0044", "#ffdd00"];

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<"overview" | "users" | "factors">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ])
      .then(([statsData, usersData]) => {
        if (statsData.error) {
          toast.error("Admin access denied");
          router.push("/dashboard");
          return;
        }
        setStats(statsData);
        setUsers(usersData.users || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load admin data");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ minHeight: "100vh", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}
      >
        <button className="btn-secondary" onClick={() => router.push("/dashboard")} style={{ padding: "8px 12px" }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a855f7, #00e0ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={20} color="#fff" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>
            <span className="gradient-text">Admin</span>{" "}
            <span style={{ color: "var(--text-secondary)" }}>Dashboard</span>
          </h1>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#00e0ff" },
          { label: "Total Emissions", value: `${stats.totalEmissions.toFixed(1)} kg`, icon: Flame, color: "#ff8800" },
          { label: "Recent Activity (24h)", value: stats.recentActivityCount, icon: Activity, color: "#00ff87" },
          { label: "Avg Sustainability", value: `${stats.avgSustainabilityScore.toFixed(0)}/100`, icon: TrendingUp, color: "#a855f7" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="stat-card"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>{kpi.label}</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
              </div>
              <kpi.icon size={24} style={{ color: kpi.color, opacity: 0.4 }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {(["overview", "users", "factors"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: "1px solid",
              borderColor: tab === t ? "var(--neon-purple)" : "var(--border-glass)",
              background: tab === t ? "rgba(168,85,247,0.1)" : "transparent",
              color: tab === t ? "var(--neon-purple)" : "var(--text-secondary)",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: "13px",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={18} color="var(--neon-blue)" />
              Emissions by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryBreakdown}>
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#8b8b9e", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b8b9e", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(18,18,26,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontFamily: "Outfit",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {stats.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card" style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} color="var(--neon-blue)" />
                All Users ({users.length})
              </h3>
              <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Download size={14} />
                Export CSV
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
                  {["Username", "Full Name", "Email", "City", "Job", "Score", "CO₂ (kg)", "Level", "Activities"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                      {u.username}
                      {u.role === "ADMIN" && (
                        <span style={{ fontSize: "10px", background: "rgba(168,85,247,0.2)", color: "var(--neon-purple)", padding: "2px 6px", borderRadius: "4px", marginLeft: "6px" }}>
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{u.fullName || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{u.email || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{u.place || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{u.job || "—"}</td>
                    <td style={{ padding: "10px 12px", color: u.sustainabilityScore >= 80 ? "var(--neon-green)" : u.sustainabilityScore >= 50 ? "var(--neon-yellow)" : "var(--neon-red)", fontWeight: 600 }}>
                      {u.sustainabilityScore.toFixed(0)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{u.totalCarbonFootprint.toFixed(1)}</td>
                    <td style={{ padding: "10px 12px" }}>L{u.level}</td>
                    <td style={{ padding: "10px 12px" }}>{u._count?.activities || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Factors Tab */}
      {tab === "factors" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card">
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={18} color="var(--neon-green)" />
              Verified Emission Factors Database
            </h3>
            <FactorsTable />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function FactorsTable() {
  const [factors, setFactors] = useState<Record<string, { id: string; subcategory: string; factor: number; unit: string; region: string; sourceOrg: string }[]>>({});

  useEffect(() => {
    fetch("/api/admin/factors")
      .then((r) => r.json())
      .then((data) => setFactors(data.grouped || {}))
      .catch(() => toast.error("Failed to load factors"));
  }, []);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {Object.entries(factors).map(([category, items]) => (
        <div key={category}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--neon-blue)", marginBottom: "8px", textTransform: "capitalize" }}>
            {category}
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
                {["Subcategory", "Factor", "Unit", "Region", "Source"].map((h) => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "6px 10px" }}>{f.subcategory}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: "var(--neon-green)" }}>{f.factor}</td>
                  <td style={{ padding: "6px 10px", color: "var(--text-secondary)" }}>kg CO₂/{f.unit}</td>
                  <td style={{ padding: "6px 10px" }}>{f.region}</td>
                  <td style={{ padding: "6px 10px", color: "var(--text-secondary)" }}>{f.sourceOrg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

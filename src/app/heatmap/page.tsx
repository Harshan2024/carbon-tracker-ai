"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Map, Leaf, ArrowLeft, Globe, Users, Flame } from "lucide-react";

interface CityData {
  city: string;
  totalCo2: number;
  userCount: number;
  avgDailyCo2: number;
}

// Map cities to approximate grid positions (percentage-based)
const CITY_POSITIONS: Record<string, { x: number; y: number }> = {
  "New York": { x: 28, y: 35 },
  "Los Angeles": { x: 15, y: 38 },
  "San Francisco": { x: 13, y: 36 },
  "Chicago": { x: 24, y: 33 },
  "London": { x: 48, y: 28 },
  "Paris": { x: 49, y: 30 },
  "Berlin": { x: 52, y: 28 },
  "Mumbai": { x: 68, y: 45 },
  "Delhi": { x: 69, y: 38 },
  "Bangalore": { x: 69, y: 50 },
  "Chennai": { x: 70, y: 50 },
  "Tokyo": { x: 82, y: 36 },
  "Sydney": { x: 85, y: 72 },
  "Dubai": { x: 62, y: 42 },
  "Singapore": { x: 76, y: 55 },
};

function getBeaconColor(avgCo2: number): string {
  if (avgCo2 <= 5) return "var(--neon-green)";
  if (avgCo2 <= 15) return "var(--neon-orange)";
  return "var(--neon-red)";
}

export default function HeatmapPage() {
  const router = useRouter();
  const [cities, setCities] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("carbon-theme") || "default";
    document.body.setAttribute("data-theme", savedTheme);

    fetch("/api/heatmap")
      .then((r) => r.json())
      .then((data) => {
        setCities(data.cities || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load heatmap data");
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: "100vh", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}
      >
        <button
          className="btn-secondary"
          onClick={() => router.push("/dashboard")}
          style={{ padding: "8px 12px" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--neon-green), var(--neon-blue))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Leaf size={20} color="#000" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>
            <span className="gradient-text">City Carbon</span>{" "}
            <span style={{ color: "var(--text-secondary)" }}>Heatmap</span>
          </h1>
        </div>
      </motion.div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: "12px 18px",
          borderRadius: "12px",
          background: "rgba(var(--neon-blue-rgb, 139,105,20), 0.06)",
          backgroundColor: "rgba(184,134,11,0.05)",
          border: "1px solid var(--border-glass)",
          marginBottom: "24px",
          fontSize: "13px",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Globe size={16} color="var(--neon-blue)" />
        Data is aggregated at the city level. Individual user data is never exposed.
      </motion.div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
        style={{
          position: "relative",
          width: "100%",
          height: "500px",
          overflow: "hidden",
          background: "linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))",
        }}
      >
        {/* Grid Lines */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 5}%`} x2="100%" y2={`${(i + 1) * 5}%`} stroke="white" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 5}%`} y1="0" x2={`${(i + 1) * 5}%`} y2="100%" stroke="white" />
          ))}
        </svg>

        {/* Map Label */}
        <div style={{ position: "absolute", top: "16px", left: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <Map size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
          Global Carbon Emissions by City
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div className="spinner" />
          </div>
        ) : cities.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
            <p>No city data available yet. Cities need 2+ active users to appear.</p>
          </div>
        ) : (
          /* City Beacons */
          cities.map((city) => {
            const pos = CITY_POSITIONS[city.city] || {
              x: 30 + Math.random() * 40,
              y: 25 + Math.random() * 40,
            };
            const color = getBeaconColor(city.avgDailyCo2);

            return (
              <motion.div
                key={city.city}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + Math.random() * 0.3 }}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  zIndex: selectedCity?.city === city.city ? 10 : 1,
                }}
                onClick={() => setSelectedCity(selectedCity?.city === city.city ? null : city)}
              >
                {/* Beacon */}
                <div className="beacon" style={{ background: color, color }}>
                  {/* Pulse ring */}
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                </div>

                {/* City Label */}
                <div
                  style={{
                    position: "absolute",
                    top: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: color,
                    textShadow: "0 0 10px rgba(0,0,0,0.8)",
                  }}
                >
                  {city.city}
                </div>

                {/* Popup Card */}
                {selectedCity?.city === city.city && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="glass-card"
                    style={{
                      position: "absolute",
                      top: "-140px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "220px",
                      padding: "16px",
                      zIndex: 20,
                    }}
                  >
                    <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "10px", color }}>
                      📍 {city.city}
                    </h4>
                    <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>
                          <Flame size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Total CO₂
                        </span>
                        <span style={{ fontWeight: 600 }}>{city.totalCo2.toFixed(1)} kg</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>
                          <Users size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Active Users
                        </span>
                        <span style={{ fontWeight: 600 }}>{city.userCount}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Avg Daily</span>
                        <span style={{ fontWeight: 600, color }}>{city.avgDailyCo2.toFixed(1)} kg/day</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            color: "var(--text-secondary)",
            backgroundColor: "var(--bg-glass)",
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid var(--border-glass)",
          }}
        >
          {[
            { color: "var(--neon-green)", label: "Safe (<5 kg/day)" },
            { color: "var(--neon-orange)", label: "Moderate (5-15)" },
            { color: "var(--neon-red)", label: "High (>15)" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

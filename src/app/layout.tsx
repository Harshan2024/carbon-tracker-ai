import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarbonTracker AI - Real-Time Carbon Emission Tracking",
  description:
    "Track your daily carbon footprint with AI-powered natural language processing. Compare against global standards, earn eco-rewards, and help save the planet.",
  keywords: "carbon tracker, carbon footprint, sustainability, eco tracker, carbon emissions, climate change",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Background ambient orbs */}
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />

        {/* Main content */}
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "rgba(18, 18, 26, 0.9)",
              color: "#f0f0f0",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
              fontFamily: "'Outfit', sans-serif",
            },
            success: {
              iconTheme: { primary: "#00ff87", secondary: "#000" },
            },
            error: {
              iconTheme: { primary: "#ff0044", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}

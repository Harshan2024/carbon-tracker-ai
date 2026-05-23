"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Leaf, Eye, EyeOff, Mail, Lock, Globe, User } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    defaultRegion: "GLOBAL",
  });

  const [socialModal, setSocialModal] = useState<{
    isOpen: boolean;
    provider: "google" | "facebook" | "linkedin" | null;
    step: "connecting" | "profile" | "custom_input" | "authenticating";
    user?: {
      username: string;
      fullName: string;
      email: string;
      passwordSeed: string;
    };
  }>({
    isOpen: false,
    provider: null,
    step: "connecting",
  });

  const [customSocial, setCustomSocial] = useState({
    username: "",
    email: "",
    password: "",
    isRegisterMode: false,
  });

  useEffect(() => {
    if (socialModal.isOpen && socialModal.step === "connecting") {
      const timer = setTimeout(() => {
        setSocialModal((prev) => ({ ...prev, step: "profile" }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [socialModal.isOpen, socialModal.step]);

  const handleSocialClick = (
    provider: "google" | "facebook" | "linkedin",
    user: { username: string; fullName: string; email: string; passwordSeed: string }
  ) => {
    setCustomSocial({
      username: "",
      email: "",
      password: "",
      isRegisterMode: false,
    });
    setSocialModal({
      isOpen: true,
      provider,
      step: "connecting",
      user,
    });
  };

  const handleSocialContinue = async () => {
    if (!socialModal.user) return;
    setSocialModal((prev) => ({ ...prev, step: "authenticating" }));
    
    // Simulate oauth validation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: socialModal.user.username,
          password: socialModal.user.passwordSeed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Social authentication failed");
        setSocialModal((prev) => ({ ...prev, step: "profile" }));
        return;
      }
      toast.success(`Welcome back via ${socialModal.provider === "google" ? "Google" : socialModal.provider === "facebook" ? "Facebook" : "LinkedIn"}! 🌿`);
      setSocialModal({ isOpen: false, provider: null, step: "connecting" });
      if (data.user?.profileCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/profile-setup");
      }
    } catch {
      toast.error("Social login connection error.");
      setSocialModal((prev) => ({ ...prev, step: "profile" }));
    }
  };

  const handleCustomSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSocial.username) {
      toast.error("Please enter a username or email");
      return;
    }
    if (!customSocial.password) {
      toast.error("Please enter a password");
      return;
    }
    setSocialModal((prev) => ({ ...prev, step: "authenticating" }));
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: customSocial.username,
          password: customSocial.password,
        }),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        toast.success(`Logged in as ${customSocial.username}! 🌿`);
        setSocialModal({ isOpen: false, provider: null, step: "connecting" });
        if (data.user?.profileCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/profile-setup");
        }
        return;
      }

      // If login failed and register mode is selected, register user
      if (customSocial.isRegisterMode) {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: customSocial.username,
            email: customSocial.email || `${customSocial.username}@carbontracker.ai`,
            password: customSocial.password,
            defaultRegion: "GLOBAL",
          }),
        });

        const data = await regRes.json();
        if (!regRes.ok) {
          toast.error(data.error || "Failed to auto-register new account");
          setSocialModal((prev) => ({ ...prev, step: "custom_input" }));
          return;
        }

        toast.success(`Successfully registered and logged in as ${customSocial.username}! 🎉`);
        setSocialModal({ isOpen: false, provider: null, step: "connecting" });
        router.push("/profile-setup");
      } else {
        const errData = await loginRes.json();
        toast.error(errData.error || "Invalid username or password. Check 'Auto-Register' to sign up.");
        setSocialModal((prev) => ({ ...prev, step: "custom_input" }));
      }
    } catch (err) {
      console.error("Custom social auth error:", err);
      toast.error("Social login connection error.");
      setSocialModal((prev) => ({ ...prev, step: "custom_input" }));
    }
  };

  useEffect(() => {
    // Remove inherited dark theme for clean login page
    document.body.removeAttribute("data-theme");
    document.body.style.background = "#ffffff";
    document.body.style.padding = "0";
    document.body.style.margin = "0";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { username: form.username, password: form.password }
        : form;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Authentication failed");
        return;
      }
      toast.success(isLogin ? "Welcome back! 🌿" : "Account created! 🎉");
      if (data.user?.profileCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/profile-setup");
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px 13px 42px",
    border: "1.5px solid #e8ddd4",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1a1208",
    outline: "none",
    background: "#fffcf8",
    fontFamily: "'Outfit', sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Outfit', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ─── LEFT PANEL: White + Illustration ─── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1,
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background blobs */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,120,90,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "-60px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,120,90,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Brand mark top-left */}
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #c4785a, #8b4513)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Leaf size={16} color="#fff" />
          </div>
          <span
            style={{ fontWeight: 700, fontSize: "16px", color: "#1a1208" }}
          >
            CarbonTracker AI
          </span>
        </div>

        {/* Illustration */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Image
            src="/team_illustration.png"
            alt="Team working together"
            width={420}
            height={320}
            style={{ maxWidth: "100%", height: "auto" }}
            priority
          />
        </div>

        {/* Caption */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: "center", marginTop: "24px", maxWidth: "360px", zIndex: 1 }}
        >
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1a1208",
              marginBottom: "10px",
              lineHeight: 1.3,
            }}
          >
            Track. Reduce. Offset.
          </h2>
          <p style={{ fontSize: "14px", color: "#6b5b3e", lineHeight: 1.6 }}>
            Join thousands of people making a real difference for our planet
            with AI-powered carbon tracking.
          </p>

          {/* Trust badges */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {[
              { num: "12K+", label: "Members" },
              { num: "140T", label: "CO₂ Tracked" },
              { num: "98%", label: "Accuracy" },
            ].map((b) => (
              <div key={b.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#c4785a",
                  }}
                >
                  {b.num}
                </div>
                <div style={{ fontSize: "11px", color: "#6b5b3e" }}>
                  {b.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ─── RIGHT PANEL: Terracotta + Auth Card ─── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1,
          background: "linear-gradient(145deg, #c4785a 0%, #a85c3e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative shapes on right panel */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        {/* White Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "44px 40px",
            width: "100%",
            maxWidth: "420px",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Brand inside card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #c4785a, #8b4513)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Leaf size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "16px", color: "#1a1208" }}>
              CarbonTracker AI
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h3
                style={{
                  textAlign: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1a1208",
                  marginBottom: "6px",
                  marginTop: "4px",
                  lineHeight: 1.3,
                }}
              >
                {isLogin
                  ? "Get more things done with"
                  : "Create your free account"}
              </h3>
              {isLogin && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1a1208",
                    marginBottom: "4px",
                  }}
                >
                  the Carbon platform.
                </p>
              )}
              <p
                style={{
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#8a7060",
                  marginBottom: "24px",
                  lineHeight: 1.5,
                }}
              >
                {isLogin ? (
                  <>
                    Access the most powerful tool in the entire{" "}
                    <span style={{ color: "#c4785a", fontStyle: "italic" }}>
                      ecology and carbon
                    </span>{" "}
                    industry.
                  </>
                ) : (
                  "Start your eco journey today. It's completely free."
                )}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "13px" }}
          >
            {/* Username */}
            <div style={{ position: "relative" }}>
              <User
                size={15}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#c4785a",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Username"
                required
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#c4785a")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#e8ddd4")
                }
              />
            </div>

            {/* Email (register only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden", position: "relative" }}
                >
                  <Mail
                    size={15}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#c4785a",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="E-mail Address"
                    required={!isLogin}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "#c4785a")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "#e8ddd4")
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#c4785a",
                  pointerEvents: "none",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                style={{ ...inputStyle, paddingRight: "44px" }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#c4785a")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#e8ddd4")
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#c4785a",
                  padding: "0",
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Region (register only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden", position: "relative" }}
                >
                  <Globe
                    size={15}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#c4785a",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <select
                    value={form.defaultRegion}
                    onChange={(e) =>
                      setForm({ ...form, defaultRegion: e.target.value })
                    }
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="GLOBAL">🌍 Global Average</option>
                    <option value="IN">🇮🇳 India</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="UK">🇬🇧 United Kingdom</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: loading ? "#a07858" : "#2d1810",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.2s",
                  letterSpacing: "0.3px",
                }}
              >
                {loading ? "Please wait…" : isLogin ? "Login" : "Create Account"}
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: "#fff",
                  color: "#2d1810",
                  border: "1.5px solid #ddd4ca",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {isLogin ? "Create account" : "Back to Login"}
              </button>
            </div>
          </form>

          {/* Social Login */}
          <div style={{ textAlign: "center", marginTop: "22px" }}>
            <p
              style={{
                fontSize: "12px",
                color: "#c4785a",
                marginBottom: "14px",
                fontStyle: "italic",
              }}
            >
              Or login with
            </p>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "12px" }}
            >
              {/* Facebook */}
              <button
                onClick={() =>
                  handleSocialClick("facebook", {
                    username: "john_driver",
                    fullName: "John Doe",
                    email: "john@corporate.com",
                    passwordSeed: "john123",
                  })
                }
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#1877f2",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Google */}
              <button
                onClick={() =>
                  handleSocialClick("google", {
                    username: "sara_eco",
                    fullName: "Sara Jenkins",
                    email: "sara@greenmail.org",
                    passwordSeed: "sara123",
                  })
                }
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1.5px solid #e0d8d0",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                     fill="#4285F4"
                     d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                     fill="#34A853"
                     d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                     fill="#FBBC05"
                     d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                     fill="#EA4335"
                     d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() =>
                  handleSocialClick("linkedin", {
                    username: "priya_nature",
                    fullName: "Priya Sharma",
                    email: "priya@techcorp.in",
                    passwordSeed: "priya123",
                  })
                }
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#0077b5",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {socialModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(20, 15, 12, 0.7)",
              backdropFilter: "blur(10px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(196, 120, 90, 0.2)",
                borderRadius: "24px",
                boxShadow: "0 30px 90px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.08)",
                width: "100%",
                maxWidth: "440px",
                padding: "40px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {/* Header Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "30px",
                  opacity: 0.8,
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #c4785a, #8b4513)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Leaf size={12} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#2d1810",
                  }}
                >
                  CarbonTracker AI Secure Sign-In
                </span>
              </div>

              {socialModal.step === "connecting" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
                  {/* Glowing Spinner */}
                  <div style={{ position: "relative", width: "80px", height: "80px" }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: "50%",
                        border: "4px solid #f3e5db",
                        borderTopColor:
                          socialModal.provider === "google"
                            ? "#4285F4"
                            : socialModal.provider === "facebook"
                            ? "#1877f2"
                            : "#0077b5",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {socialModal.provider === "google" && (
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {socialModal.provider === "facebook" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877f2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      )}
                      {socialModal.provider === "linkedin" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#0077b5">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1208", marginBottom: "8px" }}>
                      Connecting to {socialModal.provider === "google" ? "Google" : socialModal.provider === "facebook" ? "Facebook" : "LinkedIn"}
                    </h4>
                    <p style={{ fontSize: "14px", color: "#8a7060" }}>
                      Establishing secure handshake protocol...
                    </p>
                  </div>
                </div>
              )}

              {socialModal.step === "profile" && socialModal.user && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  {/* Secure Connection Badge */}
                  <div
                    style={{
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "12px",
                      marginBottom: "24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2e7d32", display: "inline-block" }} />
                    Secure Handshake Complete
                  </div>

                  {/* Avatar */}
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: 700,
                      marginBottom: "16px",
                      boxShadow: "0 8px 24px rgba(45, 106, 79, 0.2)",
                      border: "2px solid #fff",
                    }}
                  >
                    {socialModal.user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1208", marginBottom: "4px" }}>
                    {socialModal.user.fullName}
                  </h4>
                  <p style={{ fontSize: "14px", color: "#8a7060", marginBottom: "20px" }}>
                    {socialModal.user.email}
                  </p>

                  <div
                    style={{
                      background: "#fffcf9",
                      border: "1.5px solid #f3e5db",
                      borderRadius: "12px",
                      padding: "16px",
                      width: "100%",
                      fontSize: "12px",
                      color: "#6b5b3e",
                      textAlign: "left",
                      lineHeight: 1.5,
                      marginBottom: "28px",
                      boxSizing: "border-box",
                    }}
                  >
                    <p style={{ fontWeight: 700, color: "#2d1810", marginBottom: "6px" }}>
                      Permissions Requested:
                    </p>
                    <ul style={{ paddingLeft: "16px", margin: 0 }}>
                      <li>Access your basic profile info (Name & Avatar)</li>
                      <li>Verify your email address ({socialModal.user.email})</li>
                      <li>Sync carbon history and preferences</li>
                    </ul>
                  </div>

                   {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                    <button
                      onClick={handleSocialContinue}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: "linear-gradient(135deg, #2d1810 0%, #1b0a04 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(45, 24, 16, 0.15)",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "translateY(-1px)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "translateY(0)")
                      }
                    >
                      Continue as {socialModal.user.fullName.split(" ")[0]}
                    </button>
                    <button
                      onClick={() => setSocialModal({ isOpen: false, provider: null, step: "connecting" })}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: "#fff",
                        color: "#2d1810",
                        border: "1.5px solid #ddd4ca",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => setSocialModal((prev) => ({ ...prev, step: "custom_input" }))}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#c4785a",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        marginTop: "12px",
                      }}
                    >
                      Use a different account
                    </button>
                  </div>
                </div>
              )}

              {socialModal.step === "custom_input" && (
                <form
                  onSubmit={handleCustomSocialSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1a1208",
                      textAlign: "center",
                      marginBottom: "6px",
                    }}
                  >
                    Sign in with your {socialModal.provider === "google" ? "Google" : socialModal.provider === "facebook" ? "Facebook" : "LinkedIn"} Account
                  </h4>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#8a7060",
                      textAlign: "center",
                      marginBottom: "14px",
                    }}
                  >
                    Enter your credentials to securely link with CarbonTracker.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#2d1810" }}>
                      Username or Email
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. sara_eco or your@email.com"
                      required
                      value={customSocial.username}
                      onChange={(e) => setCustomSocial({ ...customSocial, username: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#2d1810" }}>
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      value={customSocial.password}
                      onChange={(e) => setCustomSocial({ ...customSocial, password: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      id="autoRegisterCheck"
                      checked={customSocial.isRegisterMode}
                      onChange={(e) => setCustomSocial({ ...customSocial, isRegisterMode: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                    <label
                      htmlFor="autoRegisterCheck"
                      style={{ fontSize: "12px", color: "#6b5b3e", cursor: "pointer", userSelect: "none" }}
                    >
                      Auto-register account if it doesn't exist
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: "13px",
                        background: "linear-gradient(135deg, #2d1810 0%, #1b0a04 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Authenticate
                    </button>
                    <button
                      type="button"
                      onClick={() => setSocialModal((prev) => ({ ...prev, step: "profile" }))}
                      style={{
                        flex: 1,
                        padding: "13px",
                        background: "#fff",
                        color: "#2d1810",
                        border: "1.5px solid #ddd4ca",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}

              {socialModal.step === "authenticating" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", width: "100%" }}>
                  {/* Linear Loading Progress */}
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        height: "6px",
                        width: "100%",
                        background: "#f3e5db",
                        borderRadius: "3px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <motion.div
                        initial={{ left: "-40%" }}
                        animate={{ left: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        style={{
                          position: "absolute",
                          height: "100%",
                          width: "40%",
                          background: "linear-gradient(90deg, #c4785a, #8b4513)",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1208", marginBottom: "8px" }}>
                      Logging you in securely...
                    </h4>
                    <p style={{ fontSize: "14px", color: "#8a7060" }}>
                      Syncing profile info with CarbonTracker AI
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

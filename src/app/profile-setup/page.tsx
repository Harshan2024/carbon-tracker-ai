"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { User, MapPin, Briefcase, Calendar, Shield, ArrowRight } from "lucide-react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("carbon-theme") || "default";
    document.body.setAttribute("data-theme", savedTheme);
  }, []);

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "",
    place: "",
    job: "",
  });

  const steps = [
    { field: "fullName", label: "What's your full name?", icon: User, placeholder: "Enter your full name", type: "text" },
    { field: "age", label: "How old are you?", icon: Calendar, placeholder: "Enter your age", type: "number" },
    { field: "gender", label: "Your gender", icon: Shield, placeholder: "", type: "select", options: ["Male", "Female", "Non-binary", "Prefer not to say"] },
    { field: "place", label: "Which city do you live in?", icon: MapPin, placeholder: "e.g., Mumbai, London, New York", type: "text" },
    { field: "job", label: "What do you do for work?", icon: Briefcase, placeholder: "e.g., Software Engineer, Student", type: "text" },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    const val = form[currentStep.field as keyof typeof form];
    if (!val) {
      toast.error("Please fill in this field");
      return;
    }
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save profile");
        return;
      }

      toast.success("Profile saved! Welcome aboard! 🌿");
      router.push("/dashboard");
    } catch {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%", maxWidth: "500px" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            <span className="gradient-text">Complete Your Profile</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            This information is <strong style={{ color: "var(--neon-green)" }}>strictly private</strong> — only you and admins can see it.
          </p>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: "4px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "2px",
            marginBottom: "32px",
            overflow: "hidden",
          }}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--neon-green), var(--neon-blue))",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Step Card */}
        <div className="glass-card" style={{ padding: "36px" }}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(var(--neon-green-rgb, 184,134,11), 0.12), rgba(var(--neon-blue-rgb, 139,105,20), 0.12))",
                backgroundColor: "rgba(184,134,11,0.10)",
                border: "1px solid var(--border-glass)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <currentStep.icon size={28} color="var(--neon-green)" />
            </div>

            {/* Step Label */}
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>
              {currentStep.label}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
              Step {step + 1} of {steps.length}
            </p>

            {/* Input */}
            {currentStep.type === "select" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "28px" }}>
                {currentStep.options?.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, [currentStep.field]: opt })}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      border: "1.5px solid",
                      borderColor:
                        form[currentStep.field as keyof typeof form] === opt
                          ? "var(--neon-green)"
                          : "var(--border-glass)",
                      background:
                        form[currentStep.field as keyof typeof form] === opt
                          ? "rgba(184,134,11,0.12)"
                          : "rgba(255,250,240,0.5)",
                      color:
                        form[currentStep.field as keyof typeof form] === opt
                          ? "var(--neon-green)"
                          : "var(--text-secondary)",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "14px",
                      fontWeight: 500,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="input-field"
                type={currentStep.type}
                placeholder={currentStep.placeholder}
                value={form[currentStep.field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [currentStep.field]: e.target.value })}
                style={{ marginBottom: "28px" }}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            )}

            {/* Navigation */}
            <div style={{ display: "flex", gap: "12px" }}>
              {step > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => setStep(step - 1)}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
              )}
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={loading}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }} />
                ) : (
                  <>
                    {isLastStep ? "Complete Setup" : "Continue"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Privacy Badge */}
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            color: "var(--text-secondary)",
            fontSize: "12px",
          }}
        >
          <Shield size={14} />
          Your data is encrypted and never shared publicly
        </div>
      </motion.div>
    </div>
  );
}

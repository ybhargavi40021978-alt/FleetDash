import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Zap,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AuthPage({ inModal = false }) {
  const { login, register, quickDemoLogin, setShowAuthModal } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Manager");
  const [showPassword, setShowPassword] = useState(false);

  // Status message state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (!email || !password || (!isLoginTab && !name)) {
      setErrorMsg("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    let result;
    if (isLoginTab) {
      result = await login(email, password);
    } else {
      result = await register(name, email, password, role);
    }

    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setSuccessMsg(result.message);
    }
  };

  const handleQuickDemo = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    const result = await quickDemoLogin();
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setSuccessMsg(result.message);
    }
  };

  return (
    <div className={`auth-container ${inModal ? "in-modal" : ""}`}>
      {/* Animated Glowing Background Orbs */}
      {!inModal && (
        <>
          <div className="bg-glow orb-1" />
          <div className="bg-glow orb-2" />
          <div className="bg-glow orb-3" />
        </>
      )}

      {/* Main Glass Card */}
      <div className={`auth-card glass-bright ${inModal ? "modal-card" : "animate-pop"}`}>
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-brand-badge pulse-glow">
            <Zap className="auth-bolt-icon" />
          </div>
          <h1 className="auth-title">FleetDash Engine</h1>
          <p className="auth-subtitle">High-Throughput Spatial Fleet Telemetry System</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`tab-btn ${isLoginTab ? "active" : ""}`}
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
          >
            <ShieldCheck size={16} />
            <span>Sign In</span>
          </button>

          <button
            className={`tab-btn ${!isLoginTab ? "active" : ""}`}
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
          >
            <Sparkles size={16} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="auth-alert alert-error animate-shake">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert alert-success animate-fade-in">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Registration Name Field */}
          {!isLoginTab && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="e.g. Swathi Patgar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLoginTab}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="input-group">
            <label>Work Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="manager@infotact.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Role selector for registration */}
          {!isLoginTab && (
            <div className="input-group">
              <label>Account Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Manager">Fleet Manager</option>
                <option value="Driver">Driver</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn-auth-submit" disabled={loading}>
            <span>{loading ? "Processing..." : isLoginTab ? "Launch Dashboard" : "Register & Open Dashboard"}</span>
            <ArrowRight size={18} />
          </button>

          {/* Quick Demo Login Option */}
          <button
            type="button"
            className="btn-demo-quick"
            onClick={handleQuickDemo}
            disabled={loading}
          >
            <Sparkles size={16} />
            <span>1-Click Demo Login (Admin)</span>
          </button>

          {/* Continue as Guest */}
          <button
            type="button"
            className="btn-guest-continue"
            onClick={() => setShowAuthModal(false)}
          >
            <span>Continue as Guest Observer →</span>
          </button>
        </form>

        {/* Footer Feature Badges */}
        <div className="auth-footer-features">
          <div className="feature-pill">60 FPS Canvas API</div>
          <div className="feature-pill">Worker Threads</div>
          <div className="feature-pill">Turf.js Geofencing</div>
        </div>
      </div>
    </div>
  );
}

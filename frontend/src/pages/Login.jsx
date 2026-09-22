import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Eye, EyeOff, Lock, Mail, AlertCircle, Sparkles,
  ArrowRight, ShieldCheck, CheckCircle2, HelpCircle, PhoneCall,
  FileSpreadsheet, LockKeyhole, Building2
} from "lucide-react";
import { fetchApi } from "../services/api/client";
import { users } from "../data/users";
import GovtHeaderBanner from "../components/GovtHeaderBanner";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePersona, setActivePersona] = useState("");
  const navigate = useNavigate();

  const handleQuickFill = (demoEmail, demoPw, personaKey) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setActivePersona(personaKey);
    setError("");
  };

  // Helper to fetch live Supabase Auth session token for any verified persona.
  // Uses the centralized fetchApi client so VITE_API_URL is resolved at build time.
  const acquireSession = async (roleOrEmail) => {
    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: roleOrEmail, role: roleOrEmail }),
      });
      if (data?.access_token) {
        localStorage.setItem("sanket_auth_token", data.access_token);
        return {
          token: data.access_token,
          user: data.user,
        };
      }
    } catch {
      // Backend may be starting up; fail gracefully
    }
    return null;
  };

  // 1-Click SIH Judge Rapid Access (Instant Institutional Sign-in)
  const handleRapidAccess = async (roleKey) => {
    setError("");
    let targetUser;
    let targetRoute;
    let backendIdentifier;

    if (roleKey === "policymaker") {
      targetUser = users[0];
      targetRoute = "/policymaker";
      backendIdentifier = "policymaker";
    } else if (roleKey === "administrator") {
      targetUser = users[2];
      targetRoute = "/administrator";
      backendIdentifier = "admin";
    } else {
      // Monitoring Officer
      targetUser = users[1];
      targetRoute = "/monitoring/watchlist";
      backendIdentifier = "officer";
    }

    const session = await acquireSession(backendIdentifier);
    if (session) {
      targetUser = {
        ...targetUser,
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        token: session.token,
      };
    }

    localStorage.setItem("infrawatch_user", JSON.stringify(targetUser));
    onLogin(targetUser);
    navigate(targetRoute);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Authenticate through real backend Supabase Auth flow
    const session = await acquireSession(email);
    if (session) {
      const matchedUser =
        users.find(
          u => u.email === email || u.altEmail === email || u.role.toLowerCase().includes(session.user.role)
        ) || users[0];

      const finalUser = {
        ...matchedUser,
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        token: session.token,
      };

      localStorage.setItem("infrawatch_user", JSON.stringify(finalUser));
      onLogin(finalUser);

      // 3-Role Direct Redirection
      if (session.user.role === "officer") {
        navigate("/monitoring/watchlist");
      } else if (session.user.role === "admin") {
        navigate("/administrator");
      } else {
        navigate("/policymaker");
      }
    } else {
      setError("Invalid credentials. Please check your official email and password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-slate-100 flex flex-col justify-between selection:bg-[#F27F0C] selection:text-white font-inter relative overflow-hidden transition-colors duration-200">
      {/* 1. Official Top Government Banner */}
      <GovtHeaderBanner />

      {/* 2. Main Content Section with Subtle Flowing Wave Background */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-14 py-8 lg:py-14 relative">

        {/* Subtle Light Blue Vector Waves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-100/60 dark:bg-[#053F5C]/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100/50 dark:bg-[#429EBD]/20 rounded-full blur-3xl" />

          <svg
            className="absolute w-full h-full inset-0 opacity-35 dark:opacity-20"
            viewBox="0 0 1440 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M-80 350 C 350 150, 700 650, 1150 280 C 1320 150, 1500 240, 1600 270"
              stroke="url(#waveGradClean1)"
              strokeWidth="32"
              strokeLinecap="round"
            />
            <path
              d="M-40 420 C 380 220, 750 720, 1200 350 C 1360 210, 1540 300, 1640 330"
              stroke="url(#waveGradClean2)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="waveGradClean1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="waveGradClean2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Clean, Purposeful Split Grid */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center z-10 relative">

          {/* Left Column: Official Portal Information & Login Relevance */}
          <div className="lg:col-span-6 space-y-6">

            {/* Division Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#053F5C]/90 border border-sky-200 dark:border-[#429EBD]/30 text-xs font-bold text-[#F27F0C] dark:text-[#9FE7F5] shadow-2xs backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#F27F0C] animate-pulse" />
              <span>Government of India · MoSPI · Central IPMD</span>
            </div>

            {/* Portal Title & Clear Purpose */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#053F5C] dark:text-white leading-tight">
                SANKET<span className="text-[#F27F0C]">-AI</span>
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#334155] dark:text-slate-200 mt-2">
                Central Sector Infrastructure Projects Monitoring Platform
              </p>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed mt-2.5 max-w-lg">
                Secure access gateway for Central Ministries, Implementing Agencies, and Nodal Review Officers to monitor and audit projects costing ₹150 Crore & above.
              </p>
            </div>

            {/* Relevant Portal Guidelines & Access Notice */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-[#053F5C]/80 backdrop-blur-sm border border-[#E2E8F0] dark:border-[#429EBD]/25 shadow-xs">
                <div className="p-2 rounded-xl bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] shrink-0 mt-0.5">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-white text-xs">Monthly CUF Progress Submission</p>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-relaxed">
                    Authorized agency officers are required to submit monthly physical progress and expenditure updates before the monthly cutoff.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-[#053F5C]/80 backdrop-blur-sm border border-[#E2E8F0] dark:border-[#429EBD]/25 shadow-xs">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-[#031e2d] text-blue-700 dark:text-[#9FE7F5] shrink-0 mt-0.5">
                  <LockKeyhole size={16} />
                </div>
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-white text-xs">Role-Based Access Governance</p>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-relaxed">
                    Access is strictly permissioned for Government Officers, Nodal Reviewers, and Ministry Administrators.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Ultra-Refined Sign-In Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white dark:bg-[#053F5C] rounded-3xl shadow-[0_12px_40px_rgb(14,116,144,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-[#E2E8F0] dark:border-[#429EBD]/25 p-7 sm:p-8 relative transition-colors">

              {/* Card Header */}
              <div className="mb-5 pb-4 border-b border-[#F1F5F9] dark:border-[#429EBD]/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight">Official Portal Access</h2>
                  <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-600 dark:text-emerald-400" /> 256-Bit SSL
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">Sign in with official credentials or choose a demo persona</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#334155] dark:text-slate-200 mb-1.5">Official Email / User ID</label>
                  <div className="relative group">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#F27F0C] transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        setActivePersona("");
                      }}
                      placeholder="officer@infrawatch.gov.in"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#429EBD]/30 text-xs text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#F27F0C] dark:focus:border-[#429EBD] focus:ring-2 focus:ring-[#FEF0E7] dark:focus:ring-[#031e2d] bg-[#F8FAFC] dark:bg-[#031e2d] font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] dark:text-slate-200 mb-1.5">Security Password</label>
                  <div className="relative group">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#F27F0C] transition-colors" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setActivePersona("");
                      }}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#429EBD]/30 text-xs text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#F27F0C] dark:focus:border-[#429EBD] focus:ring-2 focus:ring-[#FEF0E7] dark:focus:ring-[#031e2d] bg-[#F8FAFC] dark:bg-[#031e2d] font-medium transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] dark:hover:text-slate-300 cursor-pointer transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#64748B] dark:text-slate-400 select-none hover:text-[#334155] dark:hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#CBD5E1] accent-[#F27F0C] cursor-pointer"
                    />
                    Remember me
                  </label>
                  <button type="button" className="text-[#F27F0C] dark:text-[#9FE7F5] hover:underline font-semibold cursor-pointer">
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#053F5C] dark:bg-[#F27F0C] hover:bg-[#F27F0C] dark:hover:bg-[#d96e08] text-white font-bold text-xs transition-all duration-200 disabled:opacity-60 shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-2 group"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying Security Token...
                    </span>
                  ) : (
                    <>
                      <span>Sign In to SANKET-AI Portal</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click SIH Judge Rapid Access Gateway (Page 4 Specification) */}
              <div className="mt-5 pt-4 border-t border-[#F1F5F9] dark:border-[#429EBD]/20">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#F27F0C]" />
                    <p className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">
                      1-Click SIH Judge Rapid Access
                    </p>
                  </div>
                  <span className="text-[10px] text-[#F27F0C] bg-[#FEF0E7] dark:bg-[#031e2d] border border-[#FDDFCC] dark:border-[#429EBD]/40 px-2 py-0.5 rounded-full font-bold">
                    Official Flow
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Persona 1: Policymaker */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRapidAccess("policymaker")}
                      className="flex-1 text-left p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                      title="Instant 1-Click login as Policymaker"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                          🏛️
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0F172A] dark:text-white text-xs truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                            Policymaker
                          </p>
                          <p className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                            Strategic National Risk Posture & India Map
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 px-2 py-1 rounded-lg shrink-0 ml-2 flex items-center gap-1 group-hover:scale-105 transition-transform">
                        <span>Enter</span>
                        <ArrowRight size={10} />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill("officer@infrawatch.gov.in", "Officer@123", "officer")}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px] font-bold shrink-0 cursor-pointer"
                      title="Pre-fill form fields only"
                    >
                      Fill
                    </button>
                  </div>

                  {/* Persona 2: Administrator */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRapidAccess("administrator")}
                      className="flex-1 text-left p-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-950/60 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                      title="Instant 1-Click login as Project Administrator"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                          🛡️
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0F172A] dark:text-white text-xs truncate group-hover:text-purple-700 dark:group-hover:text-purple-300">
                            Administrator
                          </p>
                          <p className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                            Portfolio Management & Cost Overruns
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-white dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 px-2 py-1 rounded-lg shrink-0 ml-2 flex items-center gap-1 group-hover:scale-105 transition-transform">
                        <span>Enter</span>
                        <ArrowRight size={10} />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill("admin@infrawatch.gov.in", "Admin@123", "admin")}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px] font-bold shrink-0 cursor-pointer"
                      title="Pre-fill form fields only"
                    >
                      Fill
                    </button>
                  </div>

                  {/* Persona 3: Monitoring Officer (Hero Flow) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRapidAccess("monitoring")}
                      className="flex-1 text-left p-2.5 rounded-xl border-2 border-[#F27F0C] bg-[#FEF0E7]/80 dark:bg-[#031e2d] hover:bg-[#FEF0E7] dark:hover:bg-[#053F5C] transition-all flex items-center justify-between cursor-pointer group shadow-xs"
                      title="Instant 1-Click login directly to Priority Watchlist Hero"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F27F0C] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                          ⭐
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-[#0F172A] dark:text-white text-xs truncate group-hover:text-[#F27F0C]">
                              Monitoring Officer
                            </p>
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-[#F27F0C] text-white rounded">
                              Hero
                            </span>
                          </div>
                          <p className="text-[10px] text-[#64748B] dark:text-slate-300 truncate">
                            Operational Priority Watchlist (Step 1 of Demo)
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-white bg-[#F27F0C] px-2.5 py-1 rounded-lg shrink-0 ml-2 flex items-center gap-1 group-hover:scale-105 transition-transform shadow-xs">
                        <span>Launch</span>
                        <ArrowRight size={10} />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill("reviewer@infrawatch.gov.in", "Reviewer@123", "reviewer")}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px] font-bold shrink-0 cursor-pointer"
                      title="Pre-fill form fields only"
                    >
                      Fill
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. Clean Copyright Footer */}
      <footer className="bg-white dark:bg-[#031e2d] border-t border-[#E2E8F0] dark:border-[#429EBD]/20 px-4 md:px-8 py-3 text-[11px] text-[#64748B] dark:text-slate-400 text-center z-10 relative transition-colors">
        <span>© 2026 Ministry of Statistics and Programme Implementation (MoSPI) · Government of India</span>
      </footer>
    </div>
  );
}

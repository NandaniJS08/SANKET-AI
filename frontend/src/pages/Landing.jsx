import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend, CartesianGrid, AreaChart, Area
} from "recharts";
import {
  Brain, Bell, ShieldAlert, CheckCircle2, ChevronRight,
  ArrowRight, ArrowUp, ExternalLink, AlertTriangle, Target, TrendingUp,
  BarChart3, Zap, Eye, Filter, Building2, Globe, Database,
  Cpu, GitBranch, BookOpen, Link2, ChevronDown, Play, Pause, Layers,
  Radio, Activity, Lightbulb, Users, FileText, Sparkles,
  Workflow, Sliders, ShieldCheck, RefreshCw, Check, Clock, Server,
  Award, Shield, HelpCircle, Lock, Compass, CheckSquare, X, IndianRupee
} from "lucide-react";
import mospiLogo from "../assets/mospi-emblem-clean.png";
import paimanaLogo from "../assets/paimana-logo-clean.png";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import { indiaMapData } from "../data/indiaMapPaths";
import { stateProjectsData, getChoroplethColor } from "../data/stateProjectsData";
import {
  TECH_STACK,
  DEADLINE_SLIP_METRICS,
  COST_ESCALATION_METRICS,
  ML_FEATURE_CATEGORIES,
  PIPELINE_STAGES,
  CHALLENGES_MITIGATION,
  CAPABILITIES_TABLE,
} from "../data/landing.data";

const MAP_LOCATIONS = indiaMapData?.locations ?? [];

/* ─────────────── Optimized, Butter-Smooth Canvas Waves (Zero Lag) ─────────────── */
function GradientWaves({
  horizonColor = "#040d2e",
  waveColor = "#0b1354",
  crestColor = "#F27F0C",
  speed = 0.25,
  amplitude = 1.8,
  opacity = 0.85,
  className = ""
}) {
  const canvasRef = useRef(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    let animationFrameId;
    let time = 0;

    const resize = () => {
      // Cap devicePixelRatio at 1.2 for ultra-smooth 60fps performance without GPU strain
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Pause rendering when canvas is scrolled out of view to conserve 100% GPU
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisibleRef.current;
        isVisibleRef.current = entry.isIntersecting;
        if (!wasVisible && entry.isIntersecting) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
observer.observe(canvas);

const render = () => {
  if (!isVisibleRef.current) return;

  time += 0.012 * speed;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Distant Horizon Gradient
  const horizonGrad = ctx.createLinearGradient(0, 0, 0, h);
  horizonGrad.addColorStop(0, horizonColor);
  horizonGrad.addColorStop(0.65, waveColor);
  horizonGrad.addColorStop(1, "#031e2d");
  ctx.fillStyle = horizonGrad;
  ctx.fillRect(0, 0, w, h);

  const layers = 4;
  const step = Math.max(16, Math.floor(w / 70)); // Optimized step distance

  for (let i = 0; i < layers; i++) {
    const layerProgress = i / layers;
    const yOffset = h * 0.45 + layerProgress * h * 0.55;
    const amp = (amplitude * (14 + i * 16));
    const freq = 0.0016 - i * 0.0002;
    const phase = time * (1 + i * 0.3);

    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, yOffset);

    for (let x = 0; x <= w; x += step) {
      const swell = Math.sin(x * freq * 0.7 + phase * 0.8) * (amp * 0.6);
      const y = yOffset + swell + Math.sin(x * freq + phase) * amp;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();

    const waveGrad = ctx.createLinearGradient(0, yOffset - amp * 1.5, 0, h);
    if (i === layers - 1) {
      waveGrad.addColorStop(0, `${crestColor}28`);
      waveGrad.addColorStop(0.25, `${crestColor}12`);
      waveGrad.addColorStop(1, "rgba(3, 30, 45, 0.95)");
    } else if (i === layers - 2) {
      waveGrad.addColorStop(0, "rgba(66, 158, 189, 0.22)");
      waveGrad.addColorStop(1, "rgba(5, 63, 92, 0.9)");
    } else {
      waveGrad.addColorStop(0, "rgba(5, 63, 92, 0.25)");
      waveGrad.addColorStop(1, "rgba(3, 30, 45, 0.85)");
    }

    ctx.fillStyle = waveGrad;
    ctx.fill();

    if (i >= layers - 2) {
      ctx.strokeStyle = i === layers - 1 ? `${crestColor}44` : "rgba(159, 231, 245, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  animationFrameId = requestAnimationFrame(render);
};

render();

return () => {
  window.removeEventListener("resize", resize);
  observer.disconnect();
  cancelAnimationFrame(animationFrameId);
};
  }, [horizonColor, waveColor, crestColor, speed, amplitude]);

return (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={{ opacity }}>
    <canvas ref={canvasRef} className="w-full h-full block" />
  </div>
);
}

/* ─────────────── One-Time Intersection Observer Hook (No Reverse Animation Bug) ─────────────── */
function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Trigger once and unobserve: keeps elements permanently visible without reverse collapsing
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/* ─────────────── Smooth Forward-Only FadeIn Wrapper ─────────────── */
function FadeIn({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─────────────── Animated Number Counter (Counts smoothly once) ─────────────── */
function AnimNum({ value, decimals = 0, prefix = "", suffix = "" }) {
  const [ref, inView] = useInView(0.08);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1200;
    const steps = 30;
    const inc = value / steps;
    let cur = 0;
    let i = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, value);
      setCount(cur);
      if (++i >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, dur / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{prefix}{count.toFixed(decimals)}{suffix}</span>;
}

/* ─────────────── NOTE: Static data arrays moved to src/data/landing.data.jsx ─────────────── */
/* TECH_STACK, PIPELINE_STAGES, ML_FEATURE_CATEGORIES, CHALLENGES_MITIGATION,
   CAPABILITIES_TABLE, DEADLINE_SLIP_METRICS, COST_ESCALATION_METRICS are imported above. */

/* ─────────────── Custom Chart Tooltip ─────────────── */
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#053F5C] text-white rounded-xl px-4 py-3 shadow-2xl text-xs border border-[#429EBD]/30">
      <div className="font-bold mb-1.5 text-white/90">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill || p.stroke }} />
            <span className="font-medium text-slate-300">{p.name}:</span>
          </div>
          <span className="font-mono font-bold text-white">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT: SANKET-AI LANDING PAGE
═══════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Interactive Tab States
  const [activeModelTab, setActiveModelTab] = useState("deadline"); // "deadline" | "cost"
  const [activeStage, setActiveStage] = useState(0);
  const [activeFeatureCat, setActiveFeatureCat] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setIsScrolled(y > 20);
          setShowTopBtn(y > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F4] dark:bg-[#031e2d] text-[#053F5C] dark:text-slate-100 font-sans overflow-x-hidden transition-colors duration-200 selection:bg-[#F27F0C] selection:text-white">

      {/* ════════════════ CLEAN & PROFESSIONAL GOI MASTER HEADER ════════════════ */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${isDark ? "bg-[#053F5C]/60 text-white" : "bg-white/60 text-[#053F5C]"
          }`}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: isScrolled ? (isDark ? "1px solid rgba(159,231,245,0.15)" : "1px solid rgba(5,63,92,0.1)") : "1px solid transparent",
          boxShadow: isScrolled ? (isDark ? "0 4px 30px rgba(0,0,0,0.4)" : "0 4px 30px rgba(5,63,92,0.08)") : "none",
        }}
      >
        <div className="h-1 bg-gradient-to-r from-[#9FE7F5] via-[#429EBD] via-[#053F5C] via-[#F7AD19] to-[#F27F0C]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

          {/* Clean Government & Portal Branding */}
          <div className="flex items-center gap-3.5">
            <div className="bg-white rounded-xl p-1.5 shadow-xs border border-slate-200/80 dark:border-white/10 flex items-center justify-center">
              <img src={mospiLogo} alt="MoSPI" className="h-8 sm:h-9 w-auto object-contain select-none" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-[#053F5C] dark:text-white leading-none">
                  SANKET<span className="text-[#F27F0C]">-AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#053F5C]/10 dark:bg-white/10 text-[#053F5C] dark:text-[#9FE7F5] border border-[#429EBD]/30 hidden sm:inline-block">
                  MoSPI · IPMD
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                Infrastructure Project Monitoring Division · GoI
              </span>
            </div>
          </div>

          {/* Clean, Spacious & Uncluttered Navigation (4 Essential Anchors) */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {[
              ["Overview", "#problem"],
              ["Pipeline & Architecture", "#pipeline"],
              ["ML Benchmarks", "#models"],
              ["Capability Matrix", "#comparison"]
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[#F27F0C] dark:hover:text-[#9FE7F5] transition-all"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-[11px] font-bold text-slate-700 dark:text-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Team Falcon001 · SIH 2026</span>
            </div>

            <ThemeToggle compact />

            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-4 py-2 bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105 cursor-pointer"
            >
              <Play size={12} className="fill-current" />
              <span>Launch Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════ FULL DESKTOP-HEIGHT SIMPLE & ELEGANT HERO ════════════════ */}
      <section className="relative h-[calc(100vh-64px)] min-h-[600px] bg-gradient-to-b from-[#020f17] via-[#053F5C] to-[#031e2d] text-white flex flex-col justify-center items-center overflow-hidden px-4 sm:px-6">
        {/* Optimized Butter-Smooth Canvas Waves */}
        <GradientWaves
          horizonColor={isDark ? "#020f17" : "#031e2d"}
          waveColor="#053F5C"
          crestColor="#F27F0C"
          speed={1.2}
          amplitude={1.8}
          opacity={0.9}
        />

        {/* Ambient Subtle Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] rounded-full bg-[#F27F0C] opacity-[0.07] blur-[150px] pointer-events-none" />

        {/* Simple & Impactful Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">

          {/* SIH 2026 Micro-Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white mb-6 backdrop-blur-md shadow-sm">
            <Award size={14} className="text-[#F7AD19]" />
            <span>Smart India Hackathon 2026 • PS-26103 • Theme: Smart Automation • Team Falcon001</span>
          </div>

          {/* SANKET-AI Big Bold Title */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none mb-3 drop-shadow-2xl">
            <span className="text-[#F27F0C]" style={{ textShadow: "0 0 50px rgba(242,127,12,0.45)" }}>
              SANKET
            </span>
            <span className="text-[#9FE7F5]">-AI</span>
          </h1>

          {/* Official Subtitle */}
          <p className="text-xs sm:text-sm md:text-base font-black text-[#9FE7F5] tracking-widest uppercase mb-8 max-w-3xl">
            System for Advanced Notification and Knowledge-based Early-warning – AI
          </p>

          {/* Simple 5 Directives Loop (Connected Chain) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
            {["Predict", "Explain", "Prioritise", "Act", "Track"].map((text, idx) => (
              <div key={text} className="flex items-center gap-2 sm:gap-3">
                <div className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-black tracking-wide flex items-center gap-2 shadow-xs transition-all cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27F0C]" />
                  <span>{text}</span>
                </div>
                {idx < 4 && (
                  <span className="text-[#9FE7F5]/50 text-xs font-bold hidden sm:inline">➔</span>
                )}
              </div>
            ))}
          </div>

          {/* Clean Redirect Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-[#F27F0C] hover:bg-[#d96e08] text-white font-black text-sm rounded-xl transition-all shadow-xl hover:shadow-orange-500/30 hover:scale-105 cursor-pointer"
            >
              <Play size={14} className="fill-current" />
              <span>Enter SANKET-AI Portal</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate("/project/615186")}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-[#9FE7F5]/60 font-bold text-sm rounded-xl transition-all backdrop-blur-sm shadow-md cursor-pointer hover:scale-105"
            >
              <Sparkles size={14} className="text-[#F7AD19]" />
              <span>Inspect Flagship #615186</span>
            </button>
          </div>

        </div>

        {/* Subtle Bottom Scroll Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
          <ChevronDown size={18} className="text-[#9FE7F5]/60 animate-bounce mx-auto" />
        </div>
      </section>

      {/* ════════════════ TECHNOLOGY STACK SHOWCASE ════════════════ */}
      <section className="py-12 bg-white dark:bg-[#04283b] border-b border-slate-200 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#053F5C]/10 text-[#053F5C] dark:bg-white/10 dark:text-[#9FE7F5] border border-[#429EBD]/25 mb-2">
              <Cpu size={12} /> Technology Stack · Production Architecture
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#053F5C] dark:text-white">
              Engineered with High-Performance Open-Source AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Built on battle-tested machine learning algorithms, asynchronous API gateways, and enterprise reactive frontend components.
            </p>
          </div>

          {/* Tech Stack 10-Item Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="group relative p-3.5 rounded-2xl bg-[#FAF7F4] dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 hover:border-[#429EBD] dark:hover:border-[#9FE7F5] transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col items-center text-center cursor-default"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 shadow-xs"
                  style={{
                    backgroundColor: `${tech.color}15`,
                    color: tech.color,
                  }}
                >
                  {tech.icon}
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                  {tech.name}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 mb-1"
                  style={{
                    backgroundColor: `${tech.color}15`,
                    color: tech.color,
                  }}
                >
                  {tech.category}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {tech.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 2: THE PROBLEM (4 PILLARS) ════════════════ */}
      <section className="py-16 sm:py-20 bg-[#FAF7F4] dark:bg-[#031e2d] transition-colors" id="problem">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 mb-3 uppercase tracking-widest">
                <AlertTriangle size={13} /> The Problem · PPT Slide 2
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                Critical signals exist.<br />
                <span className="text-[#F27F0C]">But are noticed too late.</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm">
                India's central infrastructure portfolio spans thousands of projects, where retrospective paper reports lead to compounding slippages.
              </p>
            </div>
          </FadeIn>

          {/* 4 Authentic Problem Cards from PPT Slide 2 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              {
                title: "Fragmented Data",
                desc: "Project information is scattered across multiple reports, formats, and departments with zero longitudinal integration.",
                icon: Layers,
                color: "#DC2626",
                badge: "Data Silos"
              },
              {
                title: "Reactive Monitoring",
                desc: "Risky projects may be identified only after delay or cost escalation becomes serious and uncontainable.",
                icon: Eye,
                color: "#D97706",
                badge: "Late Detection"
              },
              {
                title: "Manual Overload",
                desc: "Officers must manually examine thousands of projects each month, which is time-consuming and error-prone.",
                icon: Users,
                color: "#7C3AED",
                badge: "Human Strain"
              },
              {
                title: "Hidden Signals",
                desc: "Critical risk signals exist in the data, but are hard to detect early amid the scale and complexity of the portfolio.",
                icon: AlertTriangle,
                color: "#053F5C",
                badge: "Silent Risks"
              },
            ].map(({ title, desc, icon: Icon, color, badge }, i) => (
              <FadeIn key={title} delay={i * 60}>
                <div className="h-full p-6 rounded-3xl bg-white dark:bg-[#053F5C] border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ background: color }}>
                        <Icon size={22} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                        {badge}
                      </span>
                    </div>
                    <h3 className="font-black text-[#053F5C] dark:text-white text-base mb-2 group-hover:text-[#F27F0C] transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* ════════════════ PPT SLIDE 2: THE CORE GAP & THE MISSING LAYER ════════════════ */}
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#053F5C] via-[#031e2d] to-[#053F5C] text-white p-6 sm:p-10 border border-[#429EBD]/30 shadow-xl" id="gap">
              <div className="relative z-10 grid lg:grid-cols-3 gap-6 items-center">
                {/* Left: What Exists Now */}
                <div className="text-center lg:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Existing Monitoring Systems
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                    Tells us <span className="underline decoration-red-400">WHAT HAPPENED</span>.
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Retrospective monthly flash reports record past milestone slips after damage is already done.
                  </p>
                </div>

                {/* Center: The Missing Layer */}
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full bg-[#F27F0C]/20 border border-[#F27F0C]/50 flex items-center justify-center mb-2">
                    <AlertTriangle size={22} className="text-[#F27F0C]" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#F27F0C] mb-1">
                    The Core Gap: The Missing Layer
                  </span>
                  <div className="flex gap-1.5 flex-wrap justify-center mt-1">
                    {["Predict", "Explain", "Prioritize"].map((pill) => (
                      <span key={pill} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F27F0C] text-white shadow-2xs">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: SANKET-AI Solution */}
                <div className="text-center lg:text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#9FE7F5] block mb-1">
                    SANKET-AI Predictive Engine
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#9FE7F5] mb-2">
                    WHAT IS LIKELY TO HAPPEN NEXT — <span className="text-[#F7AD19]">and WHY</span>.
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Forecasts cost overrun & delay 3–6 months ahead with SHAP explainability.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 2: 5-STAGE OPERATIONAL PIPELINE FLOWCHART ════════════════ */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#053F5C] transition-colors" id="pipeline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-[#429EBD]/15 text-[#053F5C] dark:text-[#9FE7F5] border border-[#429EBD]/30 mb-3 uppercase tracking-widest">
                <Workflow size={13} /> Our Solution · PPT Slide 2
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                Turning data into early action.
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm">
                Interactive 5-stage pipeline transforming monthly progress into verified statutory interventions.
              </p>
            </div>
          </FadeIn>

          {/* Stepper Node Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isSelected = activeStage === idx;
              const IconComp = stage.icon;
              return (
                <button
                  key={stage.step}
                  onClick={() => setActiveStage(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${isSelected
                    ? "bg-[#FEF0E7] dark:bg-[#031e2d] border-[#F27F0C] shadow-md -translate-y-1"
                    : "bg-[#FAF7F4] dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-[#429EBD]/40"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Stage {stage.step}
                    </span>
                    <IconComp size={16} className={isSelected ? "text-[#F27F0C]" : "text-slate-400"} />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-[#053F5C] dark:text-white line-clamp-1">
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {stage.sub}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Card */}
          <FadeIn>
            {(() => {
              const cur = PIPELINE_STAGES[activeStage];
              const CurIcon = cur.icon;
              return (
                <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F4] dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F27F0C] text-white uppercase tracking-wider">
                          Stage {cur.step} · {cur.tag}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {cur.sub}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#053F5C] dark:text-white mb-2">
                        {cur.headline}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {cur.details}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cur.points.map((pt) => (
                          <span key={pt} className="px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[#053F5C] dark:text-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-500" /> {pt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col items-center">
                      <button
                        onClick={() => navigate("/login")}
                        className="px-5 py-2.5 bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      >
                        Inspect Live in Portal <ArrowRight size={13} />
                      </button>
                      <span className="text-[11px] text-slate-400">Step {activeStage + 1} of 5 in Operational Loop</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </FadeIn>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 3: SYSTEM ARCHITECTURE FLOWCHART ════════════════ */}
      <section className="py-16 sm:py-20 bg-[#FAF7F4] dark:bg-[#031e2d] transition-colors" id="architecture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-[#F27F0C]/15 text-[#F27F0C] border border-[#F27F0C]/30 mb-3 uppercase tracking-widest">
                <Cpu size={13} /> Technical Approach · PPT Slide 3
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                SANKET-AI System Architecture
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm">
                From Raw Project Data to Explainable Risk Intelligence & Decision Support.
              </p>
            </div>
          </FadeIn>

          {/* Complete System Architecture Visual Flowchart matching PPT Slide 3 */}
          <FadeIn>
            <div className="bg-white dark:bg-[#053F5C]/90 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-6">

              {/* Tier 1: Users & Governance Authorities */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 dark:from-[#031e2d] dark:via-[#04283b] dark:to-[#031e2d] border border-blue-200/80 dark:border-blue-500/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        1. USERS & GOVERNANCE AUTHORITIES
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        Multi-Stakeholder Access
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs flex items-center gap-1.5">
                        <Shield size={12} className="text-blue-500" /> Cabinet Decision Makers
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs flex items-center gap-1.5">
                        <BarChart3 size={12} className="text-indigo-500" /> MoSPI Project Monitoring Division
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs flex items-center gap-1.5">
                        <Building2 size={12} className="text-cyan-500" /> Implementing Ministry Teams
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 whitespace-nowrap self-start md:self-center">
                  3 Role Profiles
                </span>
              </div>

              {/* Glowing Pipeline Conduit 1 */}
              <div className="flex flex-col items-center justify-center -my-2">
                <div className="w-1 h-7 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">▼ Data & Policy Flow</span>
              </div>

              {/* Tier 2: Project Data Repository */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80 dark:from-[#031e2d] dark:via-[#04283b] dark:to-[#031e2d] border border-emerald-200/80 dark:border-emerald-500/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Database size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        2. PROJECT DATA REPOSITORY (MoSPI IPMD)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Official Sovereign Feed
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {[
                        "Project Master Records",
                        "Original & Revised Outlays (₹ Cr)",
                        "Physical Progress (%)",
                        "Milestone Timelines",
                        "Flash Reports PDF / Excel",
                        "MoSPI PAIMANA API"
                      ].map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap self-start md:self-center">
                  2,099 Active Projects
                </span>
              </div>

              {/* Glowing Pipeline Conduit 2 */}
              <div className="flex flex-col items-center justify-center -my-2">
                <div className="w-1 h-7 bg-gradient-to-b from-emerald-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">▼ Automated Ingestion & ETL</span>
              </div>

              {/* Tier 3: Data Engineering Pipeline */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-purple-50/80 dark:from-[#031e2d] dark:via-[#04283b] dark:to-[#031e2d] border border-purple-200/80 dark:border-purple-500/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Workflow size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        3. DATA ENGINEERING & FEATURE PIPELINE
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        26 Predictors Generated
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Extract • Clean • Impute Missing Values • Calculate Spend Velocity • Time Series Aggregation ➔ Clean Analytical Matrix
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 whitespace-nowrap self-start md:self-center">
                  18,215 Snapshots
                </span>
              </div>

              {/* Glowing Pipeline Conduit 3 */}
              <div className="flex flex-col items-center justify-center -my-2">
                <div className="w-1 h-7 bg-gradient-to-b from-purple-500 to-[#F27F0C] rounded-full shadow-[0_0_8px_rgba(242,127,12,0.6)]" />
                <span className="text-[10px] text-[#F27F0C] font-mono font-bold mt-0.5">▼ 5-Pillar Intelligence Core</span>
              </div>

              {/* Tier 4: SANKET-AI Intelligence Core (5 Pillars) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF7F4] via-white to-[#FEF0E7] dark:from-[#021824] dark:via-[#053F5C] dark:to-[#031e2d] border-2 border-[#F27F0C] shadow-2xl relative overflow-hidden animate-glow-border">

                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#F27F0C] text-white shadow-md mb-2">
                    <Sparkles size={13} /> 4. SANKET-AI INTELLIGENCE CORE
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#053F5C] dark:text-white">
                    Predictive · Explainable · Risk Intelligence · Statutory Prioritization
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* Pillar 1 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 hover:border-[#9FE7F5] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 font-bold">
                      01
                    </div>
                    <span className="font-black text-xs text-slate-900 dark:text-white block mb-2">
                      Data & Features
                    </span>
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <li>• Project Master Space</li>
                      <li>• Financial Outlay Metrics</li>
                      <li>• Progress Milestones</li>
                      <li>• 26 Derived Predictors</li>
                    </ul>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 hover:border-[#F27F0C] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-[#F27F0C]/15 text-[#F27F0C] flex items-center justify-center mb-2.5 font-bold">
                      02
                    </div>
                    <span className="font-black text-xs text-slate-900 dark:text-white block mb-2">
                      ML Risk Ensembles
                    </span>
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <li>• XGBoost Classifier (82.25%)</li>
                      <li>• Random Forest Ensemble</li>
                      <li>• Logistic Regression</li>
                      <li>• Cost Escalation Slip</li>
                    </ul>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 hover:border-purple-400 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 font-bold">
                      03
                    </div>
                    <span className="font-black text-xs text-slate-900 dark:text-white block mb-2">
                      SHAP Explainability
                    </span>
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <li>• Exact TreeExplainer SHAP</li>
                      <li>• Root-Cause Waterfall</li>
                      <li>• Feature Contributions</li>
                      <li>• Transparent Reasoning</li>
                    </ul>
                  </div>

                  {/* Pillar 4 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 hover:border-amber-400 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 font-bold">
                      04
                    </div>
                    <span className="font-black text-xs text-slate-900 dark:text-white block mb-2">
                      Risk Intelligence
                    </span>
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <li>• Critical (Immediate Action)</li>
                      <li>• High (Monthly Watchlist)</li>
                      <li>• Medium (Track Milestone)</li>
                      <li>• Low (Nominal Progress)</li>
                    </ul>
                  </div>

                  {/* Pillar 5 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 hover:border-emerald-400 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 font-bold">
                      05
                    </div>
                    <span className="font-black text-xs text-slate-900 dark:text-white block mb-2">
                      Decision Support
                    </span>
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <li>• Executive Flash Dossier</li>
                      <li>• Ranked Priority Watchlist</li>
                      <li>• Statutory CUF Directives</li>
                      <li>• Longitudinal Audit Trail</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Glowing Pipeline Conduit 4 */}
              <div className="flex flex-col items-center justify-center -my-2">
                <div className="w-1 h-7 bg-gradient-to-b from-[#F27F0C] to-emerald-500 rounded-full shadow-[0_0_8px_rgba(242,127,12,0.6)]" />
                <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">▼ Real-Time Outputs & Action Loop</span>
              </div>

              {/* Tier 5: Action & Intervention Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-rose-600 dark:text-rose-400" />
                    <span className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                      Continuous Risk Telemetry
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Continuous monitoring of 2,099 projects with 3–6 months early warning lead time before irreversible slippage.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Priority Watchlist & Root Causes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Algorithmic ranking of projects requiring urgent intervention with exact SHAP root-cause feature attributions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      Statutory Actions & Directives
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Automated CUF workflows, inter-ministerial coordination directives, and Cabinet committee flash summaries.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 3: THE 26 ML FEATURES EXPLORER ════════════════ */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#053F5C] transition-colors" id="features-26">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-[#F27F0C]/15 text-[#F27F0C] border border-[#F27F0C]/30 mb-3 uppercase tracking-widest">
                <Sliders size={13} /> Feature Engineering · PPT Slide 3
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                26 ML Features Used in SANKET-AI
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm">
                Engineered from real MoSPI PAIMANA project data to predict cost escalation, deadline slip, and overall risk.
              </p>
            </div>
          </FadeIn>

          {/* Category Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {ML_FEATURE_CATEGORIES.map((cat, idx) => {
              const isSelected = activeFeatureCat === idx;
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.category}
                  onClick={() => setActiveFeatureCat(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected
                    ? "bg-[#F27F0C] text-white shadow-xs"
                    : "bg-[#FAF7F4] dark:bg-[#031e2d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                >
                  <IconComp size={14} />
                  <span>{cat.category}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-black/10 text-[10px]">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Features Grid for Active Category */}
          <FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {ML_FEATURE_CATEGORIES[activeFeatureCat].features.map((feat) => (
                <div
                  key={feat.id}
                  className="p-4 rounded-2xl bg-[#FAF7F4] dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 shadow-2xs hover:border-[#F27F0C] transition-all"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F27F0C]/15 text-[#F27F0C] text-[10px] font-mono font-black flex items-center justify-center">
                      {feat.id}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {feat.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 3: MODEL PERFORMANCE BENCHMARKS ════════════════ */}
      <section className="py-16 sm:py-20 bg-[#FAF7F4] dark:bg-[#031e2d] transition-colors" id="models">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-[#429EBD]/15 text-[#053F5C] dark:text-[#9FE7F5] border border-[#429EBD]/30 mb-3 uppercase tracking-widest">
                <BarChart3 size={13} /> Empirical Benchmarks · PPT Slide 3
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                Model Performance Comparison
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm">
                Authentic validation metrics comparing Logistic Regression, Random Forest, and XGBoost on real MoSPI PAIMANA data.
              </p>
            </div>
          </FadeIn>

          {/* Model Switcher Buttons */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white dark:bg-[#053F5C] border border-slate-200 dark:border-white/10 rounded-2xl p-1 gap-1 shadow-2xs">
              <button
                onClick={() => setActiveModelTab("deadline")}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeModelTab === "deadline"
                  ? "bg-[#F27F0C] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
              >
                Deadline Slip Model
              </button>
              <button
                onClick={() => setActiveModelTab("cost")}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeModelTab === "cost"
                  ? "bg-[#F27F0C] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
              >
                Cost Escalation Model
              </button>
            </div>
          </div>

          {/* Performance Chart Card */}
          <FadeIn>
            <div className="bg-white dark:bg-[#053F5C] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-black text-[#053F5C] dark:text-white text-base sm:text-lg">
                    {activeModelTab === "deadline" ? "Deadline Slip Model" : "Cost Escalation Model"} Benchmarks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Accuracy, Precision, Recall, ROC-AUC & F1 Score (%)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Logistic Regression
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#429EBD]" /> Random Forest
                  </span>
                  <span className="flex items-center gap-1.5 text-[#F27F0C]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F27F0C]" /> XGBoost (Production)
                  </span>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeModelTab === "deadline" ? DEADLINE_SLIP_METRICS : COST_ESCALATION_METRICS}
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: 700 }} stroke="#888888" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#888888" tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="lr" name="Logistic Regression" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rf" name="Random Forest" fill="#429EBD" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="xgb" name="XGBoost" fill="#F27F0C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* PPT Callout Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Base Fields (19) vs Engineered Features (26):
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Adding engineered features (26 fields) generally improves model performance, with largest gains in Recall & F1 score.
                  </span>
                </div>
                <span className="font-mono text-[#F27F0C] font-bold">
                  {activeModelTab === "deadline" ? "XGBoost Recall: 82.25%" : "XGBoost Accuracy: 97.60%"}
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 4: FEASIBILITY, CHALLENGES & MITIGATION ════════════════ */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#053F5C] transition-colors" id="feasibility">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3 uppercase tracking-widest">
                <ShieldCheck size={13} /> Practical Deployment · PPT Slide 4
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                Real-World Challenges & Mitigation
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm">
                Architected specifically for zero workflow disruption on top of official MoSPI PAIMANA / CRIP platforms.
              </p>
            </div>
          </FadeIn>

          <div className="space-y-3">
            {CHALLENGES_MITIGATION.map(({ challenge, solution, icon: Icon, badge }, idx) => (
              <FadeIn key={challenge} delay={idx * 50}>
                <div className="p-5 rounded-2xl bg-[#FAF7F4] dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 hover:border-[#F27F0C] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                        Challenge #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-[#F27F0C]">
                        {badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {challenge}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Mitigation:</strong> {solution}</span>
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 5: IMPACT & BENEFITS LIFECYCLE ════════════════ */}
      <section className="py-16 sm:py-20 bg-[#FAF7F4] dark:bg-[#031e2d] transition-colors" id="impact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-[#F27F0C]/15 text-[#F27F0C] border border-[#F27F0C]/30 mb-3 uppercase tracking-widest">
                <TrendingUp size={13} /> Impact & Benefits · PPT Slide 5
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                Turning Insights into Impact
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm">
                A closed-loop governance cycle: Detect Early ➔ Prioritise Smartly ➔ Take Action ➔ Track Progress ➔ Deliver Impact.
              </p>
            </div>
          </FadeIn>

          {/* 4 Benefit Dimensions from PPT Slide 5 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { title: "Administrative", desc: "Less manual screening across thousands of projects; unified common evidence base; complete auditable directive trail.", icon: CheckSquare, color: "#3B82F6" },
              { title: "Economic", desc: "Avoid preventable cost escalation; optimize multi-crore public capital allocation; improve capital efficiency.", icon: IndianRupee, color: "#10B981" },
              { title: "Social", desc: "Faster project commissioning; earlier delivery of public expressways, energy & healthcare; greater governance transparency.", icon: Users, color: "#F27F0C" },
              { title: "Governance", desc: "Shift from reactive reporting to proactive early warning; measurable statutory interventions with accountability.", icon: ShieldCheck, color: "#8B5CF6" },
            ].map(({ title, desc, icon: Icon, color }, i) => (
              <FadeIn key={title} delay={i * 60}>
                <div className="p-6 rounded-3xl bg-white dark:bg-[#053F5C] border border-slate-200 dark:border-white/10 shadow-xs h-full flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm" style={{ background: color }}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base mb-2">{title} Benefits</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* 4 Success Indicators from PPT Slide 5 */}
          <FadeIn>
            <div className="p-6 rounded-3xl bg-white dark:bg-[#053F5C] border border-slate-200 dark:border-white/10 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white mb-4">
                Measurable Success Indicators
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-2xl bg-[#FAF7F4] dark:bg-[#031e2d]">
                  <span className="text-2xl font-black text-[#F27F0C] font-mono block">3–6 Mos</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">High-risk detected before severe delay</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F4] dark:bg-[#031e2d]">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">100%</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Lead time alerts reviewed on time</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F4] dark:bg-[#031e2d]">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono block">-35%</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Risk reduction after follow-up</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F4] dark:bg-[#031e2d]">
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono block">2025 ➔ 2026</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Continuous model improvement</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════ PPT SLIDE 6: CAPABILITY COMPARISON MATRIX ════════════════ */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#053F5C] transition-colors" id="comparison">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-[#F27F0C]/15 text-[#F27F0C] border border-[#F27F0C]/30 mb-3 uppercase tracking-widest">
                Capability Matrix · PPT Slide 6
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#053F5C] dark:text-white leading-tight mb-3">
                PAIMANA vs. SANKET-AI
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm">
                Direct head-to-head comparison against the baseline MoSPI portal.
              </p>
            </div>
          </FadeIn>

          {/* Table Container */}
          <FadeIn>
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm bg-white dark:bg-[#031e2d]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F4] dark:bg-[#053F5C] border-b border-slate-200 dark:border-white/10">
                    <th className="py-3.5 px-4 font-black text-slate-800 dark:text-white">Capability</th>
                    <th className="py-3.5 px-4 text-center font-black text-slate-600 dark:text-slate-300">
                      PAIMANA (MoSPI Portal)
                    </th>
                    <th className="py-3.5 px-4 text-center font-black text-[#F27F0C]">
                      SANKET-AI (Our Solution)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {CAPABILITIES_TABLE.map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {row.label}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.paimana ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                            <X size={12} strokeWidth={3} />
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PPT Slide 6 Core Ethos Banner */}
              <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-[#FAF7F4] dark:bg-[#053F5C]/40 text-center">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-2xl mx-auto">
                  <strong className="text-[#F27F0C]">✦ Core Governance Principle:</strong><br />
                  "SANKET-AI does not replace officers or administrative authority. It provides earlier, explainable and prioritized evidence so that the right projects can be reviewed before a manageable risk becomes a major overrun."
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════ OFFICIAL GOVERNMENT FOOTER ════════════════ */}
      <footer className="py-12 bg-white dark:bg-[#02141f] border-t border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
              <div className="bg-white/95 rounded-xl px-2.5 py-1 shadow-2xs border border-slate-200/60">
                <img src={mospiLogo} alt="MoSPI" className="h-10 sm:h-12 w-auto object-contain select-none" />
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
              <div>
                <div className="text-xs font-black text-[#053F5C] dark:text-white tracking-tight">
                  Infrastructure and Project Monitoring Division (IPMD)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ministry of Statistics and Programme Implementation · Government of India
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Access SANKET-AI Portal
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div>
              © 2026 SANKET-AI · Team Falcon001 · Smart India Hackathon 2026 (PS-26103)
            </div>
            <div className="flex items-center gap-4">
              <a href="#problem" className="hover:text-[#F27F0C] transition-colors">Problem</a>
              <a href="#pipeline" className="hover:text-[#F27F0C] transition-colors">Pipeline</a>
              <a href="#architecture" className="hover:text-[#F27F0C] transition-colors">Architecture</a>
              <a href="#features-26" className="hover:text-[#F27F0C] transition-colors">26 Features</a>
              <a href="#models" className="hover:text-[#F27F0C] transition-colors">Models</a>
              <a href="#comparison" className="hover:text-[#F27F0C] transition-colors">Capability Matrix</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════ FLOATING GO TO TOP BUTTON ════════════════ */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8 p-3 rounded-full bg-[#F27F0C] hover:bg-[#d96e08] text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20 flex items-center justify-center cursor-pointer"
          title="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}

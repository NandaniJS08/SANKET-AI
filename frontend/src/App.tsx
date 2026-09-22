import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages are loaded lazily so that the initial JS bundle only contains
// the code needed for the current route (Landing page + shared utilities).
// All existing route URLs, guards, and role-based navigation are unchanged.
const Landing           = lazy(() => import("./pages/Landing"));
const Login             = lazy(() => import("./pages/Login"));
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const ReviewerDashboard = lazy(() => import("./pages/ReviewerDashboard"));
const AdminDashboard    = lazy(() => import("./pages/AdminDashboard"));
const Projects          = lazy(() => import("./pages/Projects"));
const ProjectDetails    = lazy(() => import("./pages/ProjectDetails"));
const AIPrediction      = lazy(() => import("./pages/AIPrediction"));
const Analytics         = lazy(() => import("./pages/Analytics"));
const ExplainableAI     = lazy(() => import("./pages/ExplainableAI"));
const AIAssistant       = lazy(() => import("./pages/AIAssistant"));
const Reports           = lazy(() => import("./pages/Reports"));
const PriorityWatchlist = lazy(() => import("./pages/PriorityWatchlist"));
const MonitoringHub     = lazy(() => import("./pages/MonitoringHub"));
import { ThemeProvider } from "./context/ThemeContext";
import type { User } from "./types/user.types";

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

function ProtectedRoute({ user, children }: ProtectedRouteProps) {
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("infrawatch_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // fallback
      }
    }
    setReady(true);

    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener("infrawatch_logout", handleLogout);
    return () => window.removeEventListener("infrawatch_logout", handleLogout);
  }, []);

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center bg-[#031e2d]">
        <div className="w-8 h-8 border-2 border-[#F27F0C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const protect = (children: React.ReactNode) => (
    <ProtectedRoute user={user}>{children}</ProtectedRoute>
  );

  // 3-Tier Role-Based Home Redirection
  const getHomeRoute = (): string => {
    if (!user) return "/login";
    if (user.role === "Reviewer / Monitoring Officer") return "/monitoring/watchlist";
    if (user.role === "Project Administrator") return "/administrator";
    return "/policymaker";
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Suspense fallback shown while a lazy page chunk is being downloaded.
            Reuses the same spinner already shown during the localStorage readiness check. */}
        <Suspense fallback={
          <div className="h-full flex items-center justify-center bg-[#031e2d]">
            <div className="w-8 h-8 border-2 border-[#F27F0C] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Routes>

          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          <Route
            path="/login"
            element={user ? <Navigate to={getHomeRoute()} replace /> : <Login onLogin={setUser} />}
          />

          {/* Role 1: Policymaker Experience (6 Strategic Pages) */}
          <Route path="/policymaker" element={protect(<Dashboard user={user} activeTab="overview" />)} />
          <Route path="/policymaker/national-risk" element={protect(<Dashboard user={user} activeTab="national-risk" />)} />
          <Route path="/policymaker/ministries-sectors" element={protect(<Dashboard user={user} activeTab="ministries-sectors" />)} />
          <Route path="/policymaker/states" element={protect(<Dashboard user={user} activeTab="states" />)} />
          <Route path="/policymaker/priority-projects" element={protect(<Dashboard user={user} activeTab="priority-projects" />)} />
          <Route path="/policymaker/emerging-risks" element={protect(<Dashboard user={user} activeTab="emerging-risks" />)} />
          <Route path="/dashboard" element={protect(<Dashboard user={user} activeTab="overview" />)} />
          {/* Role 2: Administrator Experience (8 Functional Pages) */}
          <Route path="/administrator" element={protect(<AdminDashboard user={user} activeTab="overview" />)} />
          <Route path="/administrator/projects" element={protect(<AdminDashboard user={user} activeTab="projects" />)} />
          <Route path="/administrator/priority-projects" element={protect(<AdminDashboard user={user} activeTab="priority" />)} />
          <Route path="/administrator/cost" element={protect(<AdminDashboard user={user} activeTab="cost" />)} />
          <Route path="/administrator/progress" element={protect(<AdminDashboard user={user} activeTab="progress" />)} />
          <Route path="/administrator/schedule" element={protect(<AdminDashboard user={user} activeTab="schedule" />)} />
          <Route path="/administrator/actions" element={protect(<AdminDashboard user={user} activeTab="actions" />)} />
          <Route path="/administrator/risk-trends" element={protect(<AdminDashboard user={user} activeTab="risk-trends" />)} />
          <Route path="/admin-dashboard" element={protect(<AdminDashboard user={user} activeTab="overview" />)} />
          
          {/* Role 3: Monitoring Officer Experience (8 Functional Tools) */}
          <Route path="/monitoring/watchlist" element={protect(<PriorityWatchlist user={user} />)} />
          <Route path="/monitoring" element={protect(<MonitoringHub user={user} initialTab="dashboard" />)} />
          <Route path="/monitoring/signals" element={protect(<MonitoringHub user={user} initialTab="signals" />)} />
          <Route path="/monitoring/alerts" element={protect(<MonitoringHub user={user} initialTab="alerts" />)} />
          <Route path="/monitoring/projects" element={protect(<MonitoringHub user={user} initialTab="projects" />)} />
          <Route path="/monitoring/explanations" element={protect(<MonitoringHub user={user} initialTab="explanations" />)} />
          <Route path="/monitoring/actions" element={protect(<MonitoringHub user={user} initialTab="actions" />)} />
          <Route path="/monitoring/risk-trends" element={protect(<MonitoringHub user={user} initialTab="risk-trends" />)} />
          <Route path="/reviewer-dashboard" element={protect(<ReviewerDashboard user={user} />)} />

          {/* Flagship Showcase: Project Intelligence Dossier (Single & Plural Routes) */}
          <Route path="/project/:id" element={protect(<ProjectDetails user={user} />)} />
          <Route path="/projects/:id" element={protect(<ProjectDetails user={user} />)} />
          <Route path="/projects" element={protect(<Projects user={user} />)} />

          {/* AI & Analytic Innovation Modules */}
          <Route path="/ai-prediction" element={protect(<AIPrediction user={user} />)} />
          <Route path="/alerts" element={<Navigate to={getHomeRoute()} replace />} />
          <Route path="/analytics" element={protect(<Analytics user={user} />)} />
          <Route path="/explainable-ai" element={protect(<ExplainableAI user={user} />)} />
          <Route path="/ai-assistant" element={protect(<AIAssistant user={user} />)} />
          <Route path="/reports" element={protect(<Reports user={user} />)} />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to={user ? getHomeRoute() : "/"} replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

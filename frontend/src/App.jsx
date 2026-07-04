import { useState } from "react";
import { Activity, Bot, CalendarCheck, Headphones, LayoutDashboard, LogIn } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Home from "./pages/Home.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AgentDashboard from "./pages/AgentDashboard.jsx";
import Analytics from "./pages/Analytics.jsx";
import Login from "./pages/Login.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const views = [
  { id: "chat", label: "Chat", icon: Bot },
  { id: "admin", label: "Admin", icon: LayoutDashboard },
  { id: "agent", label: "Agent", icon: Headphones },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "login", label: "Login", icon: LogIn }
];

const protectedViews = new Set(["admin", "agent", "analytics"]);

function App() {
  const [activeView, setActiveView] = useState("chat");
  const auth = useAuth();
  const needsLogin = protectedViews.has(activeView) && !auth.token;

  const renderView = () => {
    if (needsLogin) {
      return <Login onLoggedIn={() => setActiveView(activeView)} />;
    }

    if (activeView === "admin") {
      return <AdminDashboard />;
    }

    if (activeView === "agent") {
      return <AgentDashboard />;
    }

    if (activeView === "analytics") {
      return <Analytics />;
    }

    if (activeView === "login") {
      return <Login onLoggedIn={() => setActiveView("admin")} />;
    }

    return <Home />;
  };

  return (
    <div className="app-shell">
      <Sidebar views={views} activeView={activeView} onChange={setActiveView} />
      <main className="app-main">
        <header className="topbar">
          <div>
            <div className="brand-row">
              <span className="brand-mark">
                <CalendarCheck size={18} />
              </span>
              <span className="brand-name">SmartBot AI</span>
            </div>
            <h1>{views.find((view) => view.id === activeView)?.label || "Chat"}</h1>
          </div>
          <div className="session-pill">
            {auth.user ? (
              <>
                <span>{auth.user.name}</span>
                <button type="button" className="ghost-button" onClick={auth.logout}>
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" className="ghost-button" onClick={() => setActiveView("login")}>
                Sign in
              </button>
            )}
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
}

export default App;

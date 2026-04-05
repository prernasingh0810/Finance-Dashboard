import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import RecordsPage from "./pages/RecordsPage.jsx";
import AdminUsersGate from "./pages/AdminUsersGate.jsx";
import { getToken, clearToken, getUser, setUser, api } from "./api.js";

// Icons as simple SVG components
function DashboardIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function RecordsIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// Sidebar component
function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const isActive = (path) => location.pathname === path;

  // Get first letter of user name for avatar
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <aside className="sidebar">
      {/* Logo */}
      {/* Logo */}
<div className="sidebar-logo">
  <div className="sidebar-logo-icon">F</div>
  <h2>Finance<span>App</span></h2>
</div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <Link
          to="/"
          className={isActive("/") ? "active" : ""}
        >
          <DashboardIcon />
          Dashboard
        </Link>

        <Link
          to="/records"
          className={isActive("/records") ? "active" : ""}
        >
          <RecordsIcon />
          Records
        </Link>

        {isAdmin && (
          <Link
            to="/admin/users"
            className={isActive("/admin/users") ? "active" : ""}
          >
            <UsersIcon />
            Manage Users
          </Link>
        )}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{avatarLetter}</div>
          <div className="sidebar-user-info">
            <p>{user?.name || "User"}</p>
            <span>{user?.role || "viewer"}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogoutIcon />
          &nbsp; Log out
        </button>
      </div>
    </aside>
  );
}

// Layout with sidebar
function Layout({ children }) {
  const token = getToken();
  const [navUser, setNavUser] = useState(() => getUser());

  useEffect(() => {
    if (!token) { setNavUser(null); return; }
    if (getUser()) { setNavUser(getUser()); return; }
    let cancelled = false;
    api("/api/auth/me")
      .then((r) => {
        if (!cancelled && r.user) {
          setUser(r.user);
          setNavUser(r.user);
        }
      })
      .catch(() => { if (!cancelled) setNavUser(null); });
    return () => { cancelled = true; };
  }, [token]);

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <div className="app-layout">
      <Sidebar user={navUser} onLogout={handleLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

// Protect routes — redirect to login if not authenticated
function PrivateRoute({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/records"
        element={
          <PrivateRoute>
            <RecordsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <AdminUsersGate />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
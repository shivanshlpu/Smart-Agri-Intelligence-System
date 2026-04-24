import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    section: "Overview", links: [
      { to: "/", label: "Dashboard", icon: "🏠" },
      { to: "/history", label: "Prediction History", icon: "📋" },
    ]
  },
  {
    section: "AI Predictions", links: [
      { to: "/loss", label: "Crop Loss Prediction", icon: "🌿" },
      { to: "/price", label: "Price Forecasting", icon: "💰" },
      { to: "/supply", label: "Supply Chain Analysis", icon: "🚛" },
    ]
  },
  {
    section: "Account", links: [
      { to: "/profile", label: "My Profile", icon: "👤" },
    ]
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🌾</span>
        <div className="sidebar-logo-text">
          Kisan Sahayak Portal
          <div className="sidebar-logo-sub">Smart Agri Intelligence</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                <span className="icon">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        🇮🇳 Government of India<br />

      </div>
    </aside>
  );
}

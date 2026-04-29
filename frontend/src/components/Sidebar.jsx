import { NavLink } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

export default function Sidebar() {
  const { t } = useLang();

  const navItems = [
    {
      section: t("nav.overview"), links: [
        { to: "/", label: t("nav.dashboard"), icon: "🏠" },
        { to: "/history", label: t("nav.history"), icon: "📋" },
      ]
    },
    {
      section: t("nav.ai"), links: [
        { to: "/loss", label: t("nav.loss"), icon: "🌿" },
        { to: "/price", label: t("nav.price"), icon: "💰" },
        { to: "/supply", label: t("nav.supply"), icon: "🚛" },
        { to: "/soil", label: t("nav.soil"), icon: "🧪" },
      ]
    },
    {
      section: t("nav.services"), links: [
        { to: "/schemes", label: t("nav.schemes"), icon: "🏛️" },
      ]
    },
    {
      section: t("nav.account"), links: [
        { to: "/profile", label: t("nav.profile"), icon: "👤" },
      ]
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🌾</span>
        <div className="sidebar-logo-text">
          {t("app.name")}
          <div className="sidebar-logo-sub">{t("app.subtitle")}</div>
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
        {t("app.footer")}<br />
      </div>
    </aside>
  );
}

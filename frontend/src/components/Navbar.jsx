import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="emblem">🏛️</span>
        Ministry of Agriculture & Farmers Welfare — Smart Agri Intelligence System
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <div className="navbar-user">
              <div className="navbar-avatar">{initials}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{user.name}</div>
                <div style={{ fontSize: 10, opacity: 0.7, textTransform: "capitalize" }}>
                  {user.role} · {user.location?.state || "India"}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} id="btn-logout">🚪 Logout</button>
          </>
        )}
        {!user && (
          <button onClick={() => navigate("/login")} id="btn-login-nav">Login</button>
        )}
      </div>
    </header>
  );
}

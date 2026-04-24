import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const res = await login(form.email, form.password);
    if (res.success) {
      toast.success("Login successful. Welcome back!");
      navigate("/");
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Gov strip */}
        <div className="gov-strip">
          <span>🇮🇳 Government of India</span>
          <span>Ministry of Agriculture &amp; Farmers Welfare</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="emblem">🌾</div>
            <h2>Kisan Sahayak Portal</h2>
            <p>Smart Agriculture Intelligence System</p>
          </div>

          <div className="auth-card-body">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#003366" }}>
              Sign In to your Account
            </h3>

            {err && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                ⚠️ {err}
              </div>
            )}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <input id="login-email" name="email" type="email" className="form-control"
                  placeholder="your@email.com" value={form.email} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Password <span className="required">*</span></label>
                <input id="login-password" name="password" type="password" className="form-control"
                  placeholder="Enter your password" value={form.password} onChange={handle} required />
              </div>

              <button id="btn-login" type="submit" className="btn btn-primary w-full btn-lg"
                disabled={loading} style={{ marginTop: 4 }}>
                {loading ? "Signing in..." : "🔐 Sign In"}
              </button>
            </form>

            <div className="auth-divider">or</div>

            <div style={{ textAlign: "center", fontSize: 13 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#003366", fontWeight: 600 }}>Register here</Link>
            </div>

            <div className="alert alert-info" style={{ marginTop: 16, fontSize: 12 }}>
              💡 <strong>Demo:</strong> Create a new account to get started. Your data is encrypted and secure.
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 12 }}>
          © 2024- Shivansh Tiwari · CSE274 Project<br />
          नागरिक सेवा — किसान सहायता प्रणाली
        </div>
      </div>
    </div>
  );
}

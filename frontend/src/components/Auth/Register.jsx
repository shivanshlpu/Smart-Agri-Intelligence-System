import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const STATES = ["Uttar Pradesh","Maharashtra","Punjab","Haryana","Madhya Pradesh",
  "Rajasthan","Bihar","West Bengal","Andhra Pradesh","Karnataka",
  "Tamil Nadu","Gujarat","Telangana","Odisha","Assam","Other"];

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "farmer", phone: "",
    location: { state: "", district: "" }
  });
  const [err, setErr] = useState("");

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === "state" || name === "district") {
      setForm({ ...form, location: { ...form.location, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password !== form.confirmPassword) {
      return setErr("Passwords do not match.");
    }
    const { confirmPassword, ...payload } = form;
    const res = await register(payload);
    if (res.success) {
      toast.success("Registration successful! Welcome to Kisan Sahayak Portal.");
      navigate("/");
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 500 }}>
        <div className="gov-strip">
          <span>🇮🇳 Government of India</span>
          <span>Ministry of Agriculture &amp; Farmers Welfare</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="emblem">🌾</div>
            <h2>Kisan Sahayak Portal</h2>
            <p>Create New Account — Naya Panjikaran</p>
          </div>

          <div className="auth-card-body">
            {err && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠️ {err}</div>}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input id="reg-name" name="name" className="form-control"
                    placeholder="Ramesh Kumar" value={form.name} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input id="reg-phone" name="phone" className="form-control"
                    placeholder="9876543210" value={form.phone} onChange={handle} />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <input id="reg-email" name="email" type="email" className="form-control"
                  placeholder="ramesh@example.com" value={form.email} onChange={handle} required />
              </div>

              <div className="form-group">
                <label>Role / Vibhag</label>
                <select id="reg-role" name="role" className="form-control" value={form.role} onChange={handle}>
                  <option value="farmer">Farmer (Kisan)</option>
                  <option value="business">Agri-Business</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>State / Rajya</label>
                  <select id="reg-state" name="state" className="form-control"
                    value={form.location.state} onChange={handle}>
                    <option value="">-- Select State --</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>District / Jila</label>
                  <input id="reg-district" name="district" className="form-control"
                    placeholder="Your district" value={form.location.district} onChange={handle} />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <input id="reg-password" name="password" type="password" className="form-control"
                    placeholder="Min. 6 characters" value={form.password} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Confirm Password <span className="required">*</span></label>
                  <input id="reg-confirm" name="confirmPassword" type="password" className="form-control"
                    placeholder="Repeat password" value={form.confirmPassword} onChange={handle} required />
                </div>
              </div>

              <button id="btn-register" type="submit" className="btn btn-primary w-full btn-lg"
                disabled={loading} style={{ marginTop: 4 }}>
                {loading ? "Registering..." : "✅ Create Account"}
              </button>
            </form>

            <div className="auth-divider">or</div>
            <div style={{ textAlign: "center", fontSize: 13 }}>
              Already registered? <Link to="/login" style={{ color: "#003366", fontWeight: 600 }}>Sign in here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

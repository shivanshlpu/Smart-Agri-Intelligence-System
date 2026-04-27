import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { toast } from "react-toastify";
import LanguageToggle from "../LanguageToggle";

const STATES = ["Uttar Pradesh","Maharashtra","Punjab","Haryana","Madhya Pradesh",
  "Rajasthan","Bihar","West Bengal","Andhra Pradesh","Karnataka",
  "Tamil Nadu","Gujarat","Telangana","Odisha","Assam","Other"];

export default function Register() {
  const { register, loading } = useAuth();
  const { t } = useLang();
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
      return setErr(t("auth.passMatch"));
    }
    const { confirmPassword, ...payload } = form;
    const res = await register(payload);
    if (res.success) {
      toast.success("✅");
      navigate("/");
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 500 }}>
        <div className="gov-strip">
          <span>{t("app.footer")}</span>
          <span>{t("app.ministry")}</span>
          <LanguageToggle style={{ marginLeft: "auto" }} />
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="emblem">🌾</div>
            <h2>{t("app.name")}</h2>
            <p>{t("auth.createAccount")}</p>
          </div>

          <div className="auth-card-body">
            {err && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠️ {err}</div>}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("auth.fullName")} <span className="required">*</span></label>
                  <input id="reg-name" name="name" className="form-control"
                    placeholder="Ramesh Kumar" value={form.name} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>{t("auth.mobile")}</label>
                  <input id="reg-phone" name="phone" className="form-control"
                    placeholder="9876543210" value={form.phone} onChange={handle} />
                </div>
              </div>

              <div className="form-group">
                <label>{t("auth.email")} <span className="required">*</span></label>
                <input id="reg-email" name="email" type="email" className="form-control"
                  placeholder="ramesh@example.com" value={form.email} onChange={handle} required />
              </div>

              <div className="form-group">
                <label>{t("auth.role")}</label>
                <select id="reg-role" name="role" className="form-control" value={form.role} onChange={handle}>
                  <option value="farmer">{t("auth.farmer")}</option>
                  <option value="business">{t("auth.business")}</option>
                  <option value="admin">{t("auth.admin")}</option>
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>{t("auth.state")}</label>
                  <select id="reg-state" name="state" className="form-control"
                    value={form.location.state} onChange={handle}>
                    <option value="">{t("auth.selectState")}</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("auth.district")}</label>
                  <input id="reg-district" name="district" className="form-control"
                    placeholder="Your district" value={form.location.district} onChange={handle} />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>{t("auth.password")} <span className="required">*</span></label>
                  <input id="reg-password" name="password" type="password" className="form-control"
                    placeholder="Min. 6 characters" value={form.password} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>{t("auth.confirmPass")} <span className="required">*</span></label>
                  <input id="reg-confirm" name="confirmPassword" type="password" className="form-control"
                    placeholder="Repeat password" value={form.confirmPassword} onChange={handle} required />
                </div>
              </div>

              <button id="btn-register" type="submit" className="btn btn-primary w-full btn-lg"
                disabled={loading} style={{ marginTop: 4 }}>
                {loading ? t("auth.creating") : t("auth.createBtn")}
              </button>
            </form>

            <div className="auth-divider">or</div>
            <div style={{ textAlign: "center", fontSize: 13 }}>
              {t("auth.hasAccount")} <Link to="/login" style={{ color: "#003366", fontWeight: 600 }}>{t("auth.signinLink")}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

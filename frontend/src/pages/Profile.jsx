import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import API from "../api/axiosConfig";
import { toast } from "react-toastify";

const STATES = ["Uttar Pradesh","Maharashtra","Punjab","Haryana","Madhya Pradesh",
  "Rajasthan","Bihar","West Bengal","Andhra Pradesh","Karnataka",
  "Tamil Nadu","Gujarat","Telangana","Odisha","Assam","Other"];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { t } = useLang();
  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "",
    location: { state: user?.location?.state || "", district: user?.location?.district || "" }
  });
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      const { data } = await API.put("/auth/profile", form);
      updateUser(data.user);
      toast.success("✅");
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed.");
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 {t("nav.dashboard")} › <span>{t("nav.profile")}</span></div>
          <h1>{t("profile.title")}</h1>
          <p>{t("profile.subtitle")}</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Profile summary card */}
        <div>
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: "32px 20px" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "var(--gov-navy)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, margin: "0 auto 14px",
              }}>
                {initials}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#003366" }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{user?.email}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <span className="badge badge-blue" style={{ textTransform: "capitalize" }}>
                  {user?.role}
                </span>
                {user?.location?.state && (
                  <span className="badge badge-gray">📍 {user.location.state}</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
                {t("profile.memberSince")} {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 14 }}>
            <div>
              <strong>{t("profile.verified")}</strong><br />
              {t("profile.verifiedMsg")}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="form-section">
          <div className="form-section-header">{t("profile.edit")}</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("auth.fullName")} <span className="required">*</span></label>
                  <input id="profile-name" name="name" className="form-control"
                    value={form.name} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>{t("auth.mobile")}</label>
                  <input id="profile-phone" name="phone" className="form-control"
                    placeholder="9876543210" value={form.phone} onChange={handle} />
                </div>
                <div className="form-group">
                  <label>{t("auth.state")}</label>
                  <select id="profile-state" name="state" className="form-control"
                    value={form.location.state} onChange={handle}>
                    <option value="">{t("auth.selectState")}</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("auth.district")}</label>
                  <input id="profile-district" name="district" className="form-control"
                    placeholder="Your district" value={form.location.district} onChange={handle} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label>{t("auth.email")}</label>
                <input className="form-control" value={user?.email || ""} disabled
                  style={{ background: "#f3f4f6", color: "#9ca3af" }} />
                <span className="form-hint">{t("profile.emailHint")}</span>
              </div>

              <button id="btn-save-profile" type="submit" className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 18 }} disabled={saving}>
                {saving ? t("profile.saving") : t("profile.saveBtn")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axiosConfig";
import { toast } from "react-toastify";

const STATES = ["Uttar Pradesh","Maharashtra","Punjab","Haryana","Madhya Pradesh",
  "Rajasthan","Bihar","West Bengal","Andhra Pradesh","Karnataka",
  "Tamil Nadu","Gujarat","Telangana","Odisha","Assam","Other"];

export default function Profile() {
  const { user, updateUser } = useAuth();
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
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed.");
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 Dashboard › <span>My Profile</span></div>
          <h1>👤 My Profile — Mera Vivran</h1>
          <p>Update your personal information and account details.</p>
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
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 14 }}>
            <div>
              <strong>✅ Account Verified</strong><br />
              Your account is active and verified on the Kisan Sahayak Portal.
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="form-section">
          <div className="form-section-header">✏️ Edit Profile Information</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input id="profile-name" name="name" className="form-control"
                    value={form.name} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Mobile Number / Phone</label>
                  <input id="profile-phone" name="phone" className="form-control"
                    placeholder="9876543210" value={form.phone} onChange={handle} />
                </div>
                <div className="form-group">
                  <label>State / Rajya</label>
                  <select id="profile-state" name="state" className="form-control"
                    value={form.location.state} onChange={handle}>
                    <option value="">-- Select State --</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>District / Jila</label>
                  <input id="profile-district" name="district" className="form-control"
                    placeholder="Your district" value={form.location.district} onChange={handle} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label>Email Address</label>
                <input className="form-control" value={user?.email || ""} disabled
                  style={{ background: "#f3f4f6", color: "#9ca3af" }} />
                <span className="form-hint">Email cannot be changed.</span>
              </div>

              <button id="btn-save-profile" type="submit" className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 18 }} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

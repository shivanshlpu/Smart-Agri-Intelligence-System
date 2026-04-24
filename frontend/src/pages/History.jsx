import { useEffect, useState, useCallback } from "react";
import API from "../api/axiosConfig";
import { toast } from "react-toastify";

const TYPE_BADGE = {
  loss:   "badge-green",
  price:  "badge-blue",
  supply: "badge-yellow",
};

function getResultSummary(r) {
  if (r.result?.prediction)      return `${r.result.prediction} Risk`;
  if (r.result?.predicted_price) return `₹${r.result.predicted_price}/Qtl`;
  if (r.result?.efficiency)      return r.result.efficiency;
  return "—";
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState({ type: "", crop: "" });
  const [deleting, setDeleting] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.set("type", filter.type);
      if (filter.crop) params.set("crop", filter.crop);
      const { data } = await API.get(`/history?${params}`);
      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch { toast.error("Failed to load history."); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const deleteRecord = async (id) => {
    if (!window.confirm("Delete this prediction record?")) return;
    setDeleting(id);
    try {
      await API.delete(`/history/${id}`);
      toast.success("Record deleted.");
      fetchHistory();
    } catch { toast.error("Delete failed."); }
    finally { setDeleting(null); }
  };

  const exportCSV = () => {
    const headers = ["Date","Type","Crop","Result","Confidence"];
    const rows = records.map(r => [
      new Date(r.createdAt).toLocaleDateString("en-IN"),
      r.type, r.cropName, getResultSummary(r),
      r.confidence ? `${r.confidence.toFixed(1)}%` : "—"
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "prediction_history.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully.");
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 Dashboard › <span>Prediction History</span></div>
          <h1>📋 Prediction History</h1>
          <p>All your past ML prediction analyses — {total} records total.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button id="btn-export-csv" className="btn btn-outline btn-sm" onClick={exportCSV}>
            📥 Export CSV
          </button>
          <button id="btn-refresh" className="btn btn-outline btn-sm" onClick={fetchHistory}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "12px 18px" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label>Filter by Type</label>
            <select id="history-filter-type" className="form-control"
              value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
              <option value="">All Types</option>
              <option value="loss">Loss Prediction</option>
              <option value="price">Price Forecast</option>
              <option value="supply">Supply Chain</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label>Search by Crop</label>
            <input id="history-filter-crop" className="form-control" placeholder="e.g. Wheat"
              value={filter.crop} onChange={e => setFilter({ ...filter, crop: e.target.value })} />
          </div>
          <div className="form-group" style={{ alignSelf: "flex-end" }}>
            <button className="btn btn-outline btn-sm"
              onClick={() => setFilter({ type: "", crop: "" })}>Clear</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3>📊 Records ({total})</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /><p>Loading history...</p></div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <p>No prediction records found. Start by making a prediction!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Crop / Region</th>
                    <th>Result</th>
                    <th>Confidence</th>
                    <th>Recommendations</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}<br />
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>
                          {new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${TYPE_BADGE[r.type] || "badge-gray"}`}>
                          {r.type?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{r.cropName || "—"}</td>
                      <td style={{ fontWeight: 700, color: "#003366" }}>{getResultSummary(r)}</td>
                      <td>
                        {r.confidence
                          ? <span className="badge badge-blue">{r.confidence.toFixed(1)}%</span>
                          : <span style={{ color: "#9ca3af" }}>—</span>}
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <ul style={{ paddingLeft: 14, margin: 0, fontSize: 11, color: "#4a5568" }}>
                          {(r.recommendations || []).slice(0, 2).map((rec, ri) => (
                            <li key={ri}>{rec}</li>
                          ))}
                          {(r.recommendations?.length || 0) > 2 && (
                            <li style={{ color: "#9ca3af" }}>+{r.recommendations.length - 2} more…</li>
                          )}
                        </ul>
                      </td>
                      <td>
                        <button
                          id={`btn-delete-${r._id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteRecord(r._id)}
                          disabled={deleting === r._id}
                        >
                          {deleting === r._id ? "..." : "🗑️"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

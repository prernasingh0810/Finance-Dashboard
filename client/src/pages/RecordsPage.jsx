import { useEffect, useState, useCallback } from "react";
import { api, getUser } from "../api.js";

function toIsoDateInput(d) {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

const emptyForm = () => ({
  amount: "",
  type: "expense",
  category: "",
  date: toIsoDateInput(new Date()),
  notes: "",
});

export default function RecordsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const user = getUser();
  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    setError("");
    try {
      let url = `/api/records?limit=10&page=${page}`;
      if (filterType) url += `&type=${filterType}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      if (filterFrom) url += `&dateFrom=${filterFrom}`;
      if (filterTo) url += `&dateTo=${filterTo}`;
      const res = await api(url);
      setData(res);
    } catch (e) {
      setError(
        e.status === 403
          ? "Your role (viewer) cannot view records. Only analysts and admins can."
          : e.body?.message || e.message
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterCategory, filterFrom, filterTo]);

  useEffect(() => { load(); }, [load]);

  async function handleExportCSV() {
    try {
      const token = localStorage.getItem("finance_token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/records/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "financial-records.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/records", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          category: form.category.trim(),
          date: new Date(form.date).toISOString(),
          notes: form.notes || "",
        }),
      });
      setForm(emptyForm());
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.body?.message || e.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row) {
    setEditingId(row._id);
    setShowForm(true);
    setForm({
      amount: String(row.amount),
      type: row.type,
      category: row.category,
      date: toIsoDateInput(row.date),
      notes: row.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm());
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/records/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          category: form.category.trim(),
          date: new Date(form.date).toISOString(),
          notes: form.notes || "",
        }),
      });
      cancelEdit();
      await load();
    } catch (e) {
      setError(e.body?.message || e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Soft-delete this record? It will be hidden from totals.")) return;
    setError("");
    try {
      await api(`/api/records/${id}`, { method: "DELETE" });
      if (editingId === id) cancelEdit();
      await load();
    } catch (e) {
      setError(e.body?.message || e.message);
    }
  }

  function resetFilters() {
    setFilterType("");
    setFilterCategory("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
  }

  if (loading) return <div className="loading">Loading records...</div>;

  if (error && !data) {
    return (
      <div>
        <div className="page-header">
          <h1>Financial Records</h1>
        </div>
        <div className="error-msg">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Financial Records</h1>
          <p>
            {isAdmin
              ? "Create, edit and delete financial entries. Analysts can only view."
              : "Read-only view. Only admins can create or modify records."}
          </p>
        </div>

        {/* Buttons — New Record + Export CSV */}
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && !showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Record
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={handleExportCSV}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Create / Edit Form */}
      {isAdmin && showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">
            {editingId ? "Edit Record" : "Create New Record"}
          </div>
          <form onSubmit={editingId ? handleUpdate : handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <input
                  required
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Salary, Food, Rent"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="datetime-local"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Record"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Filters</div>
        <div className="filters-bar">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <input
            placeholder="Category..."
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          />

          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
          />

          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
          />

          <button className="btn btn-ghost" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>
                    <div className="empty-state">
                      <p>No records found. Try adjusting your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.data.map((row) => (
                  <tr key={row._id}>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${row.type}`}>
                        {row.type}
                      </span>
                    </td>
                    <td>{row.category}</td>
                    <td style={{
                      fontWeight: 600,
                      color: row.type === "income"
                        ? "var(--income-color)"
                        : "var(--expense-color)"
                    }}>
                      ₹{row.amount.toFixed(2)}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {row.notes || "—"}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 10px", fontSize: 12 }}
                            onClick={() => startEdit(row)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(row._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pagination && (
          <div className="pagination">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>
            <div className="pagination-btns">
              <button
                className="btn btn-ghost"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-ghost"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
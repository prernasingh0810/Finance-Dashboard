import { useEffect, useState } from "react";
import { api, getUser } from "../api.js";

const ROLES = ["viewer", "analyst", "admin"];
const STATUSES = ["active", "inactive"];

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "viewer",
    status: "active",
  });

  const currentId = getUser()?.id;

  async function load() {
    setError("");
    try {
      const res = await api("/api/users");
      setUsers(res.users || []);
    } catch (e) {
      setError(e.body?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ email: "", password: "", name: "", role: "viewer", status: "active" });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.body?.message || e.message);
    } finally {
      setCreating(false);
    }
  }

  async function patchUser(id, patch) {
    setError("");
    try {
      await api(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await load();
    } catch (e) {
      setError(e.body?.message || e.message);
    }
  }

  async function removeUser(id) {
    if (!window.confirm("Delete this user? They will no longer be able to sign in.")) return;
    setError("");
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e.body?.message || e.message);
    }
  }

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>User Management</h1>
          <p>Create users, assign roles and manage access. Admin only.</p>
        </div>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + New User
          </button>
        )}
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Create New User</div>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: "50%" }}>
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowForm(false);
                  setForm({ email: "", password: "", name: "", role: "viewer", status: "active" });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-title">
          All Users ({users.length})
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <p>No users found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    {/* Name with avatar */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}>
                          {u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                        {u.id === currentId && (
                          <span style={{
                            fontSize: 10,
                            background: "#ebf4ff",
                            color: "#3182ce",
                            padding: "2px 6px",
                            borderRadius: 10,
                            fontWeight: 600,
                          }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>

                    {/* Role dropdown */}
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => patchUser(u.id, { role: e.target.value })}
                        disabled={u.id === currentId}
                        style={{
                          padding: "4px 8px",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 12,
                          background: "white",
                          cursor: u.id === currentId ? "not-allowed" : "pointer",
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>

                    {/* Status dropdown */}
                    <td>
                      <select
                        value={u.status}
                        onChange={(e) => patchUser(u.id, { status: e.target.value })}
                        disabled={u.id === currentId}
                        style={{
                          padding: "4px 8px",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 12,
                          background: "white",
                          cursor: u.id === currentId ? "not-allowed" : "pointer",
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Delete */}
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={u.id === currentId}
                        onClick={() => removeUser(u.id)}
                        style={{
                          opacity: u.id === currentId ? 0.4 : 1,
                          cursor: u.id === currentId ? "not-allowed" : "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Guide */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Role Permissions</div>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Dashboard</th>
              <th>View Records</th>
              <th>Create / Edit / Delete</th>
              <th>Manage Users</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-viewer">Viewer</span></td>
              <td>✅</td>
              <td>❌</td>
              <td>❌</td>
              <td>❌</td>
            </tr>
            <tr>
              <td><span className="badge badge-analyst">Analyst</span></td>
              <td>✅</td>
              <td>✅</td>
              <td>❌</td>
              <td>❌</td>
            </tr>
            <tr>
              <td><span className="badge badge-admin">Admin</span></td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
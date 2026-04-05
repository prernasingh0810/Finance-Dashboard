import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, setUser } from "../api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      if (data.user) setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.body?.message || err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          Finance<span>Dashboard</span>
        </div>
        <p>Sign in to your account to continue</p>

        {/* Form */}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Hint */}
        <p style={{ marginTop: 20, fontSize: 12, color: "#a0aec0", textAlign: "center" }}>
          Default admin: admin@example.com / AdminPass123!
        </p>

      </div>
    </div>
  );
}
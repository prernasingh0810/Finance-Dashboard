import { useEffect, useState } from "react";
import { api } from "../api.js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/dashboard/summary?trend=weekly");
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.body?.message || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!data) return null;

  const { totals, categoryWise, recentActivity } = data;

  // Prepare chart data from categoryWise
  const chartData = categoryWise.map((row) => ({
    name: row.category,
    amount: row.total,
    type: row.type,
  }));

  // Separate income and expense for chart
  const incomeData = categoryWise
    .filter((r) => r.type === "income")
    .map((r) => ({ name: r.category, income: r.total }));

  const expenseData = categoryWise
    .filter((r) => r.type === "expense")
    .map((r) => ({ name: r.category, expense: r.total }));

  // Merge for chart
  const mergedChart = [...incomeData];
  expenseData.forEach((e) => {
    const existing = mergedChart.find((i) => i.name === e.name);
    if (existing) existing.expense = e.expense;
    else mergedChart.push({ name: e.name, expense: e.expense });
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Financial overview — all authenticated roles can view this screen.</p>
      </div>

      {/* Stat Cards */}


      <div className="stats-grid">
  <div className="stat-card">
    <div className="stat-card-left">
      <div className="stat-label">Total Income</div>
      <div className="stat-value income">
        ₹{totals.totalIncome.toFixed(2)}
      </div>
      <div className="stat-sub">{totals.recordCount} total records</div>
    </div>
    <div className="stat-icon income-icon">💰</div>
  </div>

  <div className="stat-card">
    <div className="stat-card-left">
      <div className="stat-label">Total Expenses</div>
      <div className="stat-value expense">
        ₹{totals.totalExpenses.toFixed(2)}
      </div>
      <div className="stat-sub">Across all categories</div>
    </div>
    <div className="stat-icon expense-icon">📉</div>
  </div>

  <div className="stat-card">
    <div className="stat-card-left">
      <div className="stat-label">Net Balance</div>
      <div className="stat-value balance">
        ₹{totals.netBalance.toFixed(2)}
      </div>
      <div className="stat-sub">Income minus expenses</div>
    </div>
    <div className="stat-icon balance-icon">📊</div>
  </div>
</div>


      {/* Chart + Category Breakdown */}
      <div className="dashboard-grid">

        {/* Bar Chart */}
        <div className="card">
          <div className="card-title">Income vs Expenses by Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mergedChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#718096" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#718096" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" fill="#38a169" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#e53e3e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-title">By Category</div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {categoryWise.map((row) => (
                  <tr key={`${row.category}-${row.type}`}>
                    <td>{row.category}</td>
                    <td>
                      <span className={`badge badge-${row.type}`}>
                        {row.type}
                      </span>
                    </td>
                    <td>₹{row.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Recent Activity</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <p>No recent activity found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentActivity.map((row) => (
                  <tr key={row._id}>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${row.type}`}>
                        {row.type}
                      </span>
                    </td>
                    <td>{row.category}</td>
                    <td
                      style={{
                        color: row.type === "income"
                          ? "var(--income-color)"
                          : "var(--expense-color)",
                        fontWeight: 600,
                      }}
                    >
                      ₹{row.amount.toFixed(2)}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {row.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
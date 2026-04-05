import { FinancialRecord, ENTRY_TYPES } from "../models/FinancialRecord.js";

// Get start of current week (Monday)
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Get start of current month
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Get start of previous month
function startOfPreviousMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() - 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Calculate percentage change between two values
function percentageChange(current, previous) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return (change >= 0 ? "+" : "") + change.toFixed(1) + "%";
}

/**
 * Main dashboard summary service
 * Returns totals, category breakdown, recent activity, trends, and month comparison
 */
export async function getDashboardSummary(options = {}) {
  const { recentLimit = 10, trend = "weekly" } = options;

  const baseMatch = { deletedAt: null };

  // 1. Calculate total income, expenses and record count
  const [totalsAgg] = await FinancialRecord.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.INCOME] }, "$amount", 0],
          },
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.EXPENSE] }, "$amount", 0],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncome = totalsAgg?.totalIncome ?? 0;
  const totalExpenses = totalsAgg?.totalExpenses ?? 0;
  const netBalance = totalIncome - totalExpenses;

  // 2. Category wise breakdown
  const byCategory = await FinancialRecord.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const categoryWise = byCategory.map((row) => ({
    category: row._id.category,
    type: row._id.type,
    total: row.total,
  }));

  // 3. Top 3 categories by total amount (NEW)
  const topCategories = categoryWise.slice(0, 3);

  // 4. Recent activity
  const recent = await FinancialRecord.find(baseMatch)
    .sort({ date: -1, createdAt: -1 })
    .limit(recentLimit)
    .populate("createdBy", "name email")
    .lean();

  // 5. Trend data for current period
  const now = new Date();
  const trendStart =
    trend === "monthly" ? startOfMonth(now) : startOfWeek(now);

  const trendPoints = await FinancialRecord.aggregate([
    { $match: { ...baseMatch, date: { $gte: trendStart } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.INCOME] }, "$amount", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.EXPENSE] }, "$amount", 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 6. Month over month comparison (NEW)
  const thisMonthStart = startOfMonth(now);
  const prevMonthStart = startOfPreviousMonth(now);

  const [thisMonth] = await FinancialRecord.aggregate([
    { $match: { ...baseMatch, date: { $gte: thisMonthStart } } },
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.INCOME] }, "$amount", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.EXPENSE] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  const [prevMonth] = await FinancialRecord.aggregate([
    {
      $match: {
        ...baseMatch,
        date: { $gte: prevMonthStart, $lt: thisMonthStart },
      },
    },
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.INCOME] }, "$amount", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$type", ENTRY_TYPES.EXPENSE] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  const monthComparison = {
    incomeChange: percentageChange(
      thisMonth?.income ?? 0,
      prevMonth?.income ?? 0
    ),
    expenseChange: percentageChange(
      thisMonth?.expense ?? 0,
      prevMonth?.expense ?? 0
    ),
  };

  return {
    totals: {
      totalIncome,
      totalExpenses,
      netBalance,
      recordCount: totalsAgg?.count ?? 0,
    },
    categoryWise,
    topCategories,        // NEW
    monthComparison,      // NEW
    recentActivity: recent,
    trend: {
      granularity: "daily",
      periodStart: trendStart.toISOString(),
      points: trendPoints.map((p) => ({
        date: p._id,
        income: p.income,
        expense: p.expense,
        net: p.income - p.expense,
      })),
    },
  };
}
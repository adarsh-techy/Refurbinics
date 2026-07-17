const db = require('../config/db');

// Parts no longer track a separate cost basis (buy price) — only what's
// charged when used in a repair — so Finance has no parts profit margin to
// compute. Repair revenue uses each repair's own stored `price` snapshot
// (rather than the part's current repair_cost, so it stays accurate even
// after a part's price changes later) plus any labor_charge billed on it.
async function getTotals() {
  const { rows } = await db.query(`
    SELECT COALESCE(SUM(price + labor_charge), 0) AS repair_revenue FROM repairs
  `);
  const { rows: staffRows } = await db.query(
    `SELECT COALESCE(SUM(salary), 0) AS staff_salary_total FROM staff WHERE active = true`
  );

  return {
    repairRevenue: Number(rows[0].repair_revenue),
    staffSalaryTotal: Number(staffRows[0].staff_salary_total),
  };
}

// Last `months` calendar months (oldest first) of repair revenue, for a
// simple month-over-month breakdown.
async function getMonthlyBreakdown(months) {
  const { rows } = await db.query(
    `SELECT
       date_trunc('month', repaired_at) AS month,
       COALESCE(SUM(price + labor_charge), 0) AS repair_revenue
     FROM repairs
     WHERE repaired_at >= date_trunc('month', now()) - ($1 || ' months')::interval
     GROUP BY month
     ORDER BY month`,
    [months - 1]
  );
  return rows;
}

module.exports = { getTotals, getMonthlyBreakdown };

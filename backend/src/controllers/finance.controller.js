const financeModel = require('../models/finance.model');

const BREAKDOWN_MONTHS = 6;

// Fills in zero-value months so the breakdown always has BREAKDOWN_MONTHS
// entries, even for months with no repair activity.
function buildMonthlySeries(rows, months) {
  const today = new Date();
  const series = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const match = rows.find((row) => new Date(row.month).getTime() === monthDate.getTime());
    series.push({
      month: monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      repairRevenue: match ? Number(match.repair_revenue) : 0,
    });
  }
  return series;
}

async function summary(req, res, next) {
  try {
    const [totals, monthlyRows] = await Promise.all([
      financeModel.getTotals(),
      financeModel.getMonthlyBreakdown(BREAKDOWN_MONTHS),
    ]);

    const { repairRevenue, staffSalaryTotal } = totals;
    const netProfit = repairRevenue - staffSalaryTotal;

    res.json({
      totals: { repairRevenue, staffSalaryTotal, netProfit },
      monthly: buildMonthlySeries(monthlyRows, BREAKDOWN_MONTHS),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };

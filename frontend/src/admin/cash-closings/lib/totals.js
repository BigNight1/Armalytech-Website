/** Pure totals math for the Historial grid and the day/week/month resumen. */

export function emptyTotals() {
  return {
    cashIncome: 0,
    yapeIncome: 0,
    cashExpense: 0,
    yapeExpense: 0,
    totalCash: 0,
    totalYape: 0,
    grossIncome: 0,
    netIncome: 0,
  };
}

/** Derives the totals block from the four raw sums (grid rows or a summary group). */
export function summarize({ cashIncome = 0, yapeIncome = 0, cashExpense = 0, yapeExpense = 0 }) {
  const totalCash = cashIncome - cashExpense;
  const totalYape = yapeIncome - yapeExpense;
  return {
    cashIncome,
    yapeIncome,
    cashExpense,
    yapeExpense,
    totalCash,
    totalYape,
    grossIncome: cashIncome + yapeIncome,
    netIncome: totalCash + totalYape,
  };
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Totals for the day currently being edited, computed live from grid rows. */
export function computeGridTotals(rows) {
  let cashIncome = 0;
  let yapeIncome = 0;
  let cashExpense = 0;
  let yapeExpense = 0;

  for (const row of rows) {
    cashIncome += toNumber(row.cashIncome);
    yapeIncome += toNumber(row.yapeIncome);
    cashExpense += toNumber(row.cashExpense);
    yapeExpense += toNumber(row.yapeExpense);
  }

  return summarize({ cashIncome, yapeIncome, cashExpense, yapeExpense });
}

/** A `GET /cash-closings/summary` group (or `undefined` when empty) -> totals block. */
export function summaryGroupToTotals(group) {
  if (!group) return emptyTotals();
  return summarize(group);
}

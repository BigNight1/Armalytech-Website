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

/**
 * Sums non-annulled ticket cobros (`GET /cobros`, T-C3) by payment method —
 * `adelanto`/`saldo`/`venta` all land as income, never an expense. Annulled
 * cobros are excluded so they never reach a totals row.
 */
export function computeCobroTotals(cobros = []) {
  let cashIncome = 0;
  let yapeIncome = 0;

  for (const cobro of cobros) {
    if (cobro.anulado) continue;
    if (cobro.metodo === 'efectivo') cashIncome += cobro.monto;
    else if (cobro.metodo === 'yape') yapeIncome += cobro.monto;
  }

  return { cashIncome, yapeIncome };
}

/** The design's "Cobros de tickets" and "Ventas del día" summary lines. */
export function cobrosSummaryLine(cobros = []) {
  const active = cobros.filter((c) => !c.anulado);
  const { cashIncome, yapeIncome } = computeCobroTotals(active);
  const tickets = active.filter((c) => c.tipo !== 'venta');
  const sales = active.filter((c) => c.tipo === 'venta');
  const ticketTotals = computeCobroTotals(tickets);
  const salesTotals = computeCobroTotals(sales);
  return {
    total: cashIncome + yapeIncome,
    count: active.length,
    ticketsTotal: ticketTotals.cashIncome + ticketTotals.yapeIncome,
    ticketsCount: tickets.length,
    salesTotal: salesTotals.cashIncome + salesTotals.yapeIncome,
    salesCount: sales.length,
  };
}

/**
 * Totals for the day currently being edited: the manual grid rows plus
 * non-annulled ticket cobros (T-C3 — they're locked rows appended after the
 * manual ones, but they still count towards the day's Efectivo/Yape totals).
 */
export function computeGridTotals(rows, cobros = []) {
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

  const cobroTotals = computeCobroTotals(cobros);
  cashIncome += cobroTotals.cashIncome;
  yapeIncome += cobroTotals.yapeIncome;

  return summarize({ cashIncome, yapeIncome, cashExpense, yapeExpense });
}

/**
 * A `GET /cash-closings/summary` group (or `undefined` when empty) plus the
 * non-annulled ticket cobros for the same range (T-C3) -> totals block.
 */
export function summaryGroupToTotals(group, cobros = []) {
  const base = group ?? { cashIncome: 0, yapeIncome: 0, cashExpense: 0, yapeExpense: 0 };
  const cobroTotals = computeCobroTotals(cobros);
  return summarize({
    cashIncome: (base.cashIncome ?? 0) + cobroTotals.cashIncome,
    yapeIncome: (base.yapeIncome ?? 0) + cobroTotals.yapeIncome,
    cashExpense: base.cashExpense ?? 0,
    yapeExpense: base.yapeExpense ?? 0,
  });
}

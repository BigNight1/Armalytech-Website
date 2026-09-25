import { formatPEN } from '../../shared/lib/money.js';

/**
 * One resumen breakdown (Efectivo / Yape / Plin): Ingreso, Gasto (shown with
 * a leading minus), and a bold Total row separated by its own rule — design's
 * `sum.blocks` item.
 */
export default function ResumenBlock({ title, income, expense, total }) {
  return (
    <div className="flex flex-col gap-1 border-t-2 border-line pt-2.5">
      <h4 style={{ fontSize: '13px', fontWeight: 700 }} className="mb-1 uppercase tracking-[0.12em] text-muted">
        {title}
      </h4>
      <div className="flex justify-between py-1 text-[15px] text-ink">
        <span>Ingreso</span>
        <span className="tabular-nums">{formatPEN(income)}</span>
      </div>
      <div className="flex justify-between py-1 text-[15px] text-ink">
        <span>Gasto</span>
        <span className="tabular-nums">− {formatPEN(expense)}</span>
      </div>
      <div className="mt-1 flex justify-between border-t border-line pt-1.5 text-base font-extrabold text-ink">
        <span>Total</span>
        <span className="tabular-nums">{formatPEN(total)}</span>
      </div>
    </div>
  );
}

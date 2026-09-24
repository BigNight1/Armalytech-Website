/**
 * Pulsing placeholder blocks used instead of a spinner for initial-load
 * states (T14): a skeleton communicates layout/shape while data streams in,
 * so the page doesn't "jump" once the real content arrives.
 */
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-700/50 ${className}`} />;
}

/** A skeleton table: header row + `rows` placeholder rows of `columns` cells. */
export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-700 ${className}`}>
      <div className="flex gap-4 bg-slate-900/60 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <SkeletonRows rows={rows} columns={columns} />
    </div>
  );
}

/** Just the placeholder rows (no header), for reuse inside an existing table shell. */
export function SkeletonRows({ rows = 5, columns = 4 }) {
  return (
    <div className="divide-y divide-slate-800">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

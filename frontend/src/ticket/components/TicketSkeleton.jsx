/** Loading placeholder shown while the public ticket is being fetched. */
export default function TicketSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-8 md:gap-10" role="status" aria-label="Cargando ticket…">
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-6 lg:gap-12 items-end border-b-2 border-[var(--tk-text)] pb-8 md:pb-10">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-40 bg-[var(--tk-divider-soft)] rounded" />
          <div className="h-12 md:h-16 w-3/4 bg-[var(--tk-divider-soft)] rounded" />
        </div>
        <div className="h-16 bg-[var(--tk-divider-soft)] rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] border-2 border-[var(--tk-divider-soft)]">
        <div className="p-9 flex flex-col gap-4">
          <div className="h-4 w-24 bg-[var(--tk-divider-soft)] rounded" />
          <div className="h-10 w-4/5 bg-[var(--tk-divider-soft)] rounded" />
          <div className="h-4 w-full bg-[var(--tk-divider-soft)] rounded" />
        </div>
        <div className="grid grid-cols-2 border-t lg:border-t-0 lg:border-l border-[var(--tk-divider-soft)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 border-b border-r border-[var(--tk-divider-soft)] flex flex-col gap-2">
              <div className="h-3 w-16 bg-[var(--tk-divider-soft)] rounded" />
              <div className="h-4 w-24 bg-[var(--tk-divider-soft)] rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t-2 border-[var(--tk-divider-soft)] pt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="h-14 w-14 bg-[var(--tk-divider-soft)] rounded" />
            <div className="h-5 w-2/3 bg-[var(--tk-divider-soft)] rounded" />
            <div className="h-4 w-full bg-[var(--tk-divider-soft)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

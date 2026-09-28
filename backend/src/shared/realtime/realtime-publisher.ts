/** Root React Query key each admin panel section invalidates on (ADR 0028). */
export type RealtimeTopic =
  'clients' | 'tickets' | 'sales' | 'inventory' | 'staff';

/** Extra context a topic can carry; today only used to flag a public self-registration. */
export type RealtimeReason = 'client_registered';

/**
 * Application-layer port (ADR 0028): every write use case publishes through
 * this, after the write has already persisted successfully. Implementations
 * must never throw — a failure publishing a realtime notification must never
 * fail (or roll back) the write that triggered it.
 */
export abstract class RealtimePublisher {
  abstract publish(
    topics: RealtimeTopic | RealtimeTopic[],
    reason?: RealtimeReason,
  ): void;
}

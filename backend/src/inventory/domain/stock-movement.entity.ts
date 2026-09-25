/**
 * Kardex entry: every stock change writes one of these, and nothing is ever
 * deleted (ADR 0006, "Actualización 2026-09-25"). Only `ajuste_entrada` and
 * `ajuste_salida` are produced today; the sale/ticket variants are reserved
 * for the upcoming tickets and sales features.
 */
export type StockMovementType =
  | 'venta'
  | 'ticket_salida'
  | 'ticket_devolucion'
  | 'ajuste_entrada'
  | 'ajuste_salida';

export interface StockMovementReference {
  type: string;
  id: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  /** Signed: positive for entradas, negative for salidas. */
  quantity: number;
  stockAfter: number;
  reference: StockMovementReference | null;
  reason?: string;
  userId: string;
  userEmail: string;
  occurredAt: Date;
}

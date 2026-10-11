import { Ticket, TicketStatus } from './ticket.entity';

export const TICKET_REPOSITORY = 'ITicketRepository';

export interface ListTicketsFilters {
  q?: string; // search in codigo, cliente.telefono, cliente.nombre, equipo.modelo, equipo.imei
  estado?: TicketStatus;
  clienteId?: string;
  tecnicoId?: string;
  page?: number;
  limit?: number;
}

export interface ListTicketsResult {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PieceReservation {
  ticketId: string;
  codigo: string;
  cliente: string;
  cantidad: number;
}

export interface ITicketRepository {
  getNextSequence(): Promise<number>;
  create(ticket: Ticket): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  findByPublicToken(publicToken: string): Promise<Ticket | null>;
  findByCodigo(codigo: string): Promise<Ticket | null>;
  findByClienteId(clienteId: string): Promise<Ticket[]>;
  list(filters: ListTicketsFilters): Promise<ListTicketsResult>;
  /**
   * Persists `ticket`, using `ticket.version` (the value read at the start
   * of the request) as an optimistic-concurrency filter: `{ _id, version }`.
   * Implementations must atomically `$inc` the stored version and throw a
   * conflict (`code: 'ticket_modified'`) when no document matches the
   * expected version (i.e. it was modified by someone else concurrently).
   */
  update(ticket: Ticket): Promise<Ticket>;
  countActiveByClienteId(clienteId: string): Promise<number>;
  /** Tickets currently assigned to `tecnicoId` in pendiente|aprobado|trabajando|listo. */
  countActiveByTecnicoId(tecnicoId: string): Promise<number>;
  getPlannedPiecesCount(
    productoId: string,
  ): Promise<{ planned: number; ticketCodigos: string[] }>;
  /**
   * Detail behind `getPlannedPiecesCount`: every pending ticket currently
   * reserving (`estado: 'planificada'`) units of `productoId`, excluding
   * `excludeTicketId` (the ticket being edited, if any) so it never blocks
   * against its own reservation.
   */
  getPieceReservations(
    productoId: string,
    excludeTicketId?: string,
  ): Promise<PieceReservation[]>;
}

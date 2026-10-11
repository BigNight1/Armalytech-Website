import { Controller, Get, Param } from '@nestjs/common';
import { TicketUseCases } from '../application/ticket.use-cases';

/**
 * `GET /api/community/clients/:id/tickets` (ADR 0025 §5, contract 2026-09-26).
 *
 * Lives in the tickets module rather than the community module on purpose:
 * TicketsModule already imports CommunityModule (for RegisterVisitUseCase),
 * so adding the client-history route to CommunityController would require
 * CommunityModule to import TicketsModule back, a circular module
 * dependency. Mounting this controller here, under the same
 * `community/clients/:id/tickets` path, keeps the one-directional
 * TicketsModule -> CommunityModule edge and avoids the cycle.
 */
@Controller('community/clients')
export class ClientTicketsController {
  constructor(private readonly ticketUseCases: TicketUseCases) {}

  @Get(':id/tickets')
  async listByClient(@Param('id') id: string) {
    const tickets = await this.ticketUseCases.listByClienteId(id);
    return tickets.map((t) => ({
      id: t.id,
      codigo: t.codigo,
      titulo: t.titulo,
      estado: t.estado,
      equipo: t.equipo,
      precioTotal: t.precioTotal,
      saldo: t.saldo,
      fechaIngreso: t.fechaIngreso,
    }));
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../shared/infrastructure/public.decorator';
import { CurrentAdmin } from '../../auth/infrastructure/current-admin.decorator';
import { SessionPayload } from '../../auth/infrastructure/session.types';
import { TicketUseCases } from '../application/ticket.use-cases';
import {
  AvailabilityQueryDto,
  CreateTicketDto,
  ListTicketsQueryDto,
  UpdateTicketDetailsDto,
  UpdateTicketPiecesDto,
  UpdateTicketStatusDto,
} from './dto/ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketUseCases: TicketUseCases) {}

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get('public/:token')
  async getPublicTicket(@Param('token') token: string) {
    return this.ticketUseCases.getPublicByToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('public/lookup')
  @HttpCode(HttpStatus.OK)
  async lookupPublicTicket(@Body() body: { codigo?: string; telefono?: string }) {
    return this.ticketUseCases.lookupPublicTicket(body.codigo, body.telefono);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @Body() dto: CreateTicketDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    return this.ticketUseCases.createTicket(dto, session?.sub);
  }

  @Get()
  async listTickets(@Query() query: ListTicketsQueryDto) {
    const result = await this.ticketUseCases.list({
      q: query.q,
      estado: query.estado,
      clienteId: query.clienteId,
      tecnicoId: query.tecnicoId,
      page: query.page,
      limit: query.limit,
    });

    const items = result.tickets.map((t) => {
      // Never expose the encrypted device key in the list (ADR 0025, QA fix #4)
      const { claveEquipo, ...rest } = t;
      return {
        ...rest,
        tieneClave: Boolean(claveEquipo && claveEquipo.tipo !== 'ninguno'),
        tipoClave: claveEquipo?.tipo ?? 'ninguno',
      };
    });

    return {
      ok: true,
      tickets: items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      data: {
        items,
        tickets: items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  // Must be declared before the `:id` routes below, otherwise Nest would
  // match `GET /tickets/availability` against `GET /tickets/:id` first.
  @Get('availability')
  async getAvailability(@Query() query: AvailabilityQueryDto) {
    return this.ticketUseCases.getAvailability(
      query.categoriaId,
      query.celularId,
      query.excludeTicketId,
      query.q,
      query.categoria,
    );
  }

  @Get(':id')
  async getTicketById(@Param('id') id: string) {
    return this.ticketUseCases.getById(id);
  }

  @Patch(':id')
  async updateTicketDetails(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDetailsDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    return this.ticketUseCases.updateDetails(id, dto, {
      usuarioId: session?.sub,
      usuarioEmail: session?.email,
    });
  }

  @Patch(':id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    return this.ticketUseCases.updateStatus(id, dto, {
      usuarioId: session?.sub,
      usuarioEmail: session?.email,
    });
  }

  @Patch(':id/piezas')
  async updateTicketPieces(
    @Param('id') id: string,
    @Body() dto: UpdateTicketPiecesDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    return this.ticketUseCases.updatePieces(id, dto, {
      usuarioId: session?.sub,
      usuarioEmail: session?.email,
    });
  }

  @Post(':id/reveal-clave')
  @HttpCode(HttpStatus.OK)
  async revealDeviceKey(
    @Param('id') id: string,
    @CurrentAdmin() session: SessionPayload,
  ) {
    return this.ticketUseCases.revealDeviceKey(id, {
      usuarioId: session?.sub,
      usuarioEmail: session?.email,
    });
  }

  @Post(':id/notas')
  async addInternalNote(
    @Param('id') id: string,
    @Body('nota') nota: string,
    @CurrentAdmin() session: SessionPayload,
  ) {
    const userName = session?.email || 'Taller';
    return this.ticketUseCases.addInternalNote(id, nota, userName);
  }
}

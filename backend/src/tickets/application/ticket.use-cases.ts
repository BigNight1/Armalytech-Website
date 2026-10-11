import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  DeviceKey,
  PieceStatus,
  Ticket,
  TicketPiece,
  TicketStatus,
} from '../domain/ticket.entity';
import {
  ITicketRepository,
  ListTicketsFilters,
  ListTicketsResult,
  TICKET_REPOSITORY,
} from '../domain/ticket.repository.port';
import {
  TicketWhatsAppError,
  TicketWhatsAppService,
} from './ticket-whatsapp.service';
import { TicketCipherService } from '../infrastructure/crypto/ticket-cipher.service';
import {
  CreateTicketDto,
  UpdateTicketPiecesDto,
  UpdateTicketStatusDto,
} from '../infrastructure/dto/ticket.dto';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../inventory/domain/product-repository.port';
import {
  STOCK_MOVEMENT_REPOSITORY,
  StockMovementRepository,
} from '../../inventory/domain/stock-movement-repository.port';
import { RegisterVisitUseCase } from '../../community/application/register-visit.use-case';
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from '../../community/domain/client-repository.port';
import { RegisterClientUseCase } from '../../community/application/register-client.use-case';
import { PhoneNumber } from '../../community/domain/phone-number.vo';
import { ResolvePhoneUseCase } from '../../inventory/application/phone/resolve-phone.use-case';
import { CobroService } from './cobro.service';
import {
  RealtimePublisher,
  RealtimeTopic,
} from '../../shared/realtime/realtime-publisher';

// Re-exported so existing imports keep working; the token lives in the domain
// so `TicketWhatsAppService` can use it without a circular import.
export { TICKET_REPOSITORY };

/** 3x3 pattern lock: 4 to 9 unique dots numbered 1-9, e.g. "1-5-9-6". */
const PATTERN_REGEX = /^[1-9](-[1-9]){3,8}$/;

export interface Faltante {
  productoId: string;
  nombre: string;
  necesita: number;
  hay: number;
}

export interface CurrentUser {
  usuarioId?: string;
  usuarioEmail?: string;
}

const SYSTEM_USER: Required<CurrentUser> = {
  usuarioId: 'system',
  usuarioEmail: 'system@armalytech.com',
};

@Injectable()
export class TicketUseCases {
  private readonly logger = new Logger(TicketUseCases.name);

  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
    private readonly cipherService: TicketCipherService,
    @Optional()
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository?: ProductRepository,
    @Optional()
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository?: StockMovementRepository,
    @Optional()
    private readonly registerVisit?: RegisterVisitUseCase,
    @Optional()
    private readonly cobroService?: CobroService,
    @Optional()
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository?: ClientRepository,
    @Optional()
    private readonly registerClient?: RegisterClientUseCase,
    @Optional()
    private readonly resolvePhone?: ResolvePhoneUseCase,
    @Optional()
    private readonly realtime?: RealtimePublisher,
    @Optional()
    private readonly ticketWhatsApp?: TicketWhatsAppService,
  ) {}

  async createTicket(
    dto: CreateTicketDto,
    usuarioId?: string,
  ): Promise<Ticket> {
    const seq = await this.ticketRepository.getNextSequence();
    const codigo = `AT-${String(seq).padStart(6, '0')}`;
    const publicToken = crypto.randomUUID();

    const adelanto = dto.adelanto ?? 0;
    if (adelanto > dto.precioTotal) {
      throw new BadRequestException(
        'El adelanto no puede ser mayor al precio total.',
      );
    }
    const saldo = dto.precioTotal - adelanto;

    // Encrypt device key if provided (ADR 0025 decision #6)
    let claveEquipo: DeviceKey | undefined;
    if (dto.claveEquipo && dto.claveEquipo.tipo !== 'ninguno') {
      const valor = dto.claveEquipo.valor?.trim();
      if (!valor) {
        throw new BadRequestException('Ingresa la clave del equipo');
      }
      if (dto.claveEquipo.tipo === 'patron' && !this.isValidPattern(valor)) {
        throw new BadRequestException(
          'El patrón debe tener entre 4 y 9 puntos del 1 al 9, sin repetir.',
        );
      }
      claveEquipo = {
        tipo: dto.claveEquipo.tipo,
        valor: this.cipherService.encrypt(valor),
      };
    }

    const piezas: TicketPiece[] = (dto.piezas ?? []).map((p) => ({
      productoId: p.productoId,
      nombre: p.nombre,
      categoria: p.categoria,
      cantidad: p.cantidad,
      costoUnitario: p.costoUnitario ?? 0,
      precioVentaUnitario: p.precioVentaUnitario ?? 0,
      estado: 'planificada' as PieceStatus,
    }));

    let clienteId = dto.cliente.clienteId;
    if (!clienteId && this.clientRepository) {
      try {
        const phoneE164 = PhoneNumber.of(dto.cliente.telefono).toE164();
        const existingClient =
          await this.clientRepository.findByPhone(phoneE164);
        if (existingClient) {
          clienteId = existingClient.id;
        } else if (this.registerClient) {
          const res = await this.registerClient.execute({
            firstName: dto.cliente.nombre.trim(),
            lastName: dto.cliente.apellido?.trim() ?? '',
            phone: dto.cliente.telefono,
            marketingConsent: false,
            channel: 'taller' as any,
          });
          clienteId = res.client.id;
        }
      } catch {
        // Non-blocking: invalid Peruvian mobile format or other error
      }
    }

    let marcaId = dto.equipo.marcaId;
    let celularId = dto.equipo.celularId;
    let marca = dto.equipo.marca?.trim();
    let modelo = dto.equipo.modelo?.trim();
    if (this.resolvePhone && marca && modelo && (!marcaId || !celularId)) {
      try {
        const resolved = await this.resolvePhone.execute(marca, modelo);
        marcaId = marcaId || resolved.marca.id;
        celularId = celularId || resolved.celular.id;
        marca = resolved.marca.nombre;
        modelo = resolved.celular.nombre;
      } catch {
        // Fallback to raw inputs
      }
    }

    const now = new Date();
    const ticket = new Ticket({
      codigo,
      publicToken,
      cliente: {
        clienteId,
        nombre: dto.cliente.nombre.trim(),
        apellido: dto.cliente.apellido?.trim(),
        // Digits only (ADR 0025 fix-up): guarantees `GET /tickets?q=` finds
        // the ticket by a raw phone number regardless of how it was typed
        // (spaces, dashes, +51 prefix), since the query is a substring
        // regex match against this stored value.
        telefono: dto.cliente.telefono.replace(/[^\d]/g, '').trim(),
      },
      equipo: {
        marcaId,
        celularId,
        marca,
        modelo,
        color: dto.equipo.color?.trim(),
        imei: dto.equipo.imei?.trim(),
        fallaReportada: dto.equipo.fallaReportada.trim(),
        estadoIngreso: dto.equipo.estadoIngreso?.trim(),
      },
      claveEquipo,
      titulo: dto.titulo.trim(),
      notaCliente: dto.notaCliente?.trim(),
      notasInternas: dto.notasInternas ?? [],
      tecnicoId: dto.tecnicoId,
      tecnicoNombre: dto.tecnicoNombre,
      piezas,
      precioTotal: dto.precioTotal,
      adelanto,
      metodoAdelanto:
        adelanto > 0 ? (dto.metodoAdelanto ?? 'efectivo') : undefined,
      saldo,
      estado: TicketStatus.PENDIENTE,
      historialEstados: [
        {
          estado: TicketStatus.PENDIENTE,
          fecha: now,
          usuarioId,
          nota: 'Ingreso del equipo al taller',
        },
      ],
      fechaIngreso: now,
      fechaEntregaEstimada: dto.fechaEntregaEstimada
        ? new Date(dto.fechaEntregaEstimada)
        : undefined,
    });

    const saved = await this.ticketRepository.create(ticket);

    // Record adelanto cobro if provided (ADR 0025 decision #5)
    if (adelanto > 0 && this.cobroService) {
      await this.cobroService.create({
        origen: 'ticket',
        referenciaId: saved.id!,
        codigo: saved.codigo,
        tipo: 'adelanto',
        monto: adelanto,
        metodo: dto.metodoAdelanto ?? 'efectivo',
        usuarioId,
        descripcion: `Adelanto Ticket ${saved.codigo}`,
      });
    }

    this.realtime?.publish('tickets');

    return saved;
  }

  async getById(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado.`);
    }
    return ticket;
  }

  async getByCodigo(codigo: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findByCodigo(codigo);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${codigo} no encontrado.`);
    }
    return ticket;
  }

  async getPublicByToken(token: string) {
    const ticket = await this.ticketRepository.findByPublicToken(token);
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado o enlace inválido.');
    }

    // Expose only safe public fields per ADR 0006/0007/0025 (no internal notes, no encrypted pin)
    return {
      codigo: ticket.codigo,
      estado: ticket.estado,
      titulo: ticket.titulo,
      notaCliente: ticket.notaCliente,
      cliente: {
        nombre: ticket.cliente.nombre,
        apellido: ticket.cliente.apellido,
      },
      equipo: {
        marca: ticket.equipo.marca,
        modelo: ticket.equipo.modelo,
        color: ticket.equipo.color,
      },
      precioTotal: ticket.precioTotal,
      adelanto: ticket.adelanto,
      saldo: ticket.saldo,
      fechaIngreso: ticket.fechaIngreso,
      fechaEntregaEstimada: ticket.fechaEntregaEstimada,
      historialEstados: ticket.historialEstados.map((h) => ({
        estado: h.estado,
        fecha: h.fecha,
      })),
    };
  }

  async lookupPublicTicket(
    codigo?: string,
    telefono?: string,
  ): Promise<{ publicToken: string; codigo: string }> {
    const rawCodigo = (codigo ?? '').trim().toUpperCase();
    const rawPhone = (telefono ?? '').replace(/\D/g, '');

    if (!rawCodigo || !rawPhone) {
      throw new BadRequestException(
        'Ingresa el número de ticket y el celular registrado.',
      );
    }

    let normalizedCodigo = rawCodigo;
    if (/^\d+$/.test(rawCodigo)) {
      normalizedCodigo = `AT-${rawCodigo.padStart(6, '0')}`;
    }

    const ticket = await this.ticketRepository.findByCodigo(normalizedCodigo);
    if (!ticket) {
      throw new NotFoundException(
        'No se encontró ningún ticket que coincida con estos datos.',
      );
    }

    const ticketPhone = (ticket.cliente?.telefono ?? '').replace(/\D/g, '');
    const matchesPhone =
      ticketPhone.length >= 7 &&
      rawPhone.length >= 7 &&
      (ticketPhone.endsWith(rawPhone) || rawPhone.endsWith(ticketPhone));

    if (!matchesPhone) {
      throw new NotFoundException(
        'No se encontró ningún ticket que coincida con estos datos.',
      );
    }

    return {
      publicToken: ticket.publicToken,
      codigo: ticket.codigo,
    };
  }

  async list(filters: ListTicketsFilters): Promise<ListTicketsResult> {
    return this.ticketRepository.list(filters);
  }

  async listByClienteId(clienteId: string): Promise<Ticket[]> {
    return this.ticketRepository.findByClienteId(clienteId);
  }

  /**
   * `GET /api/tickets/availability?categoriaId=&celularId=&excludeTicketId=`.
   * Disponible = stock físico − cantidades planificadas (reservadas) en
   * otros tickets pendientes (ADR 0025 §2).
   */
  async getAvailability(
    categoriaId?: string,
    celularId?: string,
    excludeTicketId?: string,
    q?: string,
    categoria?: string,
  ) {
    if (!this.productRepository) return [];

    const result = await this.productRepository.list({
      categoryId: categoriaId,
      categoriaText: categoria,
      nameOrModel: q,
      phoneId: celularId,
      includeArchived: false,
      page: 1,
      limit: 500,
    });

    const items = await Promise.all(
      result.items.map(async (product) => {
        const reservas = await this.ticketRepository.getPieceReservations(
          product.id,
          excludeTicketId,
        );
        const planificado = reservas.reduce((sum, r) => sum + r.cantidad, 0);
        const disponible = Math.max(0, product.stock - planificado);

        return {
          productoId: product.id,
          nombre: product.name,
          categoria: product.category?.name,
          stock: product.stock,
          planificado,
          disponible,
          costo: product.cost,
          reservas: reservas.map((r) => ({
            ticketId: r.ticketId,
            codigo: r.codigo,
            cliente: r.cliente,
          })),
        };
      }),
    );

    return items;
  }

  async updateStatus(
    id: string,
    dto: UpdateTicketStatusDto,
    user?: CurrentUser,
  ): Promise<Ticket> {
    const ticket = await this.getById(id);
    const estadoActual = ticket.estado;
    const nuevoEstado = dto.nuevoEstado;
    const { usuarioId, usuarioEmail } = resolveUser(user);

    if (estadoActual === nuevoEstado) {
      return ticket;
    }

    // Validate state transitions (ADR 0007)
    this.validateTransition(estadoActual, nuevoEstado);

    const now = new Date();

    // 1. Transactional stock deduction when moving to APROBADO (ADR 0025 decision #1, #2)
    if (nuevoEstado === TicketStatus.APROBADO) {
      await this.discountPiecesStock(ticket, usuarioId, usuarioEmail);
    }

    // 2. Transactional stock restitution when moving to CANCELADO
    if (nuevoEstado === TicketStatus.CANCELADO) {
      await this.restorePiecesStock(ticket, usuarioId, usuarioEmail);
    }

    // 3. Reverting from APROBADO to PENDIENTE also restores stock
    if (
      estadoActual === TicketStatus.APROBADO &&
      nuevoEstado === TicketStatus.PENDIENTE
    ) {
      await this.restorePiecesStock(
        ticket,
        usuarioId,
        usuarioEmail,
        'planificada',
      );
    }

    // 4. Wipes device key upon delivery or cancellation (ADR 0025 decision #6)
    if (
      nuevoEstado === TicketStatus.ENTREGADO ||
      nuevoEstado === TicketStatus.CANCELADO
    ) {
      ticket.claveEquipo = { tipo: 'ninguno' };
    }

    // 5. Actions upon delivery (ENTREGADO): saldo is always computed by the
    // server as precioTotal minus every non-annulled cobro already tied to
    // this ticket (adelanto + any earlier partial payment); the client only
    // supplies the payment `metodo`, never the amount.
    if (nuevoEstado === TicketStatus.ENTREGADO) {
      ticket.fechaEntregaReal = now;

      const saldoCalculado = await this.computeSaldo(ticket);

      if (saldoCalculado > 0 && dto.cobro && this.cobroService) {
        await this.cobroService.create({
          origen: 'ticket',
          referenciaId: ticket.id!,
          codigo: ticket.codigo,
          tipo: 'saldo',
          monto: saldoCalculado,
          metodo: dto.cobro.metodo,
          usuarioId,
          descripcion: `Saldo Ticket ${ticket.codigo}`,
        });
      }
      ticket.metodoSaldo =
        dto.cobro?.metodo ?? (saldoCalculado > 0 ? 'efectivo' : undefined);
      ticket.saldo = 0;

      // Award +1 loyalty stamp to customer (ADR 0025 decision #9)
      if (ticket.cliente.clienteId && this.registerVisit) {
        try {
          await this.registerVisit.execute({
            clientId: ticket.cliente.clienteId,
          });
        } catch {
          // Non-blocking: delivery succeeds even if loyalty webhook is offline
        }
      }
    }

    ticket.estado = nuevoEstado;
    ticket.historialEstados.push({
      estado: nuevoEstado,
      fecha: now,
      usuarioId,
      usuarioEmail,
      nota: dto.notaTecnica,
    });

    const updated = await this.ticketRepository.update(ticket);

    // Simplification (ADR 0028): a status change can touch stock (aprobado,
    // cancelado, back to pendiente) and/or record a cobro (entregado), so we
    // always publish all three rather than re-deriving exactly which one
    // applied for this transition.
    this.realtime?.publish(['tickets', 'inventory', 'sales']);

    if (
      nuevoEstado === TicketStatus.LISTO &&
      this.ticketWhatsApp?.isAutoTicketListoEnabled()
    ) {
      await this.autoNotifyTicketListo(updated.id ?? id, user);
    }

    return updated;
  }

  /**
   * Optional automatic "ticket listo" WhatsApp (flag
   * `WHATSAPP_AUTO_TICKET_LISTO`). Never blocks or reverts the status change:
   * any failure is logged and swallowed, and a repeat is skipped silently.
   */
  private async autoNotifyTicketListo(
    ticketId: string,
    user?: CurrentUser,
  ): Promise<void> {
    try {
      await this.ticketWhatsApp!.send(ticketId, 'ticket_listo', {
        trigger: 'auto',
        user,
      });
    } catch (error) {
      if (
        error instanceof TicketWhatsAppError &&
        error.code === 'already_sent'
      ) {
        return;
      }
      const reason =
        error instanceof TicketWhatsAppError
          ? `${error.code}${error.detail ? ` (${error.detail})` : ''}`
          : error instanceof Error
            ? error.message
            : 'unknown error';
      this.logger.warn(
        `Auto WhatsApp ticket_listo for ticket ${ticketId} not sent: ${reason}`,
      );
    }
  }

  /** precioTotal minus every non-annulled cobro already recorded for this ticket. */
  private async computeSaldo(ticket: Ticket): Promise<number> {
    if (!this.cobroService || !ticket.id) {
      return Math.max(0, ticket.precioTotal - ticket.adelanto);
    }
    const cobros = await this.cobroService.listByReferencia(ticket.id);
    const cobrado = cobros
      .filter((c) => !c.anulado)
      .reduce((sum, c) => sum + c.monto, 0);
    return Math.max(0, ticket.precioTotal - cobrado);
  }

  /**
   * `PATCH /api/tickets/:id`: editable ticket-detail fields (internal notes,
   * client-visible note, title, assigned technician). Goes through the same
   * getById -> mutate -> repository.update() path as every other write, so
   * it is covered by the same optimistic-concurrency check (409
   * `ticket_modified` on a stale read).
   */
  async updateDetails(
    id: string,
    dto: {
      notasInternas?: string[];
      notaCliente?: string;
      titulo?: string;
      tecnicoId?: string;
      tecnicoNombre?: string;
    },
    user?: CurrentUser,
  ): Promise<Ticket> {
    const ticket = await this.getById(id);
    const { usuarioEmail } = resolveUser(user);

    if (dto.notasInternas !== undefined) {
      const previous = ticket.notasInternas ?? [];
      // When the client appends to the existing list (the normal "add a
      // note" flow), stamp only the newly added entries with the real
      // author; a full replace/reorder is trusted as-is.
      const isAppend =
        dto.notasInternas.length >= previous.length &&
        previous.every((n, i) => n === dto.notasInternas![i]);
      if (isAppend) {
        const nuevas = dto.notasInternas
          .slice(previous.length)
          .map((n) =>
            n.startsWith('[') || !usuarioEmail ? n : `[${usuarioEmail}] ${n}`,
          );
        ticket.notasInternas = [...previous, ...nuevas];
      } else {
        ticket.notasInternas = dto.notasInternas;
      }
    }
    if (dto.notaCliente !== undefined) ticket.notaCliente = dto.notaCliente;
    if (dto.titulo !== undefined) ticket.titulo = dto.titulo.trim();
    if (dto.tecnicoId !== undefined) ticket.tecnicoId = dto.tecnicoId;
    if (dto.tecnicoNombre !== undefined)
      ticket.tecnicoNombre = dto.tecnicoNombre;

    const updated = await this.ticketRepository.update(ticket);
    this.realtime?.publish('tickets');
    return updated;
  }

  async updatePieces(
    id: string,
    dto: UpdateTicketPiecesDto,
    user?: CurrentUser,
  ): Promise<Ticket> {
    const ticket = await this.getById(id);
    const { usuarioId, usuarioEmail } = resolveUser(user);

    if (
      ticket.estado === TicketStatus.ENTREGADO ||
      ticket.estado === TicketStatus.CANCELADO
    ) {
      throw new ConflictException(
        'No se pueden modificar repuestos en un ticket finalizado.',
      );
    }

    const isStockActive = [
      TicketStatus.APROBADO,
      TicketStatus.TRABAJANDO,
      TicketStatus.LISTO,
    ].includes(ticket.estado);
    const targetEstado: PieceStatus = isStockActive
      ? 'descontada'
      : 'planificada';

    const newPieces: TicketPiece[] = dto.piezas.map((p) => ({
      productoId: p.productoId,
      nombre: p.nombre,
      categoria: p.categoria,
      cantidad: p.cantidad,
      costoUnitario: p.costoUnitario ?? 0,
      precioVentaUnitario: p.precioVentaUnitario ?? 0,
      estado: targetEstado,
    }));

    if (
      isStockActive &&
      this.productRepository &&
      this.stockMovementRepository
    ) {
      await this.applyPiecesStockDiff(
        ticket,
        ticket.piezas,
        newPieces,
        usuarioId,
        usuarioEmail,
      );
    }

    ticket.piezas = newPieces;
    ticket.precioTotal = dto.precioTotal;
    ticket.saldo = Math.max(0, dto.precioTotal - ticket.adelanto);

    const updated = await this.ticketRepository.update(ticket);

    // Touches stock only when the ticket is already in a stock-active state
    // (aprobado/trabajando/listo); otherwise it only edits planned pieces.
    const topics: RealtimeTopic[] = isStockActive
      ? ['tickets', 'inventory']
      : ['tickets'];
    this.realtime?.publish(topics);

    return updated;
  }

  /**
   * Diffs `oldPieces` (only its `descontada` rows, i.e. real stock already
   * consumed) against `newPieces` by `productoId`: a quantity decrease (or
   * removal) returns the difference to stock (`ticket_devolucion`); an
   * increase (or new product) discounts the difference, 409 + full
   * compensation of this batch's discounts if stock runs short.
   */
  private async applyPiecesStockDiff(
    ticket: Ticket,
    oldPieces: TicketPiece[],
    newPieces: TicketPiece[],
    usuarioId: string,
    usuarioEmail: string,
  ): Promise<void> {
    const productRepository = this.productRepository!;
    const stockMovementRepository = this.stockMovementRepository!;

    const oldQtyByProduct = new Map<string, number>();
    for (const p of oldPieces) {
      if (p.estado === 'descontada') {
        oldQtyByProduct.set(
          p.productoId,
          (oldQtyByProduct.get(p.productoId) ?? 0) + p.cantidad,
        );
      }
    }
    const newQtyByProduct = new Map<string, number>();
    for (const p of newPieces) {
      newQtyByProduct.set(
        p.productoId,
        (newQtyByProduct.get(p.productoId) ?? 0) + p.cantidad,
      );
    }

    const returns: { productoId: string; nombre: string; cantidad: number }[] =
      [];
    for (const [productoId, oldQty] of oldQtyByProduct) {
      const newQty = newQtyByProduct.get(productoId) ?? 0;
      if (newQty < oldQty) {
        const nombre =
          oldPieces.find((p) => p.productoId === productoId)?.nombre ??
          productoId;
        returns.push({ productoId, nombre, cantidad: oldQty - newQty });
      }
    }

    const discounts: {
      productoId: string;
      nombre: string;
      cantidad: number;
    }[] = [];
    for (const [productoId, newQty] of newQtyByProduct) {
      const oldQty = oldQtyByProduct.get(productoId) ?? 0;
      if (newQty > oldQty) {
        const nombre =
          newPieces.find((p) => p.productoId === productoId)?.nombre ??
          productoId;
        discounts.push({ productoId, nombre, cantidad: newQty - oldQty });
      }
    }

    // Validate ALL discounts have enough real stock before touching anything.
    const faltantes: Faltante[] = [];
    for (const d of discounts) {
      const product = await productRepository.findById(d.productoId);
      const hay = product?.stock ?? 0;
      if (hay < d.cantidad) {
        faltantes.push({
          productoId: d.productoId,
          nombre: d.nombre,
          necesita: d.cantidad,
          hay,
        });
      }
    }
    if (faltantes.length > 0) {
      throwInsufficientStock(faltantes);
    }

    // Apply discounts first (the risky part); only once every discount in
    // this batch succeeds do we touch the (always-safe) returns, so a
    // failure here leaves stock exactly as it was.
    const appliedDiscounts: typeof discounts = [];
    for (const d of discounts) {
      const updated = await productRepository.adjustStock(
        d.productoId,
        -d.cantidad,
      );
      if (!updated) {
        for (const done of appliedDiscounts) {
          const reverted = await productRepository.adjustStock(
            done.productoId,
            done.cantidad,
          );
          if (reverted) {
            await stockMovementRepository.create({
              productId: done.productoId,
              type: 'ticket_devolucion',
              quantity: done.cantidad,
              stockAfter: reverted.stock,
              reference: { type: 'ticket', id: ticket.codigo },
              reason: `Compensación por falta de stock al ajustar piezas en Ticket ${ticket.codigo}`,
              userId: usuarioId,
              userEmail: usuarioEmail,
            });
          }
        }
        const product = await productRepository.findById(d.productoId);
        throwInsufficientStock([
          {
            productoId: d.productoId,
            nombre: d.nombre,
            necesita: d.cantidad,
            hay: product?.stock ?? 0,
          },
        ]);
      }
      appliedDiscounts.push(d);
      await stockMovementRepository.create({
        productId: d.productoId,
        type: 'ticket_salida',
        quantity: -d.cantidad,
        stockAfter: updated.stock,
        reference: { type: 'ticket', id: ticket.codigo },
        reason: `Ajuste de piezas en Ticket ${ticket.codigo}`,
        userId: usuarioId,
        userEmail: usuarioEmail,
      });
    }

    for (const r of returns) {
      const updated = await productRepository.adjustStock(
        r.productoId,
        r.cantidad,
      );
      if (updated) {
        await stockMovementRepository.create({
          productId: r.productoId,
          type: 'ticket_devolucion',
          quantity: r.cantidad,
          stockAfter: updated.stock,
          reference: { type: 'ticket', id: ticket.codigo },
          reason: `Ajuste de piezas en Ticket ${ticket.codigo}`,
          userId: usuarioId,
          userEmail: usuarioEmail,
        });
      }
    }
  }

  async revealDeviceKey(
    id: string,
    user?: CurrentUser,
  ): Promise<{ tipo: string; valor?: string }> {
    const ticket = await this.getById(id);
    if (!ticket.claveEquipo || ticket.claveEquipo.tipo === 'ninguno') {
      return { tipo: 'ninguno' };
    }

    const decrypted = this.cipherService.decrypt(ticket.claveEquipo.valor);

    // Audit trail (ADR 0025 fix-up): every reveal is recorded on the ticket.
    const { usuarioId, usuarioEmail } = resolveUser(user);
    ticket.auditoriaClave.push({
      usuarioId,
      usuarioEmail,
      fecha: new Date(),
    });
    await this.ticketRepository.update(ticket);

    return {
      tipo: ticket.claveEquipo.tipo,
      valor: decrypted,
    };
  }

  async addInternalNote(
    id: string,
    texto: string,
    autor?: string,
  ): Promise<Ticket> {
    const ticket = await this.getById(id);
    if (!ticket.notasInternas) {
      ticket.notasInternas = [];
    }
    const noteEntry = autor ? `[${autor}] ${texto}` : texto;
    ticket.notasInternas.push(noteEntry);
    const updated = await this.ticketRepository.update(ticket);
    this.realtime?.publish('tickets');
    return updated;
  }

  async getPieceAvailability(productoId: string) {
    let stock = 0;
    if (this.productRepository) {
      const product = await this.productRepository.findById(productoId);
      if (product) {
        stock = product.stock;
      }
    }
    const { planned, ticketCodigos } =
      await this.ticketRepository.getPlannedPiecesCount(productoId);
    const available = Math.max(0, stock - planned);

    return {
      productoId,
      stock,
      planned,
      available,
      ticketCodigos,
    };
  }

  private isValidPattern(valor: string): boolean {
    if (!PATTERN_REGEX.test(valor)) return false;
    const digits = valor.split('-');
    return new Set(digits).size === digits.length; // no repeated dots
  }

  private async discountPiecesStock(
    ticket: Ticket,
    usuarioId: string,
    usuarioEmail: string,
  ): Promise<void> {
    if (!this.productRepository || !this.stockMovementRepository) return;
    const productRepository = this.productRepository;
    const stockMovementRepository = this.stockMovementRepository;

    const piecesToDiscount = ticket.piezas.filter(
      (p) => p.estado === 'planificada',
    );
    if (piecesToDiscount.length === 0) return;

    // Phase 1: validate ALL pieces have enough real stock before touching
    // anything (ADR 0025 fix-up "validate ALL pieces first").
    const neededByProduct = new Map<string, number>();
    for (const p of piecesToDiscount) {
      neededByProduct.set(
        p.productoId,
        (neededByProduct.get(p.productoId) ?? 0) + p.cantidad,
      );
    }
    const faltantes: Faltante[] = [];
    for (const [productoId, necesita] of neededByProduct) {
      const product = await productRepository.findById(productoId);
      const hay = product?.stock ?? 0;
      if (hay < necesita) {
        const nombre =
          piecesToDiscount.find((p) => p.productoId === productoId)?.nombre ??
          productoId;
        faltantes.push({ productoId, nombre, necesita, hay });
      }
    }
    if (faltantes.length > 0) {
      throwInsufficientStock(faltantes);
    }

    // Phase 2: apply atomic conditional decrements in order; on the first
    // failure (rare race condition since phase 1 already validated), revert
    // everything already applied in this batch and throw without touching
    // the ticket any further.
    const applied: TicketPiece[] = [];
    for (const piece of piecesToDiscount) {
      const updated = await productRepository.adjustStock(
        piece.productoId,
        -piece.cantidad,
      );

      if (!updated) {
        for (const done of applied) {
          const reverted = await productRepository.adjustStock(
            done.productoId,
            done.cantidad,
          );
          if (reverted) {
            done.estado = 'planificada';
            await stockMovementRepository.create({
              productId: done.productoId,
              type: 'ticket_devolucion',
              quantity: done.cantidad,
              stockAfter: reverted.stock,
              reference: { type: 'ticket', id: ticket.codigo },
              reason: `Compensación por falta de stock al aprobar Ticket ${ticket.codigo}`,
              userId: usuarioId,
              userEmail: usuarioEmail,
            });
          }
        }
        const product = await productRepository.findById(piece.productoId);
        throwInsufficientStock([
          {
            productoId: piece.productoId,
            nombre: piece.nombre,
            necesita: piece.cantidad,
            hay: product?.stock ?? 0,
          },
        ]);
      }

      piece.estado = 'descontada';
      applied.push(piece);
      await stockMovementRepository.create({
        productId: piece.productoId,
        type: 'ticket_salida',
        quantity: -piece.cantidad,
        stockAfter: updated.stock,
        reference: { type: 'ticket', id: ticket.codigo },
        reason: `Consumo en Ticket ${ticket.codigo}`,
        userId: usuarioId,
        userEmail: usuarioEmail,
      });
    }
  }

  private async restorePiecesStock(
    ticket: Ticket,
    usuarioId: string,
    usuarioEmail: string,
    targetStatus: PieceStatus = 'devuelta',
  ): Promise<void> {
    if (!this.productRepository || !this.stockMovementRepository) return;

    for (const piece of ticket.piezas) {
      if (piece.estado === 'descontada') {
        const updated = await this.productRepository.adjustStock(
          piece.productoId,
          piece.cantidad,
        );

        if (updated) {
          piece.estado = targetStatus;
          await this.stockMovementRepository.create({
            productId: piece.productoId,
            type: 'ticket_devolucion',
            quantity: piece.cantidad,
            stockAfter: updated.stock,
            reference: { type: 'ticket', id: ticket.codigo },
            reason: `Reingreso por cancelación de Ticket ${ticket.codigo}`,
            userId: usuarioId,
            userEmail: usuarioEmail,
          });
        }
      }
    }
  }

  private validateTransition(from: TicketStatus, to: TicketStatus): void {
    const validMap: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.PENDIENTE]: [TicketStatus.APROBADO, TicketStatus.CANCELADO],
      [TicketStatus.APROBADO]: [
        TicketStatus.TRABAJANDO,
        TicketStatus.PENDIENTE,
        TicketStatus.CANCELADO,
      ],
      [TicketStatus.TRABAJANDO]: [
        TicketStatus.LISTO,
        TicketStatus.APROBADO,
        TicketStatus.CANCELADO,
      ],
      [TicketStatus.LISTO]: [
        TicketStatus.ENTREGADO,
        TicketStatus.TRABAJANDO,
        TicketStatus.ABANDONADO,
      ],
      [TicketStatus.ENTREGADO]: [TicketStatus.LISTO],
      [TicketStatus.CANCELADO]: [TicketStatus.PENDIENTE],
      [TicketStatus.ABANDONADO]: [
        TicketStatus.ENTREGADO,
        TicketStatus.CANCELADO,
      ],
    };

    const allowed = validMap[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Transición no permitida: no se puede cambiar de "${from}" a "${to}".`,
      );
    }
  }
}

function resolveUser(user?: CurrentUser): Required<CurrentUser> {
  return {
    usuarioId: user?.usuarioId || SYSTEM_USER.usuarioId,
    usuarioEmail: user?.usuarioEmail || SYSTEM_USER.usuarioEmail,
  };
}

function throwInsufficientStock(faltantes: Faltante[]): never {
  const first = faltantes[0];
  throw new ConflictException({
    code: 'insufficient_stock',
    message: `Falta ${first.necesita - first.hay} ${first.nombre}`,
    faltantes,
  });
}

import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';
import {
  ITicketRepository,
  ListTicketsFilters,
  ListTicketsResult,
} from '../../domain/ticket.repository.port';
import { TicketCipherService } from '../../infrastructure/crypto/ticket-cipher.service';
import { TicketUseCases } from '../ticket.use-cases';
import { ProductRepository } from '../../../inventory/domain/product-repository.port';
import { StockMovementRepository } from '../../../inventory/domain/stock-movement-repository.port';
import { Product } from '../../../inventory/domain/product.entity';
import { StockMovement } from '../../../inventory/domain/stock-movement.entity';
import { CobroService } from '../cobro.service';

class InMemoryTicketRepository implements ITicketRepository {
  private seq = 0;
  private tickets: Ticket[] = [];

  async getNextSequence(): Promise<number> {
    this.seq += 1;
    return this.seq;
  }

  async create(ticket: Ticket): Promise<Ticket> {
    const withId = new Ticket({
      ...ticket,
      id: `ticket-${this.seq}`,
    });
    this.tickets.push(withId);
    return withId;
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.tickets.find((t) => t.id === id) ?? null;
  }

  async findByPublicToken(publicToken: string): Promise<Ticket | null> {
    return this.tickets.find((t) => t.publicToken === publicToken) ?? null;
  }

  async findByCodigo(codigo: string): Promise<Ticket | null> {
    return this.tickets.find((t) => t.codigo === codigo) ?? null;
  }

  async findByClienteId(clienteId: string): Promise<Ticket[]> {
    return this.tickets.filter((t) => t.cliente.clienteId === clienteId);
  }

  async countActiveByClienteId(clienteId: string): Promise<number> {
    return this.tickets.filter(
      (t) =>
        t.cliente.clienteId === clienteId &&
        [
          TicketStatus.PENDIENTE,
          TicketStatus.APROBADO,
          TicketStatus.TRABAJANDO,
          TicketStatus.LISTO,
        ].includes(t.estado),
    ).length;
  }

  async getPlannedPiecesCount(productoId: string) {
    let planned = 0;
    const ticketCodigos: string[] = [];
    for (const t of this.tickets) {
      if (t.estado === TicketStatus.PENDIENTE) {
        for (const p of t.piezas) {
          if (p.productoId === productoId && p.estado === 'planificada') {
            planned += p.cantidad;
            ticketCodigos.push(t.codigo);
          }
        }
      }
    }
    return { planned, ticketCodigos };
  }

  async countActiveByTecnicoId(tecnicoId: string): Promise<number> {
    return this.tickets.filter(
      (t) =>
        t.tecnicoId === tecnicoId &&
        [
          TicketStatus.PENDIENTE,
          TicketStatus.APROBADO,
          TicketStatus.TRABAJANDO,
          TicketStatus.LISTO,
        ].includes(t.estado),
    ).length;
  }

  async getPieceReservations(productoId: string, excludeTicketId?: string) {
    const reservations: {
      ticketId: string;
      codigo: string;
      cliente: string;
      cantidad: number;
    }[] = [];
    for (const t of this.tickets) {
      if (t.estado !== TicketStatus.PENDIENTE || t.id === excludeTicketId) {
        continue;
      }
      const cantidad = t.piezas
        .filter(
          (p) => p.productoId === productoId && p.estado === 'planificada',
        )
        .reduce((sum, p) => sum + p.cantidad, 0);
      if (cantidad > 0) {
        reservations.push({
          ticketId: t.id!,
          codigo: t.codigo,
          cliente: [t.cliente.nombre, t.cliente.apellido]
            .filter(Boolean)
            .join(' '),
          cantidad,
        });
      }
    }
    return reservations;
  }

  async list(filters: ListTicketsFilters): Promise<ListTicketsResult> {
    let result = [...this.tickets];
    if (filters.estado) {
      result = result.filter((t) => t.estado === filters.estado);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(
        (t) =>
          t.codigo.toLowerCase().includes(q) ||
          t.cliente.telefono.includes(q) ||
          t.cliente.nombre.toLowerCase().includes(q),
      );
    }
    return {
      tickets: result,
      total: result.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }

  async update(ticket: Ticket): Promise<Ticket> {
    const index = this.tickets.findIndex((t) => t.id === ticket.id);
    if (index === -1) throw new Error('Not found');
    this.tickets[index] = ticket;
    return ticket;
  }
}

describe('TicketUseCases', () => {
  let repository: InMemoryTicketRepository;
  let cipherService: TicketCipherService;
  let useCases: TicketUseCases;

  beforeEach(() => {
    repository = new InMemoryTicketRepository();
    const configService = {
      get: (key: string) => {
        if (key === 'TICKET_SECRET_KEY')
          return 'test-key-32-chars-long-for-aes256';
        return undefined;
      },
    } as unknown as ConfigService;
    cipherService = new TicketCipherService(configService);
    useCases = new TicketUseCases(repository, cipherService);
  });

  it('creates ticket with atomic AT-000001 code and encrypted device key', async () => {
    const ticket = await useCases.createTicket({
      cliente: {
        nombre: 'Andrea',
        apellido: 'Salazar',
        telefono: '987654321',
      },
      equipo: {
        marca: 'Apple',
        modelo: 'iPhone 12',
        color: 'Negro',
        fallaReportada: 'Pantalla rota',
      },
      claveEquipo: {
        tipo: 'pin',
        valor: '1234',
      },
      titulo: 'Reparación de pantalla iPhone 12',
      precioTotal: 189,
      adelanto: 50,
    });

    expect(ticket.codigo).toBe('AT-000001');
    expect(ticket.publicToken).toHaveLength(36); // UUID v4 format
    expect(ticket.estado).toBe(TicketStatus.PENDIENTE);
    expect(ticket.saldo).toBe(139);
    expect(ticket.claveEquipo?.tipo).toBe('pin');
    expect(ticket.claveEquipo?.valor).toBeDefined();
    expect(ticket.claveEquipo?.valor).not.toBe('1234'); // encrypted
  });

  it('reveals decrypted device key only when requested by technician', async () => {
    const ticket = await useCases.createTicket({
      cliente: {
        nombre: 'Carlos',
        telefono: '999888777',
      },
      equipo: {
        fallaReportada: 'No enciende',
      },
      claveEquipo: {
        tipo: 'patron',
        valor: '1-5-9-6',
      },
      titulo: 'Revisión general',
      precioTotal: 100,
    });

    const revealed = await useCases.revealDeviceKey(ticket.id!);
    expect(revealed.tipo).toBe('patron');
    expect(revealed.valor).toBe('1-5-9-6');
  });

  it('validates state transitions per ADR 0007', async () => {
    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Luis', telefono: '912345678' },
      equipo: { fallaReportada: 'Batería inflada' },
      titulo: 'Cambio de batería',
      precioTotal: 90,
    });

    // PENDIENTE -> APROBADO (allowed)
    const aprobado = await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.APROBADO,
      notaTecnica: 'Cliente aceptó presupuesto por WhatsApp',
    });
    expect(aprobado.estado).toBe(TicketStatus.APROBADO);

    // APROBADO -> ENTREGADO directly (illegal, must go through TRABAJANDO -> LISTO)
    await expect(
      useCases.updateStatus(ticket.id!, {
        nuevoEstado: TicketStatus.ENTREGADO,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('erases device key upon delivery or cancellation for privacy', async () => {
    const ticket = await useCases.createTicket({
      cliente: { nombre: 'María', telefono: '987111222' },
      equipo: { fallaReportada: 'Audio bajo' },
      claveEquipo: { tipo: 'contrasena', valor: 'secreta123' },
      titulo: 'Limpieza de parlante',
      precioTotal: 40,
    });

    // Transition PENDIENTE -> CANCELADO
    const cancelado = await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.CANCELADO,
      notaTecnica: 'Cliente no autorizó costo',
    });

    expect(cancelado.estado).toBe(TicketStatus.CANCELADO);
    expect(cancelado.claveEquipo?.tipo).toBe('ninguno');
    expect(cancelado.claveEquipo?.valor).toBeUndefined();
  });

  it('exposes only public fields in getPublicByToken (no pin, no internal notes)', async () => {
    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Jorge', apellido: 'Pérez', telefono: '976543210' },
      equipo: {
        marca: 'Xiaomi',
        modelo: 'Redmi Note 10',
        color: 'Azul',
        fallaReportada: 'Pin de carga',
      },
      claveEquipo: { tipo: 'pin', valor: '9988' },
      titulo: 'Cambio de puerto de carga',
      notaCliente: 'Repuesto original instalado con 3 meses de garantía',
      notasInternas: [
        'Cliente es amigo del dueño, no cobrar revisión si falla',
      ],
      precioTotal: 75,
      adelanto: 25,
    });

    const publicView = await useCases.getPublicByToken(ticket.publicToken);

    expect(publicView.codigo).toBe(ticket.codigo);
    expect(publicView.titulo).toBe('Cambio de puerto de carga');
    expect(publicView.notaCliente).toBe(
      'Repuesto original instalado con 3 meses de garantía',
    );
    expect(publicView.cliente.nombre).toBe('Jorge');
    expect(publicView.saldo).toBe(50);
    // Security check: no private technician fields exposed
    expect((publicView as any).claveEquipo).toBeUndefined();
    expect((publicView as any).notasInternas).toBeUndefined();
    expect((publicView as any).telefono).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Stock-affecting flows: approve (with 409 + compensation) and piece edits.
// ---------------------------------------------------------------------------

class FakeProductRepository {
  products = new Map<string, Product>();

  seed(id: string, stock: number, extra: Partial<Product> = {}) {
    this.products.set(id, {
      id,
      category: { id: 'cat-1', name: 'Pantallas' },
      brand: null,
      name: extra.name ?? `Producto ${id}`,
      stock,
      cost: extra.cost ?? 10,
      salePrice: extra.salePrice ?? 20,
      minStock: 0,
      compatiblePhones: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...extra,
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async adjustStock(
    id: string,
    delta: number,
  ): Promise<Product | null | undefined> {
    const product = this.products.get(id);
    if (!product) return null;
    if (delta < 0 && product.stock < -delta) return undefined;
    const updated = { ...product, stock: product.stock + delta };
    this.products.set(id, updated);
    return updated;
  }

  // Unused by TicketUseCases; present only to satisfy the port at the call
  // site's `as unknown as ProductRepository` cast when needed.
  async list() {
    throw new Error('not implemented in fake');
  }
}

class FakeStockMovementRepository {
  movements: StockMovement[] = [];

  async create(input: {
    productId: string;
    type: StockMovement['type'];
    quantity: number;
    stockAfter: number;
    reference?: StockMovement['reference'];
    reason?: string;
    userId: string;
    userEmail: string;
  }): Promise<StockMovement> {
    const movement: StockMovement = {
      id: `mv-${this.movements.length + 1}`,
      productId: input.productId,
      type: input.type,
      quantity: input.quantity,
      stockAfter: input.stockAfter,
      reference: input.reference ?? null,
      reason: input.reason,
      userId: input.userId,
      userEmail: input.userEmail,
      occurredAt: new Date(),
    };
    this.movements.push(movement);
    return movement;
  }

  async findByProduct() {
    throw new Error('not implemented in fake');
  }
}

class FakeCobroService {
  cobros: {
    id: string;
    referenciaId: string;
    codigo: string;
    tipo: string;
    monto: number;
    metodo: string;
    anulado: boolean;
  }[] = [];

  async create(input: {
    referenciaId: string;
    codigo: string;
    tipo: 'adelanto' | 'saldo' | 'venta';
    monto: number;
    metodo: 'efectivo' | 'yape';
  }) {
    const cobro = {
      id: `cobro-${this.cobros.length + 1}`,
      anulado: false,
      ...input,
    };
    this.cobros.push(cobro);
    return cobro;
  }

  async listByReferencia(referenciaId: string) {
    return this.cobros.filter((c) => c.referenciaId === referenciaId);
  }
}

function buildUseCasesWithStock() {
  const repository = new InMemoryTicketRepository();
  const configService = {
    get: (key: string) =>
      key === 'TICKET_SECRET_KEY'
        ? 'test-key-32-chars-long-for-aes256'
        : undefined,
  } as unknown as ConfigService;
  const cipherService = new TicketCipherService(configService);
  const products = new FakeProductRepository();
  const movements = new FakeStockMovementRepository();
  const cobroService = new FakeCobroService();
  const useCases = new TicketUseCases(
    repository,
    cipherService,
    products as unknown as ProductRepository,
    movements as unknown as StockMovementRepository,
    undefined,
    cobroService as unknown as CobroService,
  );
  return { repository, useCases, products, movements, cobroService };
}

describe('TicketUseCases — stock effects on approve', () => {
  it('discounts stock atomically and writes a ticket_salida movement on aprobado', async () => {
    const { useCases, products, movements } = buildUseCasesWithStock();
    products.seed('prod-1', 5, { name: 'Pantalla A53' });

    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Ana', telefono: '911111111' },
      equipo: { fallaReportada: 'Pantalla rota' },
      titulo: 'Cambio de pantalla',
      precioTotal: 150,
      piezas: [{ productoId: 'prod-1', nombre: 'Pantalla A53', cantidad: 2 }],
    });

    const approved = await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.APROBADO,
    });

    expect(approved.piezas[0].estado).toBe('descontada');
    expect((await products.findById('prod-1'))!.stock).toBe(3);
    expect(movements.movements).toHaveLength(1);
    expect(movements.movements[0].type).toBe('ticket_salida');
    expect(movements.movements[0].quantity).toBe(-2);
  });

  it('returns 409 insufficient_stock with faltantes and leaves the ticket unchanged when stock is short', async () => {
    const { useCases, products, movements } = buildUseCasesWithStock();
    products.seed('prod-1', 1, { name: 'Pantalla A53' });

    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Bruno', telefono: '922222222' },
      equipo: { fallaReportada: 'Pantalla rota' },
      titulo: 'Cambio de pantalla',
      precioTotal: 150,
      piezas: [{ productoId: 'prod-1', nombre: 'Pantalla A53', cantidad: 2 }],
    });

    await expect(
      useCases.updateStatus(ticket.id!, { nuevoEstado: TicketStatus.APROBADO }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'insufficient_stock',
        faltantes: [
          { productoId: 'prod-1', nombre: 'Pantalla A53', necesita: 2, hay: 1 },
        ],
      }),
    });

    // Stock and ticket state are untouched (no partial decrement).
    expect((await products.findById('prod-1'))!.stock).toBe(1);
    expect(movements.movements).toHaveLength(0);
    const reloaded = await useCases.getById(ticket.id!);
    expect(reloaded.estado).toBe(TicketStatus.PENDIENTE);
    expect(reloaded.piezas[0].estado).toBe('planificada');
  });

  it('compensates already-applied decrements when a later piece fails validation stock check', async () => {
    const { useCases, products, movements } = buildUseCasesWithStock();
    products.seed('prod-1', 5, { name: 'Pantalla A53' });
    products.seed('prod-2', 0, { name: 'Batería' });

    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Caro', telefono: '933333333' },
      equipo: { fallaReportada: 'Pantalla y batería' },
      titulo: 'Cambio de pantalla y batería',
      precioTotal: 250,
      piezas: [
        { productoId: 'prod-1', nombre: 'Pantalla A53', cantidad: 1 },
        { productoId: 'prod-2', nombre: 'Batería', cantidad: 1 },
      ],
    });

    await expect(
      useCases.updateStatus(ticket.id!, { nuevoEstado: TicketStatus.APROBADO }),
    ).rejects.toBeInstanceOf(ConflictException);

    // Pre-validation catches both in one pass: neither product is touched.
    expect((await products.findById('prod-1'))!.stock).toBe(5);
    expect((await products.findById('prod-2'))!.stock).toBe(0);
    expect(movements.movements).toHaveLength(0);
  });
});

describe('TicketUseCases — piece edits on an approved ticket', () => {
  it('discounts a newly added piece and returns stock when a piece is removed', async () => {
    const { useCases, products, movements } = buildUseCasesWithStock();
    products.seed('prod-1', 5, { name: 'Pantalla A53' });
    products.seed('prod-2', 3, { name: 'Mica' });

    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Diego', telefono: '944444444' },
      equipo: { fallaReportada: 'Pantalla rota' },
      titulo: 'Cambio de pantalla',
      precioTotal: 150,
      piezas: [{ productoId: 'prod-1', nombre: 'Pantalla A53', cantidad: 1 }],
    });
    await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.APROBADO,
    });
    expect((await products.findById('prod-1'))!.stock).toBe(4);

    // Replace: drop the screen (return 1), add a mica (discount 1).
    const updated = await useCases.updatePieces(ticket.id!, {
      piezas: [{ productoId: 'prod-2', nombre: 'Mica', cantidad: 1 }],
      precioTotal: 80,
    });

    expect(updated.piezas).toHaveLength(1);
    expect(updated.piezas[0].productoId).toBe('prod-2');
    expect(updated.piezas[0].estado).toBe('descontada');
    expect((await products.findById('prod-1'))!.stock).toBe(5); // returned
    expect((await products.findById('prod-2'))!.stock).toBe(2); // discounted

    const types = movements.movements.map((m) => m.type);
    expect(types).toEqual([
      'ticket_salida',
      'ticket_salida',
      'ticket_devolucion',
    ]);
  });

  it('409s and leaves stock unchanged when increasing a piece quantity beyond available stock', async () => {
    const { useCases, products, movements } = buildUseCasesWithStock();
    products.seed('prod-1', 2, { name: 'Pantalla A53' });

    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Eli', telefono: '955555555' },
      equipo: { fallaReportada: 'Pantalla rota' },
      titulo: 'Cambio de pantalla',
      precioTotal: 150,
      piezas: [{ productoId: 'prod-1', nombre: 'Pantalla A53', cantidad: 1 }],
    });
    await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.APROBADO,
    });
    const movementsAfterApprove = movements.movements.length;

    await expect(
      useCases.updatePieces(ticket.id!, {
        piezas: [{ productoId: 'prod-1', nombre: 'Pantalla A53', cantidad: 5 }],
        precioTotal: 150,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'insufficient_stock' }),
    });

    expect((await products.findById('prod-1'))!.stock).toBe(1); // unchanged
    expect(movements.movements).toHaveLength(movementsAfterApprove);
  });
});

describe('TicketUseCases — entrega computes saldo from cobros', () => {
  it('records a saldo cobro equal to precioTotal minus the adelanto, and zeroes ticket.saldo', async () => {
    const { useCases, cobroService } = buildUseCasesWithStock();

    const ticket = await useCases.createTicket({
      cliente: { nombre: 'Fabi', telefono: '966666666' },
      equipo: { fallaReportada: 'No enciende' },
      titulo: 'Revisión general',
      precioTotal: 200,
      adelanto: 50,
      metodoAdelanto: 'yape',
    });
    expect(ticket.saldo).toBe(150);

    // Walk the required state machine to entregado.
    await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.APROBADO,
    });
    await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.TRABAJANDO,
    });
    await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.LISTO,
    });
    const entregado = await useCases.updateStatus(ticket.id!, {
      nuevoEstado: TicketStatus.ENTREGADO,
      cobro: { metodo: 'efectivo' },
    });

    expect(entregado.saldo).toBe(0);
    const cobros = await cobroService.listByReferencia(ticket.id!);
    const saldoCobro = cobros.find((c) => c.tipo === 'saldo');
    expect(saldoCobro).toBeDefined();
    expect(saldoCobro!.monto).toBe(150); // server-computed, ignores any client amount
    expect(saldoCobro!.metodo).toBe('efectivo');
  });
});

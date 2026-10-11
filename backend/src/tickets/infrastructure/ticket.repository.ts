import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ticket, TicketStatus } from '../domain/ticket.entity';
import {
  ITicketRepository,
  ListTicketsFilters,
  ListTicketsResult,
  PieceReservation,
} from '../domain/ticket.repository.port';
import { TicketDocument, TicketMongo } from './schemas/ticket.schema';
import { CounterDocument, Counter } from './schemas/counter.schema';

@Injectable()
export class TicketRepository implements ITicketRepository {
  constructor(
    @InjectModel(TicketMongo.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  async getNextSequence(): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: 'tickets' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return counter.seq;
  }

  async create(ticket: Ticket): Promise<Ticket> {
    const doc = new this.ticketModel({
      codigo: ticket.codigo,
      publicToken: ticket.publicToken,
      cliente: {
        clienteId: ticket.cliente.clienteId
          ? new Types.ObjectId(ticket.cliente.clienteId)
          : undefined,
        nombre: ticket.cliente.nombre,
        apellido: ticket.cliente.apellido,
        telefono: ticket.cliente.telefono,
      },
      equipo: ticket.equipo,
      claveEquipo: ticket.claveEquipo,
      titulo: ticket.titulo,
      notaCliente: ticket.notaCliente,
      notasInternas: ticket.notasInternas,
      tecnicoId: ticket.tecnicoId,
      tecnicoNombre: ticket.tecnicoNombre,
      piezas: ticket.piezas,
      precioTotal: ticket.precioTotal,
      adelanto: ticket.adelanto,
      metodoAdelanto: ticket.metodoAdelanto,
      saldo: ticket.saldo,
      metodoSaldo: ticket.metodoSaldo,
      estado: ticket.estado,
      historialEstados: ticket.historialEstados,
      auditoriaClave: ticket.auditoriaClave,
      version: ticket.version ?? 0,
      fechaIngreso: ticket.fechaIngreso,
      fechaEntregaEstimada: ticket.fechaEntregaEstimada,
      fechaEntregaReal: ticket.fechaEntregaReal,
    });

    const saved = await doc.save();
    return this.toEntity(saved);
  }

  async findById(id: string): Promise<Ticket | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.ticketModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByPublicToken(publicToken: string): Promise<Ticket | null> {
    const doc = await this.ticketModel.findOne({ publicToken });
    return doc ? this.toEntity(doc) : null;
  }

  async findByCodigo(codigo: string): Promise<Ticket | null> {
    const doc = await this.ticketModel.findOne({
      codigo: codigo.trim().toUpperCase(),
    });
    return doc ? this.toEntity(doc) : null;
  }

  async findByClienteId(clienteId: string): Promise<Ticket[]> {
    if (!Types.ObjectId.isValid(clienteId)) return [];
    const docs = await this.ticketModel
      .find({ 'cliente.clienteId': new Types.ObjectId(clienteId) })
      .sort({ createdAt: -1 });
    return docs.map((d) => this.toEntity(d));
  }

  async countActiveByClienteId(clienteId: string): Promise<number> {
    if (!Types.ObjectId.isValid(clienteId)) return 0;
    return this.ticketModel.countDocuments({
      'cliente.clienteId': new Types.ObjectId(clienteId),
      estado: {
        $in: [
          TicketStatus.PENDIENTE,
          TicketStatus.APROBADO,
          TicketStatus.TRABAJANDO,
          TicketStatus.LISTO,
        ],
      },
    });
  }

  async getPlannedPiecesCount(
    productoId: string,
  ): Promise<{ planned: number; ticketCodigos: string[] }> {
    // Only pending tickets reserve/plan pieces
    const docs = await this.ticketModel
      .find({
        estado: TicketStatus.PENDIENTE,
        'piezas.productoId': productoId,
        'piezas.estado': 'planificada',
      })
      .select('codigo piezas');

    let totalPlanned = 0;
    const ticketCodigos: string[] = [];

    for (const doc of docs) {
      ticketCodigos.push(doc.codigo);
      for (const p of doc.piezas) {
        if (p.productoId === productoId && p.estado === 'planificada') {
          totalPlanned += p.cantidad;
        }
      }
    }

    return { planned: totalPlanned, ticketCodigos };
  }

  async countActiveByTecnicoId(tecnicoId: string): Promise<number> {
    return this.ticketModel.countDocuments({
      tecnicoId,
      estado: {
        $in: [
          TicketStatus.PENDIENTE,
          TicketStatus.APROBADO,
          TicketStatus.TRABAJANDO,
          TicketStatus.LISTO,
        ],
      },
    });
  }

  async getPieceReservations(
    productoId: string,
    excludeTicketId?: string,
  ): Promise<PieceReservation[]> {
    const query: Record<string, unknown> = {
      estado: TicketStatus.PENDIENTE,
      'piezas.productoId': productoId,
      'piezas.estado': 'planificada',
    };
    if (excludeTicketId && Types.ObjectId.isValid(excludeTicketId)) {
      query._id = { $ne: new Types.ObjectId(excludeTicketId) };
    }

    const docs = await this.ticketModel
      .find(query)
      .select('codigo cliente piezas');

    const reservations: PieceReservation[] = [];
    for (const doc of docs) {
      const cantidad = doc.piezas
        .filter(
          (p) => p.productoId === productoId && p.estado === 'planificada',
        )
        .reduce((sum, p) => sum + p.cantidad, 0);
      if (cantidad <= 0) continue;
      const nombreCliente = [doc.cliente?.nombre, doc.cliente?.apellido]
        .filter(Boolean)
        .join(' ');
      reservations.push({
        ticketId: doc._id.toString(),
        codigo: doc.codigo,
        cliente: nombreCliente,
        cantidad,
      });
    }
    return reservations;
  }

  async list(filters: ListTicketsFilters): Promise<ListTicketsResult> {
    const query: Record<string, any> = {};

    if (filters.estado) {
      query.estado = filters.estado;
    }

    if (filters.clienteId && Types.ObjectId.isValid(filters.clienteId)) {
      query['cliente.clienteId'] = new Types.ObjectId(filters.clienteId);
    }

    if (filters.tecnicoId) {
      query.tecnicoId = filters.tecnicoId;
    }

    if (filters.q && filters.q.trim() !== '') {
      const escaped = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [
        { codigo: regex },
        { 'cliente.telefono': regex },
        { 'cliente.nombre': regex },
        { 'cliente.apellido': regex },
        { 'equipo.modelo': regex },
        { 'equipo.marca': regex },
        { 'equipo.imei': regex },
        { titulo: regex },
      ];
    }

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.ticketModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.ticketModel.countDocuments(query),
    ]);

    return {
      tickets: docs.map((d) => this.toEntity(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async update(ticket: Ticket): Promise<Ticket> {
    const updateData: Record<string, any> = {
      cliente: {
        clienteId: ticket.cliente.clienteId
          ? new Types.ObjectId(ticket.cliente.clienteId)
          : undefined,
        nombre: ticket.cliente.nombre,
        apellido: ticket.cliente.apellido,
        telefono: ticket.cliente.telefono,
      },
      equipo: ticket.equipo,
      claveEquipo: ticket.claveEquipo,
      titulo: ticket.titulo,
      notaCliente: ticket.notaCliente,
      notasInternas: ticket.notasInternas,
      tecnicoId: ticket.tecnicoId,
      tecnicoNombre: ticket.tecnicoNombre,
      piezas: ticket.piezas,
      precioTotal: ticket.precioTotal,
      adelanto: ticket.adelanto,
      metodoAdelanto: ticket.metodoAdelanto,
      saldo: ticket.saldo,
      metodoSaldo: ticket.metodoSaldo,
      estado: ticket.estado,
      historialEstados: ticket.historialEstados,
      auditoriaClave: ticket.auditoriaClave,
      fechaEntregaEstimada: ticket.fechaEntregaEstimada,
      fechaEntregaReal: ticket.fechaEntregaReal,
    };

    const expectedVersion = ticket.version ?? 0;

    // Optimistic concurrency (ADR 0025 fix-up): the write only applies when
    // the stored version still matches the one this ticket was read with;
    // `version` is atomically bumped in the same update. A mismatch means
    // someone else wrote to this ticket since it was loaded.
    const updated = await this.ticketModel.findOneAndUpdate(
      { _id: ticket.id, version: expectedVersion },
      { $set: updateData, $inc: { version: 1 } },
      { new: true },
    );

    if (!updated) {
      const stillExists = await this.ticketModel.exists({ _id: ticket.id });
      if (stillExists) {
        throw new ConflictException({
          code: 'ticket_modified',
          message:
            'El ticket fue modificado por otro usuario. Recarga e intenta de nuevo.',
        });
      }
      throw new Error(`Ticket con ID ${ticket.id} no encontrado.`);
    }

    return this.toEntity(updated);
  }

  private toEntity(doc: TicketDocument): Ticket {
    return new Ticket({
      id: doc._id.toString(),
      codigo: doc.codigo,
      publicToken: doc.publicToken,
      cliente: {
        clienteId: doc.cliente?.clienteId?.toString(),
        nombre: doc.cliente?.nombre ?? '',
        apellido: doc.cliente?.apellido,
        telefono: doc.cliente?.telefono ?? '',
      },
      equipo: {
        marcaId: doc.equipo?.marcaId,
        celularId: doc.equipo?.celularId,
        marca: doc.equipo?.marca,
        modelo: doc.equipo?.modelo,
        color: doc.equipo?.color,
        imei: doc.equipo?.imei,
        fallaReportada: doc.equipo?.fallaReportada ?? '',
        estadoIngreso: doc.equipo?.estadoIngreso,
      },
      claveEquipo: doc.claveEquipo
        ? {
            tipo: doc.claveEquipo.tipo as any,
            valor: doc.claveEquipo.valor,
          }
        : undefined,
      titulo: doc.titulo,
      notaCliente: doc.notaCliente,
      notasInternas: doc.notasInternas ?? [],
      tecnicoId: doc.tecnicoId,
      tecnicoNombre: doc.tecnicoNombre,
      piezas: (doc.piezas ?? []).map((p) => ({
        productoId: p.productoId,
        nombre: p.nombre,
        categoria: p.categoria,
        cantidad: p.cantidad,
        costoUnitario: p.costoUnitario,
        precioVentaUnitario: p.precioVentaUnitario,
        estado: p.estado as any,
      })),
      precioTotal: doc.precioTotal,
      adelanto: doc.adelanto,
      metodoAdelanto: doc.metodoAdelanto as any,
      saldo: doc.saldo,
      metodoSaldo: doc.metodoSaldo as any,
      estado: doc.estado as TicketStatus,
      historialEstados: (doc.historialEstados ?? []).map((h) => ({
        estado: h.estado as TicketStatus,
        fecha: h.fecha,
        usuarioId: h.usuarioId,
        usuarioEmail: h.usuarioEmail,
        nota: h.nota,
      })),
      auditoriaClave: (doc.auditoriaClave ?? []).map((a) => ({
        usuarioId: a.usuarioId,
        usuarioEmail: a.usuarioEmail,
        fecha: a.fecha,
      })),
      version: doc.version ?? 0,
      fechaIngreso: doc.fechaIngreso,
      fechaEntregaEstimada: doc.fechaEntregaEstimada,
      fechaEntregaReal: doc.fechaEntregaReal,
      createdAt: (doc as any).createdAt,
      updatedAt: (doc as any).updatedAt,
    });
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus } from '../../domain/ticket.entity';

export type TicketDocument = TicketMongo & Document;

@Schema({ _id: false })
export class TicketClientSnapshotMongo {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: false })
  clienteId?: Types.ObjectId;

  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: false })
  apellido?: string;

  @Prop({ required: true, index: true })
  telefono!: string;
}

@Schema({ _id: false })
export class TicketDeviceMongo {
  @Prop({ required: false })
  marcaId?: string;

  @Prop({ required: false })
  celularId?: string;

  @Prop({ required: false })
  marca?: string;

  @Prop({ required: false })
  modelo?: string;

  @Prop({ required: false })
  color?: string;

  @Prop({ required: false, index: true })
  imei?: string;

  @Prop({ required: true })
  fallaReportada!: string;

  @Prop({ required: false })
  estadoIngreso?: string;
}

@Schema({ _id: false })
export class DeviceKeyMongo {
  @Prop({ required: true, enum: ['ninguno', 'pin', 'contrasena', 'patron'] })
  tipo!: string;

  @Prop({ required: false })
  valor?: string; // Encrypted AES-256-GCM string
}

@Schema({ _id: false })
export class TicketPieceMongo {
  @Prop({ required: true })
  productoId!: string;

  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: false })
  categoria?: string;

  @Prop({ required: true, min: 1 })
  cantidad!: number;

  @Prop({ required: false, default: 0 })
  costoUnitario?: number;

  @Prop({ required: false, default: 0 })
  precioVentaUnitario?: number;

  @Prop({
    required: true,
    enum: ['planificada', 'descontada', 'devuelta'],
    default: 'planificada',
  })
  estado!: string;
}

@Schema({ _id: false })
export class TicketStatusEventMongo {
  @Prop({ required: true, enum: Object.values(TicketStatus) })
  estado!: string;

  @Prop({ required: true, default: Date.now })
  fecha!: Date;

  @Prop({ required: false })
  usuarioId?: string;

  @Prop({ required: false })
  usuarioEmail?: string;

  @Prop({ required: false })
  nota?: string;
}

@Schema({ _id: false })
export class DeviceKeyAuditEntryMongo {
  @Prop({ required: false })
  usuarioId?: string;

  @Prop({ required: false })
  usuarioEmail?: string;

  @Prop({ required: true, default: Date.now })
  fecha!: Date;
}

@Schema({ collection: 'tickets', timestamps: true })
export class TicketMongo {
  @Prop({ required: true, unique: true, index: true })
  codigo!: string; // AT-000148

  @Prop({ required: true, unique: true, index: true })
  publicToken!: string; // UUID v4

  @Prop({ required: true, type: TicketClientSnapshotMongo })
  cliente!: TicketClientSnapshotMongo;

  @Prop({ required: true, type: TicketDeviceMongo })
  equipo!: TicketDeviceMongo;

  @Prop({ required: false, type: DeviceKeyMongo })
  claveEquipo?: DeviceKeyMongo;

  @Prop({ required: true })
  titulo!: string;

  @Prop({ required: false })
  notaCliente?: string;

  @Prop({ type: [String], default: [] })
  notasInternas!: string[];

  @Prop({ required: false })
  tecnicoId?: string;

  @Prop({ required: false })
  tecnicoNombre?: string;

  @Prop({ type: [TicketPieceMongo], default: [] })
  piezas!: TicketPieceMongo[];

  @Prop({ required: true, default: 0 })
  precioTotal!: number;

  @Prop({ required: true, default: 0 })
  adelanto!: number;

  @Prop({ required: false, enum: ['efectivo', 'yape'] })
  metodoAdelanto?: 'efectivo' | 'yape';

  @Prop({ required: true, default: 0 })
  saldo!: number;

  @Prop({ required: false, enum: ['efectivo', 'yape'] })
  metodoSaldo?: 'efectivo' | 'yape';

  @Prop({
    required: true,
    enum: Object.values(TicketStatus),
    default: TicketStatus.PENDIENTE,
    index: true,
  })
  estado!: string;

  @Prop({ type: [TicketStatusEventMongo], default: [] })
  historialEstados!: TicketStatusEventMongo[];

  @Prop({ type: [DeviceKeyAuditEntryMongo], default: [] })
  auditoriaClave!: DeviceKeyAuditEntryMongo[];

  /** Optimistic concurrency counter; incremented by every `update()`. */
  @Prop({ required: true, default: 0 })
  version!: number;

  @Prop({ required: true, default: Date.now })
  fechaIngreso!: Date;

  @Prop({ required: false })
  fechaEntregaEstimada?: Date;

  @Prop({ required: false })
  fechaEntregaReal?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(TicketMongo);

// Compound text & lookup indexes
TicketSchema.index({
  codigo: 1,
  'cliente.telefono': 1,
  'cliente.nombre': 1,
  'equipo.modelo': 1,
  'equipo.imei': 1,
});
TicketSchema.index({ 'cliente.clienteId': 1, createdAt: -1 });
TicketSchema.index({ estado: 1, createdAt: -1 });

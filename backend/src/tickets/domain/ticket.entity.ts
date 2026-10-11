export enum TicketStatus {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  TRABAJANDO = 'trabajando',
  LISTO = 'listo',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
  ABANDONADO = 'abandonado',
}

export type DeviceKeyType = 'ninguno' | 'pin' | 'contrasena' | 'patron';

export interface DeviceKey {
  tipo: DeviceKeyType;
  valor?: string; // encrypted with AES-256-GCM when persisted
}

export type PieceStatus = 'planificada' | 'descontada' | 'devuelta';

export interface TicketPiece {
  productoId: string;
  nombre: string;
  categoria?: string;
  cantidad: number;
  costoUnitario?: number;
  precioVentaUnitario?: number;
  estado: PieceStatus;
}

export interface TicketStatusEvent {
  estado: TicketStatus;
  fecha: Date;
  usuarioId?: string;
  usuarioEmail?: string;
  nota?: string;
}

export interface DeviceKeyAuditEntry {
  usuarioId?: string;
  usuarioEmail?: string;
  fecha: Date;
}

export interface TicketClientSnapshot {
  clienteId?: string;
  nombre: string;
  apellido?: string;
  telefono: string;
}

export interface TicketDevice {
  marcaId?: string;
  celularId?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  imei?: string;
  fallaReportada: string;
  estadoIngreso?: string;
}

export interface TicketProps {
  id?: string;
  codigo: string; // e.g. "AT-000148"
  publicToken: string; // unguessable crypto UUID
  cliente: TicketClientSnapshot;
  equipo: TicketDevice;
  claveEquipo?: DeviceKey;
  titulo: string;
  notaCliente?: string;
  notasInternas?: string[];
  tecnicoId?: string;
  tecnicoNombre?: string;
  piezas: TicketPiece[];
  precioTotal: number;
  adelanto: number;
  metodoAdelanto?: 'efectivo' | 'yape';
  saldo: number;
  metodoSaldo?: 'efectivo' | 'yape';
  estado: TicketStatus;
  historialEstados: TicketStatusEvent[];
  auditoriaClave?: DeviceKeyAuditEntry[];
  /** Optimistic concurrency counter, incremented by the repository on every write. */
  version?: number;
  fechaIngreso: Date;
  fechaEntregaEstimada?: Date;
  fechaEntregaReal?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Ticket {
  readonly id?: string;
  readonly codigo: string;
  readonly publicToken: string;
  cliente: TicketClientSnapshot;
  equipo: TicketDevice;
  claveEquipo?: DeviceKey;
  titulo: string;
  notaCliente?: string;
  notasInternas: string[];
  tecnicoId?: string;
  tecnicoNombre?: string;
  piezas: TicketPiece[];
  precioTotal: number;
  adelanto: number;
  metodoAdelanto?: 'efectivo' | 'yape';
  saldo: number;
  metodoSaldo?: 'efectivo' | 'yape';
  estado: TicketStatus;
  historialEstados: TicketStatusEvent[];
  auditoriaClave: DeviceKeyAuditEntry[];
  version: number;
  readonly fechaIngreso: Date;
  fechaEntregaEstimada?: Date;
  fechaEntregaReal?: Date;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(props: TicketProps) {
    this.id = props.id;
    this.codigo = props.codigo;
    this.publicToken = props.publicToken;
    this.cliente = props.cliente;
    this.equipo = props.equipo;
    this.claveEquipo = props.claveEquipo;
    this.titulo = props.titulo;
    this.notaCliente = props.notaCliente;
    this.notasInternas = props.notasInternas ?? [];
    this.tecnicoId = props.tecnicoId;
    this.tecnicoNombre = props.tecnicoNombre;
    this.piezas = props.piezas ?? [];
    this.precioTotal = props.precioTotal;
    this.adelanto = props.adelanto;
    this.metodoAdelanto = props.metodoAdelanto;
    this.saldo = props.saldo;
    this.metodoSaldo = props.metodoSaldo;
    this.estado = props.estado;
    this.historialEstados = props.historialEstados ?? [];
    this.auditoriaClave = props.auditoriaClave ?? [];
    this.version = props.version ?? 0;
    this.fechaIngreso = props.fechaIngreso ?? new Date();
    this.fechaEntregaEstimada = props.fechaEntregaEstimada;
    this.fechaEntregaReal = props.fechaEntregaReal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}

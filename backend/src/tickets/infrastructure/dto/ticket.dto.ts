import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../../domain/ticket.entity';

export class TicketClientDto {
  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsNotEmpty()
  @IsString()
  telefono!: string;
}

export class TicketDeviceDto {
  @IsOptional()
  @IsString()
  marcaId?: string;

  @IsOptional()
  @IsString()
  celularId?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsNotEmpty()
  @IsString()
  fallaReportada!: string;

  @IsOptional()
  @IsString()
  estadoIngreso?: string;
}

export class DeviceKeyDto {
  @IsNotEmpty()
  @IsIn(['ninguno', 'pin', 'contrasena', 'patron'])
  tipo!: 'ninguno' | 'pin' | 'contrasena' | 'patron';

  // Full business validation (empty-value rule, patrón regex, no repeated
  // dots) lives in TicketUseCases.createTicket so it applies uniformly
  // whether this DTO or the use case is exercised directly (unit tests).
  @ValidateIf((o: DeviceKeyDto) => o.tipo !== 'ninguno')
  @IsNotEmpty({ message: 'Ingresa la clave del equipo' })
  @IsString()
  valor?: string;
}

export class TicketPieceInputDto {
  @IsNotEmpty()
  @IsString()
  productoId!: string;

  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoUnitario?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioVentaUnitario?: number;
}

export class CreateTicketDto {
  @ValidateNested()
  @Type(() => TicketClientDto)
  cliente!: TicketClientDto;

  @ValidateNested()
  @Type(() => TicketDeviceDto)
  equipo!: TicketDeviceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceKeyDto)
  claveEquipo?: DeviceKeyDto;

  @IsNotEmpty()
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  notaCliente?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notasInternas?: string[];

  @IsOptional()
  @IsString()
  tecnicoId?: string;

  @IsOptional()
  @IsString()
  tecnicoNombre?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketPieceInputDto)
  piezas?: TicketPieceInputDto[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  precioTotal!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  adelanto?: number;

  @IsOptional()
  @IsIn(['efectivo', 'yape'])
  metodoAdelanto?: 'efectivo' | 'yape';

  @IsOptional()
  @IsString()
  fechaEntregaEstimada?: string;
}

export class CobroDto {
  // The saldo amount is always computed by the server (precioTotal minus
  // every non-annulled cobro already tied to the ticket); any client-sent
  // `monto` is ignored by TicketUseCases.updateStatus. Kept optional only
  // for backwards compatibility with a client that still sends it.
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsNotEmpty()
  @IsIn(['efectivo', 'yape'])
  metodo!: 'efectivo' | 'yape';
}

export class UpdateTicketStatusDto {
  @IsNotEmpty()
  @IsEnum(TicketStatus)
  nuevoEstado!: TicketStatus;

  @IsOptional()
  @IsString()
  notaTecnica?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CobroDto)
  cobro?: CobroDto;
}

export class UpdateTicketDetailsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notasInternas?: string[];

  @IsOptional()
  @IsString()
  notaCliente?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  tecnicoId?: string;

  @IsOptional()
  @IsString()
  tecnicoNombre?: string;
}

export class UpdateTicketPiecesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketPieceInputDto)
  piezas!: TicketPieceInputDto[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  precioTotal!: number;
}

export class AvailabilityQueryDto {
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  celularId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  excludeTicketId?: string;
}

export class AnularCobroDto {
  @IsNotEmpty({ message: 'Ingresa el motivo de la anulación' })
  @IsString()
  motivo!: string;
}

export class ListTicketsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  estado?: TicketStatus;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsString()
  tecnicoId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

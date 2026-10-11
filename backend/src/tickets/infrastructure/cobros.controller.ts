import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CobroService } from '../application/cobro.service';
import { Roles } from '../../shared/infrastructure/roles.decorator';
import { CurrentAdmin } from '../../auth/infrastructure/current-admin.decorator';
import { SessionPayload } from '../../auth/infrastructure/session.types';
import { AnularCobroDto } from './dto/ticket.dto';

function toCobroView(c: {
  id?: string;
  _id?: unknown;
  origen: string;
  referenciaId: string;
  codigo: string;
  tipo: string;
  monto: number;
  metodo: string;
  fecha: Date;
  anulado: boolean;
  anuladoPor?: string;
  anuladoAt?: Date;
  motivoAnulacion?: string;
  descripcion?: string;
  items?: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    costoUnitario?: number;
  }>;
}) {
  return {
    id: c.id ?? (c._id as { toString(): string })?.toString(),
    origen: c.origen,
    referenciaId: c.referenciaId,
    codigo: c.codigo,
    tipo: c.tipo,
    monto: c.monto,
    metodo: c.metodo,
    fecha: c.fecha,
    anulado: c.anulado,
    anuladoPor: c.anuladoPor,
    anuladoAt: c.anuladoAt,
    motivoAnulacion: c.motivoAnulacion,
    descripcion: c.descripcion,
    items: c.items,
  };
}

@Controller('cobros')
export class CobrosController {
  constructor(private readonly cobroService: CobroService) {}

  @Get()
  async listByDate(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('referenciaId') referenciaId?: string,
  ) {
    if (referenciaId) {
      const items = await this.cobroService.listByReferencia(referenciaId);
      return items.map((i) => toCobroView(i as any));
    }

    const today = new Date().toISOString().slice(0, 10);
    const fromDate = from ?? today;
    const toDate = to ?? fromDate;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fromDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(toDate)
    ) {
      throw new BadRequestException('from/to deben tener formato YYYY-MM-DD');
    }

    const items = await this.cobroService.listByRange(fromDate, toDate);
    return items.map((i) => toCobroView(i as any));
  }

  @Post(':id/anular')
  @HttpCode(HttpStatus.OK)
  @Roles('owner')
  async anular(
    @Param('id') id: string,
    @Body() dto: AnularCobroDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    const cobro = await this.cobroService.anular(
      id,
      dto.motivo,
      session?.sub,
      session?.email,
    );
    return toCobroView(cobro as any);
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentAdmin } from '../../auth/infrastructure/current-admin.decorator';
import { SessionPayload } from '../../auth/infrastructure/session.types';
import { SalesService } from '../application/sales.service';
import { CreateSaleDto } from './dto/sales.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSale(
    @Body() dto: CreateSaleDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    const data = await this.salesService.createSale(dto, {
      usuarioId: session?.sub,
      usuarioEmail: session?.email,
    });
    return { ok: true, data };
  }
}

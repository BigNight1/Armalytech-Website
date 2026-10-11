import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TechnicianService } from '../application/technician.service';
import { Roles } from '../../shared/infrastructure/roles.decorator';

@Controller('technicians')
export class TechniciansController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Get()
  async list(@Query('all') all?: string) {
    const onlyActive = all !== 'true';
    return this.technicianService.list(onlyActive);
  }

  @Post()
  @Roles('owner')
  async create(@Body('nombre') nombre: string) {
    return this.technicianService.create(nombre);
  }

  @Patch(':id')
  @Roles('owner')
  async update(
    @Param('id') id: string,
    @Body('nombre') nombre?: string,
    @Body('activo') activo?: boolean,
  ) {
    const updated = await this.technicianService.update(id, { nombre, activo });
    if (!updated) {
      throw new NotFoundException('Técnico no encontrado');
    }
    return updated;
  }
}

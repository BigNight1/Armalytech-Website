import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ListBrandsUseCase } from '../application/brand/list-brands.use-case';
import { CreateBrandUseCase } from '../application/brand/create-brand.use-case';
import { UpdateBrandUseCase } from '../application/brand/update-brand.use-case';
import { DeleteBrandUseCase } from '../application/brand/delete-brand.use-case';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Controller('inventory/brands')
export class BrandController {
  constructor(
    private readonly listBrands: ListBrandsUseCase,
    private readonly createBrand: CreateBrandUseCase,
    private readonly updateBrand: UpdateBrandUseCase,
    private readonly deleteBrand: DeleteBrandUseCase,
  ) {}

  @Get()
  async list() {
    return { ok: true, data: await this.listBrands.execute() };
  }

  @Post()
  async create(@Body() dto: CreateBrandDto) {
    return { ok: true, data: await this.createBrand.execute(dto.name) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return { ok: true, data: await this.updateBrand.execute(id, dto.name) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteBrand.execute(id);
  }
}

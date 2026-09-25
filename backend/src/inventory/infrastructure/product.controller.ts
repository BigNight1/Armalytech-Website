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
  Query,
} from '@nestjs/common';
import { CurrentAdmin } from '../../auth/infrastructure/current-admin.decorator';
import { SessionPayload } from '../../auth/infrastructure/session.types';
import { ListProductsUseCase } from '../application/product/list-products.use-case';
import { GetProductUseCase } from '../application/product/get-product.use-case';
import { CreateProductUseCase } from '../application/product/create-product.use-case';
import { UpdateProductUseCase } from '../application/product/update-product.use-case';
import { ArchiveProductUseCase } from '../application/product/archive-product.use-case';
import { RestoreProductUseCase } from '../application/product/restore-product.use-case';
import { AdjustProductStockUseCase } from '../application/product/adjust-product-stock.use-case';
import { ListProductMovementsUseCase } from '../application/product/list-product-movements.use-case';
import {
  AdjustProductDto,
  CreateProductDto,
  ListProductsQueryDto,
  MovementsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

@Controller('inventory/products')
export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly archiveProduct: ArchiveProductUseCase,
    private readonly restoreProduct: RestoreProductUseCase,
    private readonly adjustProductStock: AdjustProductStockUseCase,
    private readonly listProductMovements: ListProductMovementsUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListProductsQueryDto) {
    const result = await this.listProducts.execute({
      q: query.q,
      categoryId: query.categoryId,
      phoneId: query.phoneId,
      lowStock: query.lowStock,
      includeArchived: query.includeArchived,
      page: query.page,
      limit: query.limit,
    });
    return {
      ok: true,
      data: {
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        matchedPhones: result.matchedPhones,
      },
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return { ok: true, data: await this.getProduct.execute(id) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateProductDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    return {
      ok: true,
      data: await this.createProduct.execute(dto, {
        userId: session.sub,
        userEmail: session.email,
      }),
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return { ok: true, data: await this.updateProduct.execute(id, dto) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.archiveProduct.execute(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string) {
    return { ok: true, data: await this.restoreProduct.execute(id) };
  }

  @Post(':id/adjust')
  @HttpCode(HttpStatus.OK)
  async adjust(
    @Param('id') id: string,
    @Body() dto: AdjustProductDto,
    @CurrentAdmin() session: SessionPayload,
  ) {
    return {
      ok: true,
      data: await this.adjustProductStock.execute(
        id,
        { delta: dto.delta, reason: dto.reason },
        { userId: session.sub, userEmail: session.email },
      ),
    };
  }

  @Get(':id/movements')
  async movements(@Param('id') id: string, @Query() query: MovementsQueryDto) {
    const result = await this.listProductMovements.execute(
      id,
      query.page,
      query.limit,
    );
    return {
      ok: true,
      data: {
        items: result.items,
        total: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    };
  }
}

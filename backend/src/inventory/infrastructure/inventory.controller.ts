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
import { ListBrandsUseCase } from '../application/brand/list-brands.use-case';
import { CreateBrandUseCase } from '../application/brand/create-brand.use-case';
import { UpdateBrandUseCase } from '../application/brand/update-brand.use-case';
import { DeleteBrandUseCase } from '../application/brand/delete-brand.use-case';
import { ListModelsUseCase } from '../application/model/list-models.use-case';
import { CreateModelUseCase } from '../application/model/create-model.use-case';
import { UpdateModelUseCase } from '../application/model/update-model.use-case';
import { DeleteModelUseCase } from '../application/model/delete-model.use-case';
import { ListPartsUseCase } from '../application/part/list-parts.use-case';
import { CreatePartUseCase } from '../application/part/create-part.use-case';
import { UpdatePartUseCase } from '../application/part/update-part.use-case';
import { DeletePartUseCase } from '../application/part/delete-part.use-case';
import { AdjustPartQuantityUseCase } from '../application/part/adjust-part-quantity.use-case';
import { SearchInventoryUseCase } from '../application/search-inventory.use-case';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';
import { AdjustPartDto, CreatePartDto, UpdatePartDto } from './dto/part.dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly listBrands: ListBrandsUseCase,
    private readonly createBrand: CreateBrandUseCase,
    private readonly updateBrand: UpdateBrandUseCase,
    private readonly deleteBrand: DeleteBrandUseCase,
    private readonly listModels: ListModelsUseCase,
    private readonly createModel: CreateModelUseCase,
    private readonly updateModel: UpdateModelUseCase,
    private readonly deleteModel: DeleteModelUseCase,
    private readonly listParts: ListPartsUseCase,
    private readonly createPart: CreatePartUseCase,
    private readonly updatePart: UpdatePartUseCase,
    private readonly deletePart: DeletePartUseCase,
    private readonly adjustPartQuantity: AdjustPartQuantityUseCase,
    private readonly searchInventory: SearchInventoryUseCase,
  ) {}

  @Get('brands')
  async getBrands() {
    return { ok: true, data: await this.listBrands.execute() };
  }

  @Post('brands')
  async postBrand(@Body() dto: CreateBrandDto) {
    return { ok: true, data: await this.createBrand.execute(dto.name) };
  }

  @Patch('brands/:id')
  async patchBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return { ok: true, data: await this.updateBrand.execute(id, dto.name) };
  }

  @Delete('brands/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBrand(@Param('id') id: string): Promise<void> {
    await this.deleteBrand.execute(id);
  }

  @Get('brands/:brandId/models')
  async getModels(@Param('brandId') brandId: string) {
    return { ok: true, data: await this.listModels.execute(brandId) };
  }

  @Post('brands/:brandId/models')
  async postModel(
    @Param('brandId') brandId: string,
    @Body() dto: CreateModelDto,
  ) {
    return {
      ok: true,
      data: await this.createModel.execute(brandId, dto.name),
    };
  }

  @Patch('models/:id')
  async patchModel(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return { ok: true, data: await this.updateModel.execute(id, dto.name) };
  }

  @Delete('models/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeModel(@Param('id') id: string): Promise<void> {
    await this.deleteModel.execute(id);
  }

  @Get('models/:modelId/parts')
  async getParts(@Param('modelId') modelId: string) {
    return { ok: true, data: await this.listParts.execute(modelId) };
  }

  @Post('models/:modelId/parts')
  async postPart(
    @Param('modelId') modelId: string,
    @Body() dto: CreatePartDto,
  ) {
    return { ok: true, data: await this.createPart.execute(modelId, dto) };
  }

  @Patch('parts/:id')
  async patchPart(@Param('id') id: string, @Body() dto: UpdatePartDto) {
    return { ok: true, data: await this.updatePart.execute(id, dto) };
  }

  @Delete('parts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePart(@Param('id') id: string): Promise<void> {
    await this.deletePart.execute(id);
  }

  @Post('parts/:id/adjust')
  @HttpCode(HttpStatus.OK)
  async adjustPart(@Param('id') id: string, @Body() dto: AdjustPartDto) {
    return {
      ok: true,
      data: await this.adjustPartQuantity.execute(id, dto.delta),
    };
  }

  @Get('search')
  async search(@Query('q') q: string | undefined) {
    return { ok: true, data: await this.searchInventory.execute(q ?? '') };
  }
}

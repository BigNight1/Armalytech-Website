import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandModel, BrandSchema } from './infrastructure/schemas/brand.schema';
import {
  InventoryModelSchema,
  InventoryModelSchemaClass,
} from './infrastructure/schemas/model.schema';
import { PartModel, PartSchema } from './infrastructure/schemas/part.schema';
import { MongooseBrandRepository } from './infrastructure/brand.repository';
import { MongooseModelRepository } from './infrastructure/model.repository';
import { MongoosePartRepository } from './infrastructure/part.repository';
import { InventoryController } from './infrastructure/inventory.controller';
import { BRAND_REPOSITORY } from './domain/brand-repository.port';
import { MODEL_REPOSITORY } from './domain/model-repository.port';
import { PART_REPOSITORY } from './domain/part-repository.port';
import { ListBrandsUseCase } from './application/brand/list-brands.use-case';
import { CreateBrandUseCase } from './application/brand/create-brand.use-case';
import { UpdateBrandUseCase } from './application/brand/update-brand.use-case';
import { DeleteBrandUseCase } from './application/brand/delete-brand.use-case';
import { ListModelsUseCase } from './application/model/list-models.use-case';
import { CreateModelUseCase } from './application/model/create-model.use-case';
import { UpdateModelUseCase } from './application/model/update-model.use-case';
import { DeleteModelUseCase } from './application/model/delete-model.use-case';
import { ListPartsUseCase } from './application/part/list-parts.use-case';
import { CreatePartUseCase } from './application/part/create-part.use-case';
import { UpdatePartUseCase } from './application/part/update-part.use-case';
import { DeletePartUseCase } from './application/part/delete-part.use-case';
import { AdjustPartQuantityUseCase } from './application/part/adjust-part-quantity.use-case';
import { SearchInventoryUseCase } from './application/search-inventory.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BrandModel.name, schema: BrandSchema },
      { name: InventoryModelSchemaClass.name, schema: InventoryModelSchema },
      { name: PartModel.name, schema: PartSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    { provide: BRAND_REPOSITORY, useClass: MongooseBrandRepository },
    { provide: MODEL_REPOSITORY, useClass: MongooseModelRepository },
    { provide: PART_REPOSITORY, useClass: MongoosePartRepository },
    ListBrandsUseCase,
    CreateBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase,
    ListModelsUseCase,
    CreateModelUseCase,
    UpdateModelUseCase,
    DeleteModelUseCase,
    ListPartsUseCase,
    CreatePartUseCase,
    UpdatePartUseCase,
    DeletePartUseCase,
    AdjustPartQuantityUseCase,
    SearchInventoryUseCase,
  ],
})
export class InventoryModule {}

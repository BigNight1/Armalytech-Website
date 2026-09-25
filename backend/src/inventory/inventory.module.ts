import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandModel, BrandSchema } from './infrastructure/schemas/brand.schema';
import { PhoneModel, PhoneSchema } from './infrastructure/schemas/phone.schema';
import {
  CategoryModel,
  CategorySchema,
} from './infrastructure/schemas/category.schema';
import {
  ProductModel,
  ProductSchema,
} from './infrastructure/schemas/product.schema';
import {
  StockMovementModel,
  StockMovementSchema,
} from './infrastructure/schemas/stock-movement.schema';
import { MongooseBrandRepository } from './infrastructure/brand.repository';
import { MongoosePhoneRepository } from './infrastructure/phone.repository';
import { MongooseCategoryRepository } from './infrastructure/category.repository';
import { MongooseProductRepository } from './infrastructure/product.repository';
import { MongooseStockMovementRepository } from './infrastructure/stock-movement.repository';
import { BrandController } from './infrastructure/brand.controller';
import { PhoneController } from './infrastructure/phone.controller';
import { CategoryController } from './infrastructure/category.controller';
import { ProductController } from './infrastructure/product.controller';
import { BRAND_REPOSITORY } from './domain/brand-repository.port';
import { PHONE_REPOSITORY } from './domain/phone-repository.port';
import { CATEGORY_REPOSITORY } from './domain/category-repository.port';
import { PRODUCT_REPOSITORY } from './domain/product-repository.port';
import { STOCK_MOVEMENT_REPOSITORY } from './domain/stock-movement-repository.port';
import { ListBrandsUseCase } from './application/brand/list-brands.use-case';
import { CreateBrandUseCase } from './application/brand/create-brand.use-case';
import { UpdateBrandUseCase } from './application/brand/update-brand.use-case';
import { DeleteBrandUseCase } from './application/brand/delete-brand.use-case';
import { ListPhonesUseCase } from './application/phone/list-phones.use-case';
import { CreatePhoneUseCase } from './application/phone/create-phone.use-case';
import { UpdatePhoneUseCase } from './application/phone/update-phone.use-case';
import { DeletePhoneUseCase } from './application/phone/delete-phone.use-case';
import { ListCategoriesUseCase } from './application/category/list-categories.use-case';
import { CreateCategoryUseCase } from './application/category/create-category.use-case';
import { UpdateCategoryUseCase } from './application/category/update-category.use-case';
import { DeleteCategoryUseCase } from './application/category/delete-category.use-case';
import { SeedDefaultCategoriesUseCase } from './application/category/seed-default-categories.use-case';
import { ListProductsUseCase } from './application/product/list-products.use-case';
import { GetProductUseCase } from './application/product/get-product.use-case';
import { CreateProductUseCase } from './application/product/create-product.use-case';
import { UpdateProductUseCase } from './application/product/update-product.use-case';
import { ArchiveProductUseCase } from './application/product/archive-product.use-case';
import { RestoreProductUseCase } from './application/product/restore-product.use-case';
import { AdjustProductStockUseCase } from './application/product/adjust-product-stock.use-case';
import { ListProductMovementsUseCase } from './application/product/list-product-movements.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BrandModel.name, schema: BrandSchema },
      { name: PhoneModel.name, schema: PhoneSchema },
      { name: CategoryModel.name, schema: CategorySchema },
      { name: ProductModel.name, schema: ProductSchema },
      { name: StockMovementModel.name, schema: StockMovementSchema },
    ]),
  ],
  controllers: [
    BrandController,
    PhoneController,
    CategoryController,
    ProductController,
  ],
  providers: [
    { provide: BRAND_REPOSITORY, useClass: MongooseBrandRepository },
    { provide: PHONE_REPOSITORY, useClass: MongoosePhoneRepository },
    { provide: CATEGORY_REPOSITORY, useClass: MongooseCategoryRepository },
    { provide: PRODUCT_REPOSITORY, useClass: MongooseProductRepository },
    {
      provide: STOCK_MOVEMENT_REPOSITORY,
      useClass: MongooseStockMovementRepository,
    },
    ListBrandsUseCase,
    CreateBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase,
    ListPhonesUseCase,
    CreatePhoneUseCase,
    UpdatePhoneUseCase,
    DeletePhoneUseCase,
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    SeedDefaultCategoriesUseCase,
    ListProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    ArchiveProductUseCase,
    RestoreProductUseCase,
    AdjustProductStockUseCase,
    ListProductMovementsUseCase,
  ],
})
export class InventoryModule implements OnApplicationBootstrap {
  constructor(
    private readonly seedDefaultCategories: SeedDefaultCategoriesUseCase,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedDefaultCategories.execute();
  }
}

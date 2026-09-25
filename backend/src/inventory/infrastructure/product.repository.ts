import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PhoneWithBrand } from '../domain/phone.entity';
import { Product } from '../domain/product.entity';
import {
  CreateProductInput,
  ProductListFilter,
  ProductListResult,
  ProductRepository,
  UpdateProductInput,
} from '../domain/product-repository.port';
import { ProductDocument, ProductModel } from './schemas/product.schema';
import { CategoryDocument, CategoryModel } from './schemas/category.schema';
import { BrandDocument, BrandModel } from './schemas/brand.schema';
import { PhoneDocument, PhoneModel } from './schemas/phone.schema';

@Injectable()
export class MongooseProductRepository implements ProductRepository {
  constructor(
    @InjectModel(ProductModel.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(CategoryModel.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(BrandModel.name)
    private readonly brandModel: Model<BrandDocument>,
    @InjectModel(PhoneModel.name)
    private readonly phoneModel: Model<PhoneDocument>,
  ) {}

  async list(filter: ProductListFilter): Promise<ProductListResult> {
    const and: Record<string, unknown>[] = [];

    let matchedPhones: PhoneWithBrand[] = [];
    if (filter.q && filter.q.trim()) {
      const escaped = filter.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      const matchingPhoneDocs = await this.phoneModel
        .find({ name: regex })
        .exec();
      const matchingBrandDocs = await this.brandModel
        .find({ name: regex })
        .exec();
      matchedPhones = await this.toPhonesWithBrand(matchingPhoneDocs);

      const or: Record<string, unknown>[] = [{ name: regex }, { model: regex }];
      if (matchingBrandDocs.length > 0) {
        or.push({ brandId: { $in: matchingBrandDocs.map((b) => b._id) } });
      }
      if (matchingPhoneDocs.length > 0) {
        or.push({
          compatiblePhoneIds: { $in: matchingPhoneDocs.map((p) => p._id) },
        });
      }
      and.push({ $or: or });
    }

    if (filter.categoryId && Types.ObjectId.isValid(filter.categoryId)) {
      and.push({ categoryId: new Types.ObjectId(filter.categoryId) });
    }
    if (filter.phoneId && Types.ObjectId.isValid(filter.phoneId)) {
      and.push({ compatiblePhoneIds: new Types.ObjectId(filter.phoneId) });
    }
    if (filter.lowStock) {
      and.push({ $expr: { $lte: ['$stock', '$minStock'] } });
    }
    if (!filter.includeArchived) {
      and.push({ active: true });
    }

    const mongoFilter = and.length > 0 ? { $and: and } : {};

    const [docs, total] = await Promise.all([
      this.productModel
        .find(mongoFilter)
        .sort({ name: 1 })
        .skip((filter.page - 1) * filter.limit)
        .limit(filter.limit)
        .exec(),
      this.productModel.countDocuments(mongoFilter).exec(),
    ]);

    return {
      items: await this.toViews(docs),
      total,
      page: filter.page,
      limit: filter.limit,
      matchedPhones,
    };
  }

  async findById(id: string): Promise<Product | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.productModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    const [view] = await this.toViews([doc]);
    return view;
  }

  async existsByCategory(categoryId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(categoryId)) {
      return false;
    }
    return (
      (await this.productModel
        .exists({ categoryId: new Types.ObjectId(categoryId) })
        .exec()) !== null
    );
  }

  async existsByBrand(brandId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(brandId)) {
      return false;
    }
    return (
      (await this.productModel
        .exists({ brandId: new Types.ObjectId(brandId) })
        .exec()) !== null
    );
  }

  async existsByCompatiblePhone(phoneId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(phoneId)) {
      return false;
    }
    return (
      (await this.productModel
        .exists({ compatiblePhoneIds: new Types.ObjectId(phoneId) })
        .exec()) !== null
    );
  }

  async create(input: CreateProductInput): Promise<Product> {
    const doc = await this.productModel.create({
      categoryId: new Types.ObjectId(input.categoryId),
      brandId: input.brandId ? new Types.ObjectId(input.brandId) : null,
      name: input.name,
      model: input.model,
      stock: input.stock,
      cost: input.cost,
      salePrice: input.salePrice,
      minStock: input.minStock,
      compatiblePhoneIds: input.compatiblePhoneIds.map(
        (id) => new Types.ObjectId(id),
      ),
      active: true,
    });
    const [view] = await this.toViews([doc]);
    return view;
  }

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const set: Record<string, unknown> = {};
    if (input.categoryId !== undefined) {
      set.categoryId = new Types.ObjectId(input.categoryId);
    }
    if (input.brandId !== undefined) {
      set.brandId = new Types.ObjectId(input.brandId);
    }
    if (input.name !== undefined) set.name = input.name;
    if (input.model !== undefined) set.model = input.model;
    if (input.minStock !== undefined) set.minStock = input.minStock;
    if (input.cost !== undefined) set.cost = input.cost;
    if (input.salePrice !== undefined) set.salePrice = input.salePrice;
    if (input.compatiblePhoneIds !== undefined) {
      set.compatiblePhoneIds = input.compatiblePhoneIds.map(
        (phoneId) => new Types.ObjectId(phoneId),
      );
    }

    const doc = await this.productModel
      .findByIdAndUpdate(id, { $set: set }, { new: true })
      .exec();
    if (!doc) {
      return null;
    }
    const [view] = await this.toViews([doc]);
    return view;
  }

  async setActive(id: string, active: boolean): Promise<Product | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.productModel
      .findByIdAndUpdate(id, { $set: { active } }, { new: true })
      .exec();
    if (!doc) {
      return null;
    }
    const [view] = await this.toViews([doc]);
    return view;
  }

  async adjustStock(
    id: string,
    delta: number,
  ): Promise<Product | null | undefined> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const filter: Record<string, unknown> = { _id: id };
    if (delta < 0) {
      filter.stock = { $gte: -delta };
    }

    const doc = await this.productModel
      .findOneAndUpdate(filter, { $inc: { stock: delta } }, { new: true })
      .exec();

    if (doc) {
      const [view] = await this.toViews([doc]);
      return view;
    }

    const exists = await this.productModel.exists({ _id: id }).exec();
    return exists ? undefined : null;
  }

  /** Batch-resolves category/brand/compatiblePhones for a page of products in a few round-trips. */
  private async toViews(docs: ProductDocument[]): Promise<Product[]> {
    if (docs.length === 0) {
      return [];
    }

    const categoryIds = [...new Set(docs.map((d) => d.categoryId.toString()))];
    const brandIds = [
      ...new Set(
        docs
          .map((d) => d.brandId?.toString())
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const phoneIds = [
      ...new Set(
        docs.flatMap((d) => d.compatiblePhoneIds.map((p) => p.toString())),
      ),
    ];

    const [categories, brands, phones] = await Promise.all([
      this.categoryModel.find({ _id: { $in: categoryIds } }).exec(),
      brandIds.length > 0
        ? this.brandModel.find({ _id: { $in: brandIds } }).exec()
        : Promise.resolve([]),
      phoneIds.length > 0
        ? this.phoneModel.find({ _id: { $in: phoneIds } }).exec()
        : Promise.resolve([]),
    ]);

    const phoneBrandIds = [...new Set(phones.map((p) => p.brandId.toString()))];
    const phoneBrands =
      phoneBrandIds.length > 0
        ? await this.brandModel.find({ _id: { $in: phoneBrandIds } }).exec()
        : [];

    const categoryById = new Map(categories.map((c) => [c._id.toString(), c]));
    const brandById = new Map(brands.map((b) => [b._id.toString(), b]));
    const phoneBrandNameById = new Map(
      phoneBrands.map((b) => [b._id.toString(), b.name]),
    );
    const phoneById = new Map(
      phones.map((p) => [
        p._id.toString(),
        {
          id: p._id.toString(),
          name: p.name,
          brandName: phoneBrandNameById.get(p.brandId.toString()) ?? '',
        },
      ]),
    );

    return docs.map((doc) => {
      const category = categoryById.get(doc.categoryId.toString());
      const brand = doc.brandId
        ? brandById.get(doc.brandId.toString())
        : undefined;
      return {
        id: doc._id.toString(),
        category: category
          ? { id: category._id.toString(), name: category.name }
          : { id: doc.categoryId.toString(), name: '' },
        brand: doc.brandId
          ? { id: doc.brandId.toString(), name: brand?.name ?? '' }
          : null,
        name: doc.name,
        model: doc.model,
        stock: doc.stock,
        cost: doc.cost,
        salePrice: doc.salePrice,
        minStock: doc.minStock,
        compatiblePhones: doc.compatiblePhoneIds
          .map((id) => phoneById.get(id.toString()))
          .filter((p): p is NonNullable<typeof p> => Boolean(p)),
        active: doc.active,
        createdAt: (doc as unknown as { createdAt: Date }).createdAt,
        updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt,
      };
    });
  }

  private async toPhonesWithBrand(
    docs: PhoneDocument[],
  ): Promise<PhoneWithBrand[]> {
    if (docs.length === 0) {
      return [];
    }
    const brandIds = [...new Set(docs.map((d) => d.brandId.toString()))];
    const brands = await this.brandModel
      .find({ _id: { $in: brandIds } })
      .exec();
    const brandNameById = new Map(
      brands.map((b) => [b._id.toString(), b.name]),
    );
    return docs.map((doc) => ({
      id: doc._id.toString(),
      brandId: doc.brandId.toString(),
      name: doc.name,
      brandName: brandNameById.get(doc.brandId.toString()) ?? '',
    }));
  }
}

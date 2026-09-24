import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Part, PartSearchResult } from '../domain/part.entity';
import {
  CreatePartInput,
  PartRepository,
  UpdatePartInput,
} from '../domain/part-repository.port';
import { PartDocument, PartModel } from './schemas/part.schema';
import {
  InventoryModelDocument,
  InventoryModelSchemaClass,
} from './schemas/model.schema';
import { BrandDocument, BrandModel } from './schemas/brand.schema';

@Injectable()
export class MongoosePartRepository implements PartRepository {
  constructor(
    @InjectModel(PartModel.name)
    private readonly partModel: Model<PartDocument>,
    @InjectModel(InventoryModelSchemaClass.name)
    private readonly modelModel: Model<InventoryModelDocument>,
    @InjectModel(BrandModel.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  async findByModel(modelId: string): Promise<Part[]> {
    if (!Types.ObjectId.isValid(modelId)) {
      return [];
    }
    const docs = await this.partModel
      .find({ modelId: new Types.ObjectId(modelId) })
      .sort({ name: 1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<Part | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.partModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(modelId: string, input: CreatePartInput): Promise<Part> {
    const doc = await this.partModel.create({
      modelId: new Types.ObjectId(modelId),
      name: input.name,
      quantity: input.quantity,
      purchasePrice: input.purchasePrice,
      salePrice: input.salePrice,
    });
    return this.toEntity(doc);
  }

  async update(id: string, input: UpdatePartInput): Promise<Part | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const set: Record<string, unknown> = {};
    if (input.name !== undefined) set.name = input.name;
    if (input.quantity !== undefined) set.quantity = input.quantity;
    if (input.purchasePrice !== undefined)
      set.purchasePrice = input.purchasePrice;
    if (input.salePrice !== undefined) set.salePrice = input.salePrice;

    const doc = await this.partModel
      .findByIdAndUpdate(id, { $set: set }, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await this.partModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async adjustQuantity(
    id: string,
    delta: number,
  ): Promise<Part | null | undefined> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const filter: Record<string, unknown> = { _id: id };
    if (delta < 0) {
      filter.quantity = { $gte: -delta };
    }

    const doc = await this.partModel
      .findOneAndUpdate(filter, { $inc: { quantity: delta } }, { new: true })
      .exec();

    if (doc) {
      return this.toEntity(doc);
    }

    const exists = await this.partModel.exists({ _id: id }).exec();
    return exists ? undefined : null;
  }

  async search(query: string): Promise<PartSearchResult[]> {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const matchingBrands = await this.brandModel.find({ name: regex }).exec();
    const matchingModels = await this.modelModel.find({ name: regex }).exec();

    const brandIds = matchingBrands.map((b) => b._id);
    const modelIdsFromBrands =
      brandIds.length > 0
        ? await this.modelModel.find({ brandId: { $in: brandIds } }).exec()
        : [];

    const relevantModelIds = new Set<string>([
      ...matchingModels.map((m) => m._id.toString()),
      ...modelIdsFromBrands.map((m) => m._id.toString()),
    ]);

    const parts = await this.partModel
      .find({
        $or: [
          { name: regex },
          {
            modelId: {
              $in: [...relevantModelIds].map((id) => new Types.ObjectId(id)),
            },
          },
        ],
      })
      .sort({ name: 1 })
      .exec();

    if (parts.length === 0) {
      return [];
    }

    const involvedModelIds = new Set(parts.map((p) => p.modelId.toString()));
    const involvedModels = await this.modelModel
      .find({
        _id: { $in: [...involvedModelIds].map((id) => new Types.ObjectId(id)) },
      })
      .exec();
    const modelById = new Map(involvedModels.map((m) => [m._id.toString(), m]));

    const involvedBrandIds = new Set(
      involvedModels.map((m) => m.brandId.toString()),
    );
    const involvedBrands = await this.brandModel
      .find({
        _id: { $in: [...involvedBrandIds].map((id) => new Types.ObjectId(id)) },
      })
      .exec();
    const brandById = new Map(involvedBrands.map((b) => [b._id.toString(), b]));

    return parts.map((part) => {
      const model = modelById.get(part.modelId.toString());
      const brand = model ? brandById.get(model.brandId.toString()) : undefined;
      return {
        ...this.toEntity(part),
        modelName: model?.name ?? '',
        brandName: brand?.name ?? '',
      };
    });
  }

  private toEntity(doc: PartDocument): Part {
    return {
      id: doc._id.toString(),
      modelId: doc.modelId.toString(),
      name: doc.name,
      quantity: doc.quantity,
      purchasePrice: doc.purchasePrice,
      salePrice: doc.salePrice,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand } from '../domain/brand.entity';
import { BrandRepository } from '../domain/brand-repository.port';
import { BrandDocument, BrandModel } from './schemas/brand.schema';
import {
  InventoryModelDocument,
  InventoryModelSchemaClass,
} from './schemas/model.schema';
import { PartDocument, PartModel } from './schemas/part.schema';

@Injectable()
export class MongooseBrandRepository implements BrandRepository {
  constructor(
    @InjectModel(BrandModel.name)
    private readonly brandModel: Model<BrandDocument>,
    @InjectModel(InventoryModelSchemaClass.name)
    private readonly modelModel: Model<InventoryModelDocument>,
    @InjectModel(PartModel.name)
    private readonly partModel: Model<PartDocument>,
  ) {}

  async findAll(): Promise<Brand[]> {
    const docs = await this.brandModel.find().sort({ name: 1 }).exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<Brand | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.brandModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByNameCaseInsensitive(name: string): Promise<Brand | null> {
    const doc = await this.brandModel
      .findOne({ nameLower: name.trim().toLowerCase() })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(name: string): Promise<Brand> {
    const doc = await this.brandModel.create({
      name,
      nameLower: name.toLowerCase(),
    });
    return this.toEntity(doc);
  }

  async update(id: string, name: string): Promise<Brand | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.brandModel
      .findByIdAndUpdate(
        id,
        { name, nameLower: name.toLowerCase() },
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async deleteCascade(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const brandId = new Types.ObjectId(id);
    const models = await this.modelModel.find({ brandId }).select('_id').exec();
    const modelIds = models.map((m) => m._id);

    if (modelIds.length > 0) {
      await this.partModel.deleteMany({ modelId: { $in: modelIds } }).exec();
      await this.modelModel.deleteMany({ brandId }).exec();
    }

    const result = await this.brandModel.deleteOne({ _id: brandId }).exec();
    return result.deletedCount > 0;
  }

  private toEntity(doc: BrandDocument): Brand {
    return { id: doc._id.toString(), name: doc.name };
  }
}

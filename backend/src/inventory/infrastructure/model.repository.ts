import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InventoryModel } from '../domain/model.entity';
import { ModelRepository } from '../domain/model-repository.port';
import {
  InventoryModelDocument,
  InventoryModelSchemaClass,
} from './schemas/model.schema';
import { PartDocument, PartModel } from './schemas/part.schema';

@Injectable()
export class MongooseModelRepository implements ModelRepository {
  constructor(
    @InjectModel(InventoryModelSchemaClass.name)
    private readonly modelModel: Model<InventoryModelDocument>,
    @InjectModel(PartModel.name)
    private readonly partModel: Model<PartDocument>,
  ) {}

  async findByBrand(brandId: string): Promise<InventoryModel[]> {
    if (!Types.ObjectId.isValid(brandId)) {
      return [];
    }
    const docs = await this.modelModel
      .find({ brandId: new Types.ObjectId(brandId) })
      .sort({ name: 1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<InventoryModel | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.modelModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(brandId: string, name: string): Promise<InventoryModel> {
    const doc = await this.modelModel.create({
      brandId: new Types.ObjectId(brandId),
      name,
    });
    return this.toEntity(doc);
  }

  async update(id: string, name: string): Promise<InventoryModel | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.modelModel
      .findByIdAndUpdate(id, { name }, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async deleteCascade(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const modelId = new Types.ObjectId(id);
    await this.partModel.deleteMany({ modelId }).exec();
    const result = await this.modelModel.deleteOne({ _id: modelId }).exec();
    return result.deletedCount > 0;
  }

  private toEntity(doc: InventoryModelDocument): InventoryModel {
    return {
      id: doc._id.toString(),
      brandId: doc.brandId.toString(),
      name: doc.name,
    };
  }
}

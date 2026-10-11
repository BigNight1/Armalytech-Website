import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand } from '../domain/brand.entity';
import { BrandRepository } from '../domain/brand-repository.port';
import { BrandDocument, BrandModel } from './schemas/brand.schema';

@Injectable()
export class MongooseBrandRepository implements BrandRepository {
  constructor(
    @InjectModel(BrandModel.name)
    private readonly brandModel: Model<BrandDocument>,
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

  async findByIds(ids: string[]): Promise<Brand[]> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return [];
    }
    const docs = await this.brandModel.find({ _id: { $in: validIds } }).exec();
    return docs.map((doc) => this.toEntity(doc));
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

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await this.brandModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  private toEntity(doc: BrandDocument): Brand {
    return { id: doc._id.toString(), name: doc.name };
  }
}

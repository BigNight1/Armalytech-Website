import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Phone, PhoneWithBrand } from '../domain/phone.entity';
import {
  PhoneRepository,
  UpdatePhoneInput,
} from '../domain/phone-repository.port';
import { PhoneDocument, PhoneModel } from './schemas/phone.schema';
import { BrandDocument, BrandModel } from './schemas/brand.schema';

@Injectable()
export class MongoosePhoneRepository implements PhoneRepository {
  constructor(
    @InjectModel(PhoneModel.name)
    private readonly phoneModel: Model<PhoneDocument>,
    @InjectModel(BrandModel.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  async findAll(brandId?: string): Promise<Phone[]> {
    const filter: Record<string, unknown> = {};
    if (brandId) {
      if (!Types.ObjectId.isValid(brandId)) {
        return [];
      }
      filter.brandId = new Types.ObjectId(brandId);
    }
    const docs = await this.phoneModel.find(filter).sort({ name: 1 }).exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<Phone | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.phoneModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByIds(ids: string[]): Promise<Phone[]> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return [];
    }
    const docs = await this.phoneModel.find({ _id: { $in: validIds } }).exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByBrandAndNameCaseInsensitive(
    brandId: string,
    name: string,
  ): Promise<Phone | null> {
    if (!Types.ObjectId.isValid(brandId)) {
      return null;
    }
    const doc = await this.phoneModel
      .findOne({
        brandId: new Types.ObjectId(brandId),
        nameLower: name.trim().toLowerCase(),
      })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async searchByNameWithBrand(query: string): Promise<PhoneWithBrand[]> {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const docs = await this.phoneModel
      .find({ name: regex })
      .sort({ name: 1 })
      .exec();
    return this.withBrandNames(docs);
  }

  async findByIdsWithBrand(ids: string[]): Promise<PhoneWithBrand[]> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return [];
    }
    const docs = await this.phoneModel.find({ _id: { $in: validIds } }).exec();
    return this.withBrandNames(docs);
  }

  async create(brandId: string, name: string): Promise<Phone> {
    const doc = await this.phoneModel.create({
      brandId: new Types.ObjectId(brandId),
      name,
      nameLower: name.toLowerCase(),
    });
    return this.toEntity(doc);
  }

  async update(id: string, input: UpdatePhoneInput): Promise<Phone | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const set: Record<string, unknown> = {};
    if (input.brandId !== undefined) {
      set.brandId = new Types.ObjectId(input.brandId);
    }
    if (input.name !== undefined) {
      set.name = input.name;
      set.nameLower = input.name.toLowerCase();
    }
    const doc = await this.phoneModel
      .findByIdAndUpdate(id, { $set: set }, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await this.phoneModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  private async withBrandNames(
    docs: PhoneDocument[],
  ): Promise<PhoneWithBrand[]> {
    if (docs.length === 0) {
      return [];
    }
    const brandIds = [...new Set(docs.map((doc) => doc.brandId.toString()))];
    const brands = await this.brandModel
      .find({ _id: { $in: brandIds } })
      .exec();
    const brandById = new Map(brands.map((b) => [b._id.toString(), b.name]));
    return docs.map((doc) => ({
      ...this.toEntity(doc),
      brandName: brandById.get(doc.brandId.toString()) ?? '',
    }));
  }

  private toEntity(doc: PhoneDocument): Phone {
    return {
      id: doc._id.toString(),
      brandId: doc.brandId.toString(),
      name: doc.name,
    };
  }
}

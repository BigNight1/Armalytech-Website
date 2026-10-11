import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from '../domain/category.entity';
import { CategoryRepository } from '../domain/category-repository.port';
import { CategoryDocument, CategoryModel } from './schemas/category.schema';

@Injectable()
export class MongooseCategoryRepository implements CategoryRepository {
  constructor(
    @InjectModel(CategoryModel.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(): Promise<Category[]> {
    const docs = await this.categoryModel.find().sort({ name: 1 }).exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<Category | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.categoryModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByNameCaseInsensitive(name: string): Promise<Category | null> {
    const doc = await this.categoryModel
      .findOne({ nameLower: name.trim().toLowerCase() })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(name: string): Promise<Category> {
    const doc = await this.categoryModel.create({
      name,
      nameLower: name.toLowerCase(),
    });
    return this.toEntity(doc);
  }

  async update(id: string, name: string): Promise<Category | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.categoryModel
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
    const result = await this.categoryModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async count(): Promise<number> {
    return this.categoryModel.countDocuments().exec();
  }

  private toEntity(doc: CategoryDocument): Category {
    return { id: doc._id.toString(), name: doc.name };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin } from '../domain/admin.entity';
import { AdminRepository } from '../domain/admin-repository.port';
import { AdminDocument, AdminModel } from './schemas/admin.schema';

@Injectable()
export class MongooseAdminRepository implements AdminRepository {
  constructor(
    @InjectModel(AdminModel.name) private readonly model: Model<AdminDocument>,
  ) {}

  async count(): Promise<number> {
    return this.model.estimatedDocumentCount();
  }

  async create(username: string, passwordHash: string): Promise<Admin> {
    const doc = await this.model.create({ username, passwordHash });
    return this.toEntity(doc);
  }

  async findByUsername(username: string): Promise<Admin | null> {
    const doc = await this.model.findOne({ username }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findById(id: string): Promise<Admin | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  private toEntity(doc: AdminDocument): Admin {
    return {
      id: doc._id.toString(),
      username: doc.username,
      passwordHash: doc.passwordHash,
      createdAt: doc.createdAt ?? new Date(),
    };
  }
}

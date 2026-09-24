import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../domain/user.entity';
import {
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
} from '../domain/user-repository.port';
import { UserDocument, UserModel } from './schemas/user.schema';
import { Admin } from '../domain/admin.entity';
import { AdminRepository } from '../domain/admin-repository.port';

@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserModel.name) private readonly model: Model<UserDocument>,
  ) {}

  async count(): Promise<number> {
    return this.model.countDocuments();
  }

  async countActiveOwners(): Promise<number> {
    return this.model.countDocuments({ role: 'owner', active: true });
  }

  async findAll(): Promise<User[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    // Allow matching either exact email or prefix (e.g. 'armalytech' matching 'armalytech@armalytech.com')
    const doc = await this.model
      .findOne({
        $or: [
          { email: normalized },
          { email: `${normalized}@armalytech.com` },
        ],
      })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.model.findById(id).exec();
      return doc ? this.toEntity(doc) : null;
    } catch {
      return null;
    }
  }

  async create(input: CreateUserInput): Promise<User> {
    const doc = await this.model.create({
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      role: input.role,
      active: input.active ?? true,
      tokenVersion: input.tokenVersion ?? 0,
      mustChangePassword: input.mustChangePassword ?? false,
      createdBy: input.createdBy ?? null,
    });
    return this.toEntity(doc);
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const updatePayload: Record<string, unknown> = {};
    if (input.email !== undefined) {
      updatePayload.email = input.email.toLowerCase().trim();
    }
    if (input.passwordHash !== undefined) {
      updatePayload.passwordHash = input.passwordHash;
    }
    if (input.role !== undefined) {
      updatePayload.role = input.role;
    }
    if (input.active !== undefined) {
      updatePayload.active = input.active;
    }
    if (input.tokenVersion !== undefined) {
      updatePayload.tokenVersion = input.tokenVersion;
    }
    if (input.mustChangePassword !== undefined) {
      updatePayload.mustChangePassword = input.mustChangePassword;
    }

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  // AdminRepository compatibility methods
  async findByUsername(username: string): Promise<Admin | null> {
    const user = await this.findByEmail(username);
    if (!user) return null;
    return {
      id: user.id,
      username: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt ?? new Date(),
    };
  }

  private toEntity(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      active: doc.active,
      tokenVersion: doc.tokenVersion ?? 0,
      mustChangePassword: doc.mustChangePassword ?? false,
      createdBy: doc.createdBy ?? null,
      createdAt: doc.createdAt ?? new Date(),
      updatedAt: doc.updatedAt ?? new Date(),
    };
  }
}

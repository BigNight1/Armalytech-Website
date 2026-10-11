import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockMovement } from '../domain/stock-movement.entity';
import {
  CreateStockMovementInput,
  StockMovementListResult,
  StockMovementRepository,
} from '../domain/stock-movement-repository.port';
import {
  StockMovementDocument,
  StockMovementModel,
} from './schemas/stock-movement.schema';

@Injectable()
export class MongooseStockMovementRepository implements StockMovementRepository {
  constructor(
    @InjectModel(StockMovementModel.name)
    private readonly movementModel: Model<StockMovementDocument>,
  ) {}

  async create(input: CreateStockMovementInput): Promise<StockMovement> {
    const doc = await this.movementModel.create({
      productId: new Types.ObjectId(input.productId),
      type: input.type,
      quantity: input.quantity,
      stockAfter: input.stockAfter,
      reference: input.reference ?? null,
      reason: input.reason,
      userId: input.userId,
      userEmail: input.userEmail,
      occurredAt: new Date(),
    });
    return this.toEntity(doc);
  }

  async findByProduct(
    productId: string,
    page: number,
    limit: number,
  ): Promise<StockMovementListResult> {
    if (!Types.ObjectId.isValid(productId)) {
      return { items: [], total: 0 };
    }
    const filter = { productId: new Types.ObjectId(productId) };
    const [docs, total] = await Promise.all([
      this.movementModel
        .find(filter)
        .sort({ occurredAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.movementModel.countDocuments(filter).exec(),
    ]);
    return { items: docs.map((doc) => this.toEntity(doc)), total };
  }

  private toEntity(doc: StockMovementDocument): StockMovement {
    return {
      id: doc._id.toString(),
      productId: doc.productId.toString(),
      type: doc.type,
      quantity: doc.quantity,
      stockAfter: doc.stockAfter,
      reference: doc.reference ? { ...doc.reference } : null,
      reason: doc.reason,
      userId: doc.userId,
      userEmail: doc.userEmail,
      occurredAt: doc.occurredAt,
    };
  }
}

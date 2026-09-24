import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommunityEvent } from '../domain/community-event.entity';
import {
  CommunityEventRepository,
  CreateCommunityEventInput,
} from '../domain/community-event-repository.port';
import {
  CommunityEventDocument,
  CommunityEventModel,
} from './schemas/community-event.schema';

@Injectable()
export class MongooseCommunityEventRepository implements CommunityEventRepository {
  constructor(
    @InjectModel(CommunityEventModel.name)
    private readonly eventModel: Model<CommunityEventDocument>,
  ) {}

  async create(input: CreateCommunityEventInput): Promise<CommunityEvent> {
    const doc = await this.eventModel.create({
      clientId: input.clientId ? new Types.ObjectId(input.clientId) : null,
      phoneE164: input.phoneE164,
      type: input.type,
      rejectReason: input.rejectReason,
      channel: input.channel,
      occurredAt: input.occurredAt,
    });
    return this.toEntity(doc);
  }

  async findByClient(clientId: string): Promise<CommunityEvent[]> {
    if (!Types.ObjectId.isValid(clientId)) {
      return [];
    }
    const docs = await this.eventModel
      .find({ clientId: new Types.ObjectId(clientId) })
      .sort({ occurredAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByRange(
    from: Date | null,
    to: Date | null,
    type: string | null,
  ): Promise<CommunityEvent[]> {
    const filter: Record<string, unknown> = {};
    if (from || to) {
      filter.occurredAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }
    if (type) {
      filter.type = type;
    }

    const docs = await this.eventModel
      .find(filter)
      .sort({ occurredAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  private toEntity(doc: CommunityEventDocument): CommunityEvent {
    return {
      id: doc._id.toString(),
      clientId: doc.clientId ? doc.clientId.toString() : null,
      phoneE164: doc.phoneE164,
      type: doc.type,
      rejectReason: doc.rejectReason,
      occurredAt: doc.occurredAt,
      channel: doc.channel,
    };
  }
}

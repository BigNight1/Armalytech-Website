import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client } from '../domain/client.entity';
import {
  ClientRepository,
  ClientSearchResult,
  UpdateClientInput,
  UpsertVisitInput,
  UpsertVisitResult,
} from '../domain/client-repository.port';
import { ClientDocument, ClientModel } from './schemas/client.schema';

@Injectable()
export class MongooseClientRepository implements ClientRepository {
  constructor(
    @InjectModel(ClientModel.name)
    private readonly clientModel: Model<ClientDocument>,
  ) {}

  async findById(id: string): Promise<Client | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.clientModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByPhone(phoneE164: string): Promise<Client | null> {
    const doc = await this.clientModel.findOne({ phoneE164 }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async upsertVisit(input: UpsertVisitInput): Promise<UpsertVisitResult> {
    const result = await this.clientModel
      .findOneAndUpdate(
        { phoneE164: input.phoneE164 },
        {
          $setOnInsert: {
            firstName: input.firstName,
            lastName: input.lastName,
            phoneE164: input.phoneE164,
            marketingConsent: input.marketingConsent,
            consentAt: input.occurredAt,
            channel: input.channel,
            firstVisitAt: input.occurredAt,
          },
          $set: { lastVisitAt: input.occurredAt },
          $inc: { visitCount: 1 },
        },
        {
          new: true,
          upsert: true,
          includeResultMetadata: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    const doc = result.value as ClientDocument;
    const wasNew = !result.lastErrorObject?.updatedExisting;
    return { client: this.toEntity(doc), wasNew };
  }

  async update(id: string, input: UpdateClientInput): Promise<Client | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const set: Record<string, unknown> = {};
    if (input.firstName !== undefined) set.firstName = input.firstName;
    if (input.lastName !== undefined) set.lastName = input.lastName;
    if (input.marketingConsent !== undefined)
      set.marketingConsent = input.marketingConsent;

    const doc = await this.clientModel
      .findByIdAndUpdate(id, { $set: set }, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async search(
    query: string,
    page: number,
    limit: number,
    marketingConsent?: boolean,
  ): Promise<ClientSearchResult> {
    const filter: Record<string, unknown> = {};
    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { phoneE164: regex },
      ];
    }
    if (marketingConsent !== undefined) {
      filter.marketingConsent = marketingConsent;
    }

    const [docs, total] = await Promise.all([
      this.clientModel
        .find(filter)
        .sort({ lastVisitAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.clientModel.countDocuments(filter).exec(),
    ]);

    return { items: docs.map((doc) => this.toEntity(doc)), total };
  }

  private toEntity(doc: ClientDocument): Client {
    return {
      id: doc._id.toString(),
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneE164: doc.phoneE164,
      marketingConsent: doc.marketingConsent,
      consentAt: doc.consentAt,
      channel: doc.channel,
      visitCount: doc.visitCount,
      firstVisitAt: doc.firstVisitAt,
      lastVisitAt: doc.lastVisitAt,
    };
  }
}

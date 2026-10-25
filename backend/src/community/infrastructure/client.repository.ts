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
    const existing = await this.clientModel
      .findOne({ phoneE164: input.phoneE164 })
      .exec();
    if (existing) {
      // Never overwrite the stored names on a repeat registration (2026-10-25
      // hardening, C4): the public QR form must not be able to rename an
      // existing client — only the authenticated panel update can.
      // Consent never downgrades on a repeat submission (2026-09-25): only
      // upgrade a previously-declined consent to approved, and record the
      // new consent date when that happens; an already-approved consent (and
      // its original audit date) is left untouched.
      if (!existing.marketingConsent && input.marketingConsent) {
        existing.marketingConsent = true;
        existing.consentAt = input.occurredAt;
      }
      const saved = await existing.save();
      return { client: this.toEntity(saved), wasNew: false };
    }

    const doc = await this.clientModel.create({
      firstName: input.firstName,
      lastName: input.lastName,
      phoneE164: input.phoneE164,
      marketingConsent: input.marketingConsent,
      consentAt: input.occurredAt,
      channel: input.channel,
      visitCount: 0,
      stamps: 0,
      loyaltyCycle: 1,
      rewardsClaimed: 0,
      firstVisitAt: null,
      lastVisitAt: null,
    });

    return { client: this.toEntity(doc), wasNew: true };
  }

  async incrementVisit(id: string, occurredAt: Date): Promise<Client | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const current = await this.clientModel.findById(id).exec();
    if (!current) {
      return null;
    }

    const currentStamps = current.stamps ?? 0;
    const newStamps = currentStamps < 5 ? currentStamps + 1 : 5;

    current.visitCount = (current.visitCount ?? 0) + 1;
    current.stamps = newStamps;
    current.lastVisitAt = occurredAt;
    if (!current.firstVisitAt) {
      current.firstVisitAt = occurredAt;
    }

    const saved = await current.save();
    return this.toEntity(saved);
  }

  async claimReward(id: string, occurredAt: Date): Promise<Client | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const current = await this.clientModel.findById(id).exec();
    if (!current) {
      return null;
    }

    current.stamps = 0;
    current.loyaltyCycle = (current.loyaltyCycle ?? 1) + 1;
    current.rewardsClaimed = (current.rewardsClaimed ?? 0) + 1;
    current.lastRewardClaimedAt = occurredAt;

    const saved = await current.save();
    return this.toEntity(saved);
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
        .sort({ createdAt: -1, lastVisitAt: -1 })
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
      visitCount: doc.visitCount ?? 0,
      stamps: doc.stamps ?? 0,
      loyaltyCycle: doc.loyaltyCycle ?? 1,
      rewardsClaimed: doc.rewardsClaimed ?? 0,
      lastRewardClaimedAt: doc.lastRewardClaimedAt ?? null,
      firstVisitAt: doc.firstVisitAt ?? null,
      lastVisitAt: doc.lastVisitAt ?? null,
    };
  }
}

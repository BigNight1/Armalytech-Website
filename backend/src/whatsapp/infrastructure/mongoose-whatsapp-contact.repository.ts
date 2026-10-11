import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppContact } from '../domain/whatsapp-contact.entity';
import { WhatsAppContactRepository } from '../domain/whatsapp-contact-repository.port';
import {
  WhatsAppContactDocument,
  WhatsAppContactModel,
} from './schemas/whatsapp-contact.schema';

@Injectable()
export class MongooseWhatsAppContactRepository implements WhatsAppContactRepository {
  constructor(
    @InjectModel(WhatsAppContactModel.name)
    private readonly model: Model<WhatsAppContactDocument>,
  ) {}

  async findByPhone(phoneE164: string): Promise<WhatsAppContact | null> {
    const doc = await this.model.findOne({ phoneE164 }).exec();
    if (!doc) return null;
    return {
      phoneE164: doc.phoneE164,
      lastInboundAt: doc.lastInboundAt ?? undefined,
      marketingOptOutAt: doc.marketingOptOutAt ?? undefined,
      updatedAt: doc.updatedAt ?? new Date(0),
    };
  }

  async touchInbound(phoneE164: string, at: Date): Promise<void> {
    // $max keeps the latest timestamp even if events arrive out of order.
    await this.model
      .updateOne(
        { phoneE164 },
        { $max: { lastInboundAt: at }, $setOnInsert: { phoneE164 } },
        { upsert: true },
      )
      .exec();
  }

  async markOptOut(phoneE164: string, at: Date): Promise<void> {
    await this.model
      .updateOne(
        { phoneE164 },
        { $set: { marketingOptOutAt: at }, $setOnInsert: { phoneE164 } },
        { upsert: true },
      )
      .exec();
  }
}

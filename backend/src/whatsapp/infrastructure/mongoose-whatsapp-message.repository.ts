import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WhatsAppMessage,
  statusesReplaceableBy,
} from '../domain/whatsapp-message.entity';
import {
  CreateWhatsAppMessageInput,
  UpdateWhatsAppMessageStatusInput,
  WhatsAppMessageRepository,
} from '../domain/whatsapp-message-repository.port';
import {
  WhatsAppMessageDocument,
  WhatsAppMessageModel,
} from './schemas/whatsapp-message.schema';

@Injectable()
export class MongooseWhatsAppMessageRepository implements WhatsAppMessageRepository {
  constructor(
    @InjectModel(WhatsAppMessageModel.name)
    private readonly model: Model<WhatsAppMessageDocument>,
  ) {}

  async create(input: CreateWhatsAppMessageInput): Promise<WhatsAppMessage> {
    const doc = await this.model.create(input);
    return this.toEntity(doc);
  }

  async findByWamid(wamid: string): Promise<WhatsAppMessage | null> {
    const doc = await this.model.findOne({ wamid }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async listByTicket(ticketId: string): Promise<WhatsAppMessage[]> {
    const docs = await this.model
      .find({ ticketId })
      .sort({ sentAt: -1, _id: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findLatestByTicketAndTemplate(
    ticketId: string,
    template: string,
    options?: { excludeFailed?: boolean },
  ): Promise<WhatsAppMessage | null> {
    const filter: Record<string, unknown> = { ticketId, template };
    if (options?.excludeFailed) filter.status = { $ne: 'failed' };
    const doc = await this.model
      .findOne(filter)
      .sort({ sentAt: -1, _id: -1 })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async updateStatus(
    wamid: string,
    input: UpdateWhatsAppMessageStatusInput,
  ): Promise<WhatsAppMessage | null> {
    const set: Record<string, unknown> = {
      status: input.status,
      statusAt: input.statusAt,
    };
    const update: Record<string, unknown> = { $set: set };
    if (input.error) {
      set.error = input.error;
    } else if (input.status !== 'failed') {
      update.$unset = { error: '' };
    }

    // The status filter makes the "never go backwards" rule atomic.
    const doc = await this.model
      .findOneAndUpdate(
        { wamid, status: { $in: statusesReplaceableBy(input.status) } },
        update,
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  private toEntity(doc: WhatsAppMessageDocument): WhatsAppMessage {
    const error = doc.error?.message
      ? {
          code: doc.error.code ?? undefined,
          title: doc.error.title ?? undefined,
          message: doc.error.message,
        }
      : undefined;
    return {
      id: doc._id.toString(),
      ticketId: doc.ticketId ?? undefined,
      clientId: doc.clientId ?? undefined,
      template: doc.template,
      to: doc.to,
      wamid: doc.wamid ?? undefined,
      status: doc.status,
      error,
      insideServiceWindow: doc.insideServiceWindow,
      trigger: doc.trigger,
      sentById: doc.sentById ?? undefined,
      sentByEmail: doc.sentByEmail ?? undefined,
      sentAt: doc.sentAt,
      statusAt: doc.statusAt,
      createdAt: doc.createdAt ?? doc.sentAt,
    };
  }
}

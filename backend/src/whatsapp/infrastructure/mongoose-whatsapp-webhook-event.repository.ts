import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppWebhookEventRepository } from '../domain/whatsapp-webhook-event-repository.port';
import {
  WhatsAppWebhookEventDocument,
  WhatsAppWebhookEventModel,
} from './schemas/whatsapp-webhook-event.schema';

const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class MongooseWhatsAppWebhookEventRepository implements WhatsAppWebhookEventRepository {
  constructor(
    @InjectModel(WhatsAppWebhookEventModel.name)
    private readonly model: Model<WhatsAppWebhookEventDocument>,
  ) {}

  async register(key: string): Promise<boolean> {
    try {
      await this.model.create({ key });
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_ERROR) {
        return false;
      }
      throw error;
    }
  }
}

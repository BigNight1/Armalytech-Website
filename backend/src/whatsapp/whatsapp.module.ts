import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WHATSAPP_SENDER } from './domain/whatsapp-sender.port';
import { WHATSAPP_MESSAGE_REPOSITORY } from './domain/whatsapp-message-repository.port';
import { WHATSAPP_CONTACT_REPOSITORY } from './domain/whatsapp-contact-repository.port';
import { WHATSAPP_WEBHOOK_EVENT_REPOSITORY } from './domain/whatsapp-webhook-event-repository.port';
import { CommunityModule } from '../community/community.module';
import { HandleKapsoWebhookUseCase } from './application/handle-kapso-webhook.use-case';
import { KapsoWebhookController } from './infrastructure/kapso-webhook.controller';
import { MongooseWhatsAppWebhookEventRepository } from './infrastructure/mongoose-whatsapp-webhook-event.repository';
import {
  WhatsAppWebhookEventModel,
  WhatsAppWebhookEventSchema,
} from './infrastructure/schemas/whatsapp-webhook-event.schema';
import { createWhatsAppSender } from './infrastructure/whatsapp-sender.factory';
import { MongooseWhatsAppMessageRepository } from './infrastructure/mongoose-whatsapp-message.repository';
import { MongooseWhatsAppContactRepository } from './infrastructure/mongoose-whatsapp-contact.repository';
import {
  WhatsAppMessageModel,
  WhatsAppMessageSchema,
} from './infrastructure/schemas/whatsapp-message.schema';
import {
  WhatsAppContactModel,
  WhatsAppContactSchema,
} from './infrastructure/schemas/whatsapp-contact.schema';

/**
 * Generic WhatsApp messaging (ADR 0029): send port, message log and contacts.
 * Knows nothing about tickets; feature modules build on its exports.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppMessageModel.name, schema: WhatsAppMessageSchema },
      { name: WhatsAppContactModel.name, schema: WhatsAppContactSchema },
      {
        name: WhatsAppWebhookEventModel.name,
        schema: WhatsAppWebhookEventSchema,
      },
    ]),
    // Webhook opt-outs also clear the client's marketing consent. Community
    // never imports this module, so there is no cycle.
    CommunityModule,
  ],
  controllers: [KapsoWebhookController],
  providers: [
    HandleKapsoWebhookUseCase,
    {
      provide: WHATSAPP_WEBHOOK_EVENT_REPOSITORY,
      useClass: MongooseWhatsAppWebhookEventRepository,
    },
    {
      provide: WHATSAPP_SENDER,
      inject: [ConfigService],
      useFactory: createWhatsAppSender,
    },
    {
      provide: WHATSAPP_MESSAGE_REPOSITORY,
      useClass: MongooseWhatsAppMessageRepository,
    },
    {
      provide: WHATSAPP_CONTACT_REPOSITORY,
      useClass: MongooseWhatsAppContactRepository,
    },
  ],
  exports: [
    WHATSAPP_SENDER,
    WHATSAPP_MESSAGE_REPOSITORY,
    WHATSAPP_CONTACT_REPOSITORY,
  ],
})
export class WhatsappModule {}

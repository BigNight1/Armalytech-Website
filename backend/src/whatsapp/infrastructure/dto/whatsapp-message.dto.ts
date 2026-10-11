import {
  WhatsAppMessage,
  WhatsAppMessageError,
  WhatsAppMessageStatus,
  WhatsAppTrigger,
} from '../../domain/whatsapp-message.entity';

export interface WhatsAppMessageDto {
  id: string;
  template: string;
  to: string;
  status: WhatsAppMessageStatus;
  error?: WhatsAppMessageError;
  insideServiceWindow: boolean;
  trigger: WhatsAppTrigger;
  sentByEmail?: string;
  sentAt: string;
  statusAt: string;
}

export function toWhatsAppMessageDto(
  message: WhatsAppMessage,
): WhatsAppMessageDto {
  return {
    id: message.id,
    template: message.template,
    to: message.to,
    status: message.status,
    error: message.error,
    insideServiceWindow: message.insideServiceWindow,
    trigger: message.trigger,
    sentByEmail: message.sentByEmail,
    sentAt: message.sentAt.toISOString(),
    statusAt: message.statusAt.toISOString(),
  };
}

import { Injectable, Logger } from '@nestjs/common';
import { Client } from '../domain/client.entity';
import { CommunityNotifier } from '../domain/community-notifier.port';

@Injectable()
export class WebhookCommunityNotifier implements CommunityNotifier {
  private readonly logger = new Logger(WebhookCommunityNotifier.name);

  async notifyRegistered(client: Client, isNewClient: boolean): Promise<void> {
    const url =
      process.env.N8N_WEBHOOK_URL_REGISTRATION || process.env.N8N_WEBHOOK_URL;
    if (!url) {
      this.logger.debug(
        `notifyRegistered: No n8n webhook configured for client ${client.id} (isNewClient=${isNewClient})`,
      );
      return;
    }

    try {
      await this.sendWebhook(url, {
        event: 'client_registered',
        isNewClient,
        client: this.sanitizeClient(client),
        occurredAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch registration webhook to n8n: ${(error as Error).message}`,
      );
    }
  }

  async notifyVisitThreshold(client: Client, threshold: number): Promise<void> {
    const url =
      process.env.N8N_WEBHOOK_URL_VISIT_4 || process.env.N8N_WEBHOOK_URL;
    const payload = {
      event: 'loyalty_visit_threshold',
      threshold,
      discountPercent: 20,
      message: `¡Hola ${client.firstName}! Te falta solo 1 visita para ganar un 20% de descuento en tu próxima reparación en ArmalyTech.`,
      client: this.sanitizeClient(client),
      occurredAt: new Date().toISOString(),
    };

    if (!url) {
      this.logger.log(
        `[n8n SIMULATOR] Loyalty threshold ${threshold} reached for ${client.firstName} (${client.phoneE164}). Set N8N_WEBHOOK_URL_VISIT_4 to send real webhook.`,
      );
      return;
    }

    try {
      await this.sendWebhook(url, payload);
      this.logger.log(
        `Dispatched n8n loyalty threshold webhook for client ${client.id}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch loyalty threshold webhook to n8n: ${(error as Error).message}`,
      );
    }
  }

  async notifyDirectMessage(
    client: Client,
    template: 'promo_20' | 'google_review' | 'reconnect',
  ): Promise<{ sent: boolean; message?: string }> {
    const url =
      process.env.N8N_WEBHOOK_URL_DIRECT_MESSAGE || process.env.N8N_WEBHOOK_URL;
    const defaultMessages: Record<string, string> = {
      promo_20: `¡Hola ${client.firstName}! En ArmalyTech valoramos tu preferencia. Queremos recordarte que estás muy cerca de tu 20% de descuento en reparaciones. ¡Te esperamos pronto!`,
      google_review: `¡Hola ${client.firstName}! Gracias por confiar en el servicio técnico de ArmalyTech. Tu opinión nos ayuda muchísimo a seguir creciendo. ¿Nos regalarías una reseña rápida en Google Maps? ⭐ https://maps.google.com/?cid=armalytech`,
      reconnect: `¡Hola ${client.firstName}! Hace tiempo que no sabemos de ti en ArmalyTech. ¿Tu equipo necesita mantenimiento preventivo o cambio de batería/pasta térmica? Escríbenos para una revisión rápida con atención preferente.`,
    };

    const messageText = defaultMessages[template] ?? '';

    if (!url) {
      this.logger.log(
        `[n8n SIMULATOR] Direct message (${template}) for ${client.firstName} (${client.phoneE164}). Message: "${messageText}"`,
      );
      return { sent: false, message: messageText };
    }

    try {
      await this.sendWebhook(url, {
        event: 'direct_customer_message',
        template,
        message: messageText,
        client: this.sanitizeClient(client),
        occurredAt: new Date().toISOString(),
      });
      return { sent: true, message: messageText };
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch direct message webhook to n8n: ${(error as Error).message}`,
      );
      return { sent: false, message: messageText };
    }
  }

  private sanitizeClient(client: Client) {
    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phoneE164,
      visitCount: client.visitCount,
      stamps: client.stamps,
      loyaltyCycle: client.loyaltyCycle,
      marketingConsent: client.marketingConsent,
    };
  }

  private async sendWebhook(url: string, body: unknown): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`n8n webhook responded with status ${response.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

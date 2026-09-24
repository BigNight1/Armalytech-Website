import { Injectable, Logger } from '@nestjs/common';
import { Client } from '../domain/client.entity';
import { CommunityNotifier } from '../domain/community-notifier.port';

/**
 * Placeholder adapter for `CommunityNotifier`: messaging (n8n/Meta WhatsApp
 * Business Cloud API, ADR 0016/0017) is out of scope for this feature. Wire
 * a real adapter behind the same port when that integration is built.
 */
@Injectable()
export class NoopCommunityNotifier implements CommunityNotifier {
  private readonly logger = new Logger(NoopCommunityNotifier.name);

  async notifyRegistered(client: Client, isNewClient: boolean): Promise<void> {
    this.logger.debug(
      `notifyRegistered no-op for client ${client.id} (isNewClient=${isNewClient})`,
    );
  }
}

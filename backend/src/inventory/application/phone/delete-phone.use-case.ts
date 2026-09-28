import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  PhoneRepository,
  PHONE_REPOSITORY,
} from '../../domain/phone-repository.port';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import {
  PhoneInUseError,
  PhoneNotFoundError,
} from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

/** No cascade: blocks with 409 when any product still lists this phone as compatible. */
@Injectable()
export class DeletePhoneUseCase {
  constructor(
    @Inject(PHONE_REPOSITORY) private readonly phones: PhoneRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(id: string): Promise<void> {
    const phone = await this.phones.findById(id);
    if (!phone) {
      throw new PhoneNotFoundError(id);
    }

    const inUse = await this.products.existsByCompatiblePhone(id);
    if (inUse) {
      throw new PhoneInUseError(id);
    }

    await this.phones.delete(id);
    this.realtime?.publish('inventory');
  }
}

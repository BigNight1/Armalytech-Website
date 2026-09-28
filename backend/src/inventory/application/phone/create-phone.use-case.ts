import { Inject, Injectable, Optional } from '@nestjs/common';
import { Phone } from '../../domain/phone.entity';
import {
  PhoneRepository,
  PHONE_REPOSITORY,
} from '../../domain/phone-repository.port';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import {
  BrandNotFoundError,
  DuplicatePhoneNameError,
} from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

@Injectable()
export class CreatePhoneUseCase {
  constructor(
    @Inject(PHONE_REPOSITORY) private readonly phones: PhoneRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(brandId: string, name: string): Promise<Phone> {
    const brand = await this.brands.findById(brandId);
    if (!brand) {
      throw new BrandNotFoundError(brandId);
    }

    const existing = await this.phones.findByBrandAndNameCaseInsensitive(
      brandId,
      name,
    );
    if (existing) {
      throw new DuplicatePhoneNameError(name);
    }

    const phone = await this.phones.create(brandId, name.trim());
    this.realtime?.publish('inventory');
    return phone;
  }
}

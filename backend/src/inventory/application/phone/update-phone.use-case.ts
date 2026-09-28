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
  PhoneNotFoundError,
} from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

export interface UpdatePhoneCommand {
  brandId?: string;
  name?: string;
}

@Injectable()
export class UpdatePhoneUseCase {
  constructor(
    @Inject(PHONE_REPOSITORY) private readonly phones: PhoneRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(id: string, input: UpdatePhoneCommand): Promise<Phone> {
    const current = await this.phones.findById(id);
    if (!current) {
      throw new PhoneNotFoundError(id);
    }

    if (input.brandId) {
      const brand = await this.brands.findById(input.brandId);
      if (!brand) {
        throw new BrandNotFoundError(input.brandId);
      }
    }

    if (input.brandId !== undefined || input.name !== undefined) {
      const targetBrandId = input.brandId ?? current.brandId;
      const targetName = input.name ?? current.name;
      const existing = await this.phones.findByBrandAndNameCaseInsensitive(
        targetBrandId,
        targetName,
      );
      if (existing && existing.id !== id) {
        throw new DuplicatePhoneNameError(targetName);
      }
    }

    const updated = await this.phones.update(id, {
      brandId: input.brandId,
      name: input.name?.trim(),
    });
    if (!updated) {
      throw new PhoneNotFoundError(id);
    }
    this.realtime?.publish('inventory');
    return updated;
  }
}

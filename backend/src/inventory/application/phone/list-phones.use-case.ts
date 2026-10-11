import { Inject, Injectable } from '@nestjs/common';
import { Phone } from '../../domain/phone.entity';
import {
  PhoneRepository,
  PHONE_REPOSITORY,
} from '../../domain/phone-repository.port';

@Injectable()
export class ListPhonesUseCase {
  constructor(
    @Inject(PHONE_REPOSITORY) private readonly phones: PhoneRepository,
  ) {}

  async execute(brandId?: string): Promise<Phone[]> {
    return this.phones.findAll(brandId);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Part } from '../../domain/part.entity';
import {
  PartRepository,
  PART_REPOSITORY,
} from '../../domain/part-repository.port';
import { PartNotFoundError } from '../../domain/inventory.errors';
import { roundMoney } from '../../../shared/domain/money';

export interface UpdatePartInput {
  name?: string;
  quantity?: number;
  purchasePrice?: number;
  salePrice?: number;
}

@Injectable()
export class UpdatePartUseCase {
  constructor(
    @Inject(PART_REPOSITORY) private readonly parts: PartRepository,
  ) {}

  async execute(id: string, input: UpdatePartInput): Promise<Part> {
    const updated = await this.parts.update(id, {
      name: input.name?.trim(),
      quantity: input.quantity,
      purchasePrice:
        input.purchasePrice !== undefined
          ? roundMoney(input.purchasePrice)
          : undefined,
      salePrice:
        input.salePrice !== undefined ? roundMoney(input.salePrice) : undefined,
    });
    if (!updated) {
      throw new PartNotFoundError(id);
    }
    return updated;
  }
}

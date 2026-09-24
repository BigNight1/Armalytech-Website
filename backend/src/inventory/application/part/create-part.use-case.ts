import { Inject, Injectable } from '@nestjs/common';
import { Part } from '../../domain/part.entity';
import {
  PartRepository,
  PART_REPOSITORY,
} from '../../domain/part-repository.port';
import {
  ModelRepository,
  MODEL_REPOSITORY,
} from '../../domain/model-repository.port';
import { ModelNotFoundError } from '../../domain/inventory.errors';
import { roundMoney } from '../../../shared/domain/money';

export interface CreatePartInput {
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

@Injectable()
export class CreatePartUseCase {
  constructor(
    @Inject(PART_REPOSITORY) private readonly parts: PartRepository,
    @Inject(MODEL_REPOSITORY) private readonly models: ModelRepository,
  ) {}

  async execute(modelId: string, input: CreatePartInput): Promise<Part> {
    const model = await this.models.findById(modelId);
    if (!model) {
      throw new ModelNotFoundError(modelId);
    }

    return this.parts.create(modelId, {
      name: input.name.trim(),
      quantity: input.quantity,
      purchasePrice: roundMoney(input.purchasePrice),
      salePrice: roundMoney(input.salePrice),
    });
  }
}

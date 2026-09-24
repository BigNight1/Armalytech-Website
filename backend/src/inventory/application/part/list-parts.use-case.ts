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

@Injectable()
export class ListPartsUseCase {
  constructor(
    @Inject(PART_REPOSITORY) private readonly parts: PartRepository,
    @Inject(MODEL_REPOSITORY) private readonly models: ModelRepository,
  ) {}

  async execute(modelId: string): Promise<Part[]> {
    const model = await this.models.findById(modelId);
    if (!model) {
      throw new ModelNotFoundError(modelId);
    }
    return this.parts.findByModel(modelId);
  }
}

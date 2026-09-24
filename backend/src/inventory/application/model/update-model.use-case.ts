import { Inject, Injectable } from '@nestjs/common';
import { InventoryModel } from '../../domain/model.entity';
import {
  ModelRepository,
  MODEL_REPOSITORY,
} from '../../domain/model-repository.port';
import { ModelNotFoundError } from '../../domain/inventory.errors';

@Injectable()
export class UpdateModelUseCase {
  constructor(
    @Inject(MODEL_REPOSITORY) private readonly models: ModelRepository,
  ) {}

  async execute(id: string, name: string): Promise<InventoryModel> {
    const updated = await this.models.update(id, name.trim());
    if (!updated) {
      throw new ModelNotFoundError(id);
    }
    return updated;
  }
}

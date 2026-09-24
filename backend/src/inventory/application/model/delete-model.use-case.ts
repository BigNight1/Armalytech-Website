import { Inject, Injectable } from '@nestjs/common';
import {
  ModelRepository,
  MODEL_REPOSITORY,
} from '../../domain/model-repository.port';
import { ModelNotFoundError } from '../../domain/inventory.errors';

@Injectable()
export class DeleteModelUseCase {
  constructor(
    @Inject(MODEL_REPOSITORY) private readonly models: ModelRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.models.deleteCascade(id);
    if (!deleted) {
      throw new ModelNotFoundError(id);
    }
  }
}

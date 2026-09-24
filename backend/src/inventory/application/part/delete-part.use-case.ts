import { Inject, Injectable } from '@nestjs/common';
import {
  PartRepository,
  PART_REPOSITORY,
} from '../../domain/part-repository.port';
import { PartNotFoundError } from '../../domain/inventory.errors';

@Injectable()
export class DeletePartUseCase {
  constructor(
    @Inject(PART_REPOSITORY) private readonly parts: PartRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.parts.delete(id);
    if (!deleted) {
      throw new PartNotFoundError(id);
    }
  }
}

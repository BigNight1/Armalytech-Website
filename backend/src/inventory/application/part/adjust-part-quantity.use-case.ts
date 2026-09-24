import { Inject, Injectable } from '@nestjs/common';
import { Part } from '../../domain/part.entity';
import {
  PartRepository,
  PART_REPOSITORY,
} from '../../domain/part-repository.port';
import {
  InsufficientStockError,
  PartNotFoundError,
} from '../../domain/inventory.errors';

/**
 * Applies a stock delta atomically at the adapter level (a conditional
 * `$inc` filtered by `quantity >= -delta` when `delta < 0`), so two
 * concurrent adjustments can never race past zero (ADR 0006 resolution).
 */
@Injectable()
export class AdjustPartQuantityUseCase {
  constructor(
    @Inject(PART_REPOSITORY) private readonly parts: PartRepository,
  ) {}

  async execute(id: string, delta: number): Promise<Part> {
    const result = await this.parts.adjustQuantity(id, delta);

    if (result === null) {
      throw new PartNotFoundError(id);
    }

    if (result === undefined) {
      const current = await this.parts.findById(id);
      if (!current) {
        throw new PartNotFoundError(id);
      }
      throw new InsufficientStockError(id, -delta, current.quantity);
    }

    return result;
  }
}

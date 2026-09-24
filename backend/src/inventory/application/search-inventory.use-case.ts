import { Inject, Injectable } from '@nestjs/common';
import { PartSearchResult } from '../domain/part.entity';
import {
  PartRepository,
  PART_REPOSITORY,
} from '../domain/part-repository.port';

@Injectable()
export class SearchInventoryUseCase {
  constructor(
    @Inject(PART_REPOSITORY) private readonly parts: PartRepository,
  ) {}

  async execute(query: string): Promise<PartSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    return this.parts.search(trimmed);
  }
}

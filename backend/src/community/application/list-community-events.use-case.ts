import { Inject, Injectable } from '@nestjs/common';
import {
  CommunityEvent,
  CommunityEventType,
} from '../domain/community-event.entity';
import {
  CommunityEventRepository,
  COMMUNITY_EVENT_REPOSITORY,
} from '../domain/community-event-repository.port';
import { ValidationDomainError } from '../../shared/domain/domain-error';

const VALID_TYPES: CommunityEventType[] = [
  'registro',
  'visita',
  'registro_rechazado',
];

@Injectable()
export class ListCommunityEventsUseCase {
  constructor(
    @Inject(COMMUNITY_EVENT_REPOSITORY)
    private readonly events: CommunityEventRepository,
  ) {}

  async execute(
    from: string | undefined,
    to: string | undefined,
    type: string | undefined,
  ): Promise<CommunityEvent[]> {
    if (type && !VALID_TYPES.includes(type as CommunityEventType)) {
      throw new ValidationDomainError(`Invalid event type "${type}"`);
    }

    const fromDate = from ? this.parseDate(from) : null;
    const toDate = to ? this.parseDate(to) : null;

    return this.events.findByRange(
      fromDate,
      toDate,
      (type as CommunityEventType | undefined) ?? null,
    );
  }

  private parseDate(raw: string): Date {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throw new ValidationDomainError(`"${raw}" is not a valid date`);
    }
    return date;
  }
}

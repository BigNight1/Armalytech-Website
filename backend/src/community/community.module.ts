import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClientModel,
  ClientSchema,
} from './infrastructure/schemas/client.schema';
import {
  CommunityEventModel,
  CommunityEventSchema,
} from './infrastructure/schemas/community-event.schema';
import { MongooseClientRepository } from './infrastructure/client.repository';
import { MongooseCommunityEventRepository } from './infrastructure/community-event.repository';
import { NoopCommunityNotifier } from './infrastructure/noop-community-notifier';
import { CommunityController } from './infrastructure/community.controller';
import { CLIENT_REPOSITORY } from './domain/client-repository.port';
import { COMMUNITY_EVENT_REPOSITORY } from './domain/community-event-repository.port';
import { COMMUNITY_NOTIFIER } from './domain/community-notifier.port';
import { RegisterClientUseCase } from './application/register-client.use-case';
import { ListClientsUseCase } from './application/list-clients.use-case';
import { GetClientUseCase } from './application/get-client.use-case';
import { GetClientHistoryUseCase } from './application/get-client-history.use-case';
import { ListCommunityEventsUseCase } from './application/list-community-events.use-case';
import { UpdateClientUseCase } from './application/update-client.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClientModel.name, schema: ClientSchema },
      { name: CommunityEventModel.name, schema: CommunityEventSchema },
    ]),
  ],
  controllers: [CommunityController],
  providers: [
    { provide: CLIENT_REPOSITORY, useClass: MongooseClientRepository },
    {
      provide: COMMUNITY_EVENT_REPOSITORY,
      useClass: MongooseCommunityEventRepository,
    },
    { provide: COMMUNITY_NOTIFIER, useClass: NoopCommunityNotifier },
    RegisterClientUseCase,
    ListClientsUseCase,
    GetClientUseCase,
    GetClientHistoryUseCase,
    ListCommunityEventsUseCase,
    UpdateClientUseCase,
  ],
})
export class CommunityModule {}

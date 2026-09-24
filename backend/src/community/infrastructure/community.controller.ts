import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../shared/infrastructure/public.decorator';
import { RegisterClientUseCase } from '../application/register-client.use-case';
import { ListClientsUseCase } from '../application/list-clients.use-case';
import { GetClientUseCase } from '../application/get-client.use-case';
import { GetClientHistoryUseCase } from '../application/get-client-history.use-case';
import { ListCommunityEventsUseCase } from '../application/list-community-events.use-case';
import { UpdateClientUseCase } from '../application/update-client.use-case';
import {
  RegisterChannelQueryDto,
  RegisterClientDto,
} from './dto/register-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly registerClient: RegisterClientUseCase,
    private readonly listClients: ListClientsUseCase,
    private readonly getClient: GetClientUseCase,
    private readonly getClientHistory: GetClientHistoryUseCase,
    private readonly listCommunityEvents: ListCommunityEventsUseCase,
    private readonly updateClient: UpdateClientUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterClientDto,
    @Query() query: RegisterChannelQueryDto,
  ) {
    const { client, isNewClient } = await this.registerClient.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      marketingConsent: dto.marketingConsent,
      channel: query.canal ?? 'qr',
    });

    return {
      ok: true,
      data: {
        client,
        isNewClient,
        visitCount: client.visitCount,
      },
    };
  }

  @Get('clients')
  async getClients(@Query() query: ListClientsQueryDto) {
    const marketingConsent =
      query.consent === 'approved'
        ? true
        : query.consent === 'declined'
          ? false
          : undefined;
    return {
      ok: true,
      data: await this.listClients.execute(
        query.q ?? '',
        query.page ?? 1,
        query.limit ?? 20,
        marketingConsent,
      ),
    };
  }

  @Get('clients/:id')
  async getClientById(@Param('id') id: string) {
    return { ok: true, data: await this.getClient.execute(id) };
  }

  @Patch('clients/:id')
  async patchClient(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return { ok: true, data: await this.updateClient.execute(id, dto) };
  }

  @Get('clients/:id/events')
  async getClientEvents(@Param('id') id: string) {
    return { ok: true, data: await this.getClientHistory.execute(id) };
  }

  @Get('events')
  async getEvents(@Query() query: ListEventsQueryDto) {
    return {
      ok: true,
      data: await this.listCommunityEvents.execute(
        query.from,
        query.to,
        query.type,
      ),
    };
  }
}

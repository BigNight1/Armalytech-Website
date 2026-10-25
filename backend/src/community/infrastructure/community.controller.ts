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
import { RegisterVisitUseCase } from '../application/register-visit.use-case';
import { ClaimRewardUseCase } from '../application/claim-reward.use-case';
import { SendCommunityMessageUseCase } from '../application/send-community-message.use-case';
import {
  RegisterChannelQueryDto,
  RegisterClientDto,
} from './dto/register-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { RegisterVisitDto } from './dto/register-visit.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly registerClient: RegisterClientUseCase,
    private readonly listClients: ListClientsUseCase,
    private readonly getClient: GetClientUseCase,
    private readonly getClientHistory: GetClientHistoryUseCase,
    private readonly listCommunityEvents: ListCommunityEventsUseCase,
    private readonly updateClient: UpdateClientUseCase,
    private readonly registerVisit: RegisterVisitUseCase,
    private readonly claimReward: ClaimRewardUseCase,
    private readonly sendMessage: SendCommunityMessageUseCase,
  ) {}

  // 5 public registrations per minute per IP (2026-10-25 hardening, C4).
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterClientDto,
    @Query() query: RegisterChannelQueryDto,
  ): Promise<{
    ok: true;
    data: {
      client: { firstName: string; stamps: number };
      isNewClient: boolean;
    };
  }> {
    const { client, isNewClient } = await this.registerClient.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      marketingConsent: dto.marketingConsent,
      channel: query.canal ?? 'qr',
    });

    // Public projection only (C4): the QR page reads `isNewClient`,
    // `client.firstName` and `client.stamps` and nothing else. Never leak
    // `phoneE164`, `consentAt`, `lastName`, dates or `visitCount` from an
    // unauthenticated endpoint.
    return {
      ok: true,
      data: {
        client: { firstName: client.firstName, stamps: client.stamps },
        isNewClient,
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

  @Post('clients/:id/visits')
  async registerClientVisit(@Param('id') id: string) {
    const result = await this.registerVisit.execute({ clientId: id });
    return { ok: true, data: result };
  }

  @Post('visits')
  async registerVisitByPhone(@Body() dto: RegisterVisitDto) {
    const result = await this.registerVisit.execute({ phone: dto.phone });
    return { ok: true, data: result };
  }

  @Post('clients/:id/claim-reward')
  async claimRewardEndpoint(@Param('id') id: string) {
    const client = await this.claimReward.execute(id);
    return { ok: true, data: client };
  }

  @Post('clients/:id/messages')
  async sendClientMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.sendMessage.execute({
      clientId: id,
      template: dto.template,
    });
    return { ok: true, data: result };
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsController } from './infrastructure/tickets.controller';
import { TechniciansController } from './infrastructure/technicians.controller';
import { CobrosController } from './infrastructure/cobros.controller';
import { ClientTicketsController } from './infrastructure/client-tickets.controller';
import { SalesController } from './infrastructure/sales.controller';
import {
  TicketUseCases,
  TICKET_REPOSITORY,
} from './application/ticket.use-cases';
import { TechnicianService } from './application/technician.service';
import { CobroService } from './application/cobro.service';
import { SalesService } from './application/sales.service';
import { TicketRepository } from './infrastructure/ticket.repository';
import { TicketCipherService } from './infrastructure/crypto/ticket-cipher.service';
import {
  TicketMongo,
  TicketSchema,
} from './infrastructure/schemas/ticket.schema';
import {
  Counter,
  CounterSchema,
} from './infrastructure/schemas/counter.schema';
import {
  TechnicianModel,
  TechnicianSchema,
} from './infrastructure/schemas/technician.schema';
import { CobroModel, CobroSchema } from './infrastructure/schemas/cobro.schema';
import { InventoryModule } from '../inventory/inventory.module';
import { CommunityModule } from '../community/community.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { TicketWhatsAppService } from './application/ticket-whatsapp.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TicketMongo.name, schema: TicketSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: TechnicianModel.name, schema: TechnicianSchema },
      { name: CobroModel.name, schema: CobroSchema },
    ]),
    InventoryModule,
    CommunityModule,
    WhatsappModule,
  ],
  controllers: [
    TicketsController,
    TechniciansController,
    CobrosController,
    ClientTicketsController,
    SalesController,
  ],
  providers: [
    TicketCipherService,
    TechnicianService,
    CobroService,
    SalesService,
    {
      provide: TICKET_REPOSITORY,
      useClass: TicketRepository,
    },
    TicketWhatsAppService,
    TicketUseCases,
  ],
  exports: [
    TicketUseCases,
    TICKET_REPOSITORY,
    CobroService,
    TechnicianService,
    SalesService,
  ],
})
export class TicketsModule {}

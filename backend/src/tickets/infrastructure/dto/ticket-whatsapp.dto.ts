import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  TICKET_WHATSAPP_TEMPLATES,
  TicketWhatsAppTemplate,
} from '../../application/ticket-whatsapp.service';

export class SendTicketWhatsAppDto {
  @IsIn(TICKET_WHATSAPP_TEMPLATES as readonly string[])
  template!: TicketWhatsAppTemplate;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

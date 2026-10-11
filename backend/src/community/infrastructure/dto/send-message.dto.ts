import { IsIn, IsString } from 'class-validator';
import { CommunityMessageTemplate } from '../../application/send-community-message.use-case';

export class SendMessageDto {
  @IsString()
  @IsIn(['promo_20', 'google_review', 'reconnect'])
  template!: CommunityMessageTemplate;
}

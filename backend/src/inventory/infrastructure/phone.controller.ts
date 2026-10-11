import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ListPhonesUseCase } from '../application/phone/list-phones.use-case';
import { CreatePhoneUseCase } from '../application/phone/create-phone.use-case';
import { UpdatePhoneUseCase } from '../application/phone/update-phone.use-case';
import { DeletePhoneUseCase } from '../application/phone/delete-phone.use-case';
import { ResolvePhoneUseCase } from '../application/phone/resolve-phone.use-case';
import {
  CreatePhoneDto,
  ListPhonesQueryDto,
  ResolvePhoneDto,
  UpdatePhoneDto,
} from './dto/phone.dto';

@Controller('inventory/phones')
export class PhoneController {
  constructor(
    private readonly listPhones: ListPhonesUseCase,
    private readonly createPhone: CreatePhoneUseCase,
    private readonly updatePhone: UpdatePhoneUseCase,
    private readonly deletePhone: DeletePhoneUseCase,
    private readonly resolvePhone: ResolvePhoneUseCase,
  ) {}

  @Post('resolve')
  async resolve(@Body() dto: ResolvePhoneDto) {
    return this.resolvePhone.execute(dto.marca, dto.modelo);
  }

  @Get()
  async list(@Query() query: ListPhonesQueryDto) {
    return { ok: true, data: await this.listPhones.execute(query.brandId) };
  }

  @Post()
  async create(@Body() dto: CreatePhoneDto) {
    return {
      ok: true,
      data: await this.createPhone.execute(dto.brandId, dto.name),
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePhoneDto) {
    return {
      ok: true,
      data: await this.updatePhone.execute(id, {
        brandId: dto.brandId,
        name: dto.name,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deletePhone.execute(id);
  }
}

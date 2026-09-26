import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../inventory/domain/product-repository.port';
import {
  STOCK_MOVEMENT_REPOSITORY,
  StockMovementRepository,
} from '../../inventory/domain/stock-movement-repository.port';
import {
  CobroDocument,
  CobroItemModel,
  CobroModel,
} from '../infrastructure/schemas/cobro.schema';

export interface CreateCobroInput {
  origen: 'ticket' | 'venta';
  referenciaId: string;
  codigo: string;
  tipo: 'adelanto' | 'saldo' | 'venta';
  monto: number;
  metodo: 'efectivo' | 'yape';
  usuarioId?: string;
  descripcion?: string;
  items?: CobroItemModel[];
}

/** Lima has no DST and is always UTC-5. */
const LIMA_UTC_OFFSET_HOURS = 5;

@Injectable()
export class CobroService {
  constructor(
    @InjectModel(CobroModel.name)
    private readonly cobroModel: Model<CobroDocument>,
    @Optional()
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository?: ProductRepository,
    @Optional()
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository?: StockMovementRepository,
  ) {}

  async create(input: CreateCobroInput): Promise<CobroModel> {
    const doc = new this.cobroModel({
      ...input,
      anulado: false,
      fecha: new Date(),
    });
    return doc.save();
  }

  /** Boundary in UTC for the start of `dateStr` (YYYY-MM-DD) as a Lima calendar day. */
  private limaDayStartUtc(dateStr: string): Date {
    return new Date(
      `${dateStr}T${String(LIMA_UTC_OFFSET_HOURS).padStart(2, '0')}:00:00.000Z`,
    );
  }

  /** `from`/`to` are inclusive Lima calendar days (YYYY-MM-DD). */
  async listByRange(fromStr: string, toStr: string): Promise<CobroModel[]> {
    const start = this.limaDayStartUtc(fromStr);
    const endExclusive = new Date(
      this.limaDayStartUtc(toStr).getTime() + 24 * 60 * 60 * 1000,
    );
    return this.cobroModel
      .find({ fecha: { $gte: start, $lt: endExclusive } })
      .sort({ fecha: 1 });
  }

  async listByReferencia(referenciaId: string): Promise<CobroModel[]> {
    return this.cobroModel.find({ referenciaId }).sort({ fecha: 1 });
  }

  async anular(
    id: string,
    motivo: string,
    usuarioId?: string,
    usuarioEmail?: string,
  ): Promise<CobroModel> {
    const cobro = await this.cobroModel.findById(id);
    if (!cobro) {
      throw new NotFoundException('Cobro no encontrado.');
    }
    if (cobro.anulado) {
      throw new ConflictException({
        code: 'cobro_already_annulled',
        message: 'Este cobro ya fue anulado.',
      });
    }

    cobro.anulado = true;
    cobro.anuladoPor = usuarioEmail ?? usuarioId ?? 'system';
    cobro.anuladoAt = new Date();
    cobro.motivoAnulacion = motivo;

    // Restores stock if this cobro was a quick sale (ADR 0025, Fase D)
    if (
      cobro.tipo === 'venta' &&
      cobro.items &&
      cobro.items.length > 0 &&
      this.productRepository &&
      this.stockMovementRepository
    ) {
      for (const item of cobro.items) {
        const updated = await this.productRepository.adjustStock(
          item.productoId,
          item.cantidad,
        );
        if (updated) {
          await this.stockMovementRepository.create({
            productId: item.productoId,
            type: 'venta_anulada',
            quantity: item.cantidad,
            stockAfter: updated.stock,
            reason: `Anulación venta ${cobro.codigo}: ${motivo}`,
            userId: usuarioId ?? 'system',
            userEmail: usuarioEmail ?? 'system@armalytech.com',
          });
        }
      }
    }

    return cobro.save();
  }
}

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../inventory/domain/product-repository.port';
import {
  STOCK_MOVEMENT_REPOSITORY,
  StockMovementRepository,
} from '../../inventory/domain/stock-movement-repository.port';
import {
  Counter,
  CounterDocument,
} from '../infrastructure/schemas/counter.schema';
import { CobroService } from './cobro.service';
import { CreateSaleDto } from '../infrastructure/dto/sales.dto';

export interface CurrentUser {
  usuarioId?: string;
  usuarioEmail?: string;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly cobroService: CobroService,
  ) {}

  async createSale(dto: CreateSaleDto, user?: CurrentUser) {
    const faltantes: Array<{
      productoId: string;
      nombre: string;
      necesita: number;
      hay: number;
    }> = [];

    const preparedItems: Array<{
      productoId: string;
      nombre: string;
      cantidad: number;
      precioUnitario: number;
      costoUnitario: number;
    }> = [];

    for (const item of dto.items) {
      const product = await this.productRepository.findById(item.productoId);
      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${item.productoId} no encontrado.`,
        );
      }

      if (product.stock < item.cantidad) {
        faltantes.push({
          productoId: product.id,
          nombre: product.name,
          necesita: item.cantidad,
          hay: product.stock,
        });
      }

      preparedItems.push({
        productoId: product.id,
        nombre: product.name,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        costoUnitario: product.cost,
      });
    }

    if (faltantes.length > 0) {
      const names = faltantes.map((f) => f.nombre).join(', ');
      throw new ConflictException({
        code: 'insufficient_stock',
        message: `Stock insuficiente para ${names}.`,
        faltantes,
      });
    }

    const counter = await this.counterModel.findOneAndUpdate(
      { _id: 'sales' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const codigo = `V-${String(counter.seq).padStart(6, '0')}`;

    const discounted: Array<{ productoId: string; cantidad: number }> = [];

    try {
      for (const item of preparedItems) {
        const updated = await this.productRepository.adjustStock(
          item.productoId,
          -item.cantidad,
        );
        if (!updated) {
          throw new ConflictException({
            code: 'insufficient_stock',
            message: `Stock insuficiente para ${item.nombre}.`,
            faltantes: [
              {
                productoId: item.productoId,
                nombre: item.nombre,
                necesita: item.cantidad,
                hay: 0,
              },
            ],
          });
        }
        discounted.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
        });

        await this.stockMovementRepository.create({
          productId: item.productoId,
          type: 'venta',
          quantity: -item.cantidad,
          stockAfter: updated.stock,
          reason: `Venta ${codigo}`,
          userId: user?.usuarioId ?? 'system',
          userEmail: user?.usuarioEmail ?? 'system@armalytech.com',
        });
      }
    } catch (err) {
      for (const d of discounted) {
        await this.productRepository.adjustStock(d.productoId, d.cantidad);
      }
      throw err;
    }

    const monto = preparedItems.reduce(
      (sum, i) => sum + i.cantidad * i.precioUnitario,
      0,
    );
    const saleId = new Types.ObjectId().toString();

    const cobro = await this.cobroService.create({
      origen: 'venta',
      referenciaId: saleId,
      codigo,
      tipo: 'venta',
      monto,
      metodo: dto.metodo,
      usuarioId: user?.usuarioId,
      descripcion: dto.nota?.trim() || `Venta rápida ${codigo}`,
      items: preparedItems,
    });

    return {
      id: (cobro as any)._id?.toString() ?? saleId,
      codigo,
      monto,
      metodo: dto.metodo,
      fecha: cobro.fecha,
      items: preparedItems,
    };
  }
}

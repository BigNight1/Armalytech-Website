import { ConflictException, NotFoundException } from '@nestjs/common';
import { SalesService } from '../sales.service';
import { Product } from '../../../inventory/domain/product.entity';
import { ProductRepository } from '../../../inventory/domain/product-repository.port';
import { StockMovementRepository } from '../../../inventory/domain/stock-movement-repository.port';
import {
  RealtimePublisher,
  RealtimeReason,
  RealtimeTopic,
} from '../../../shared/realtime/realtime-publisher';

class FakeRealtimePublisher implements RealtimePublisher {
  calls: {
    topics: RealtimeTopic | RealtimeTopic[];
    reason?: RealtimeReason;
  }[] = [];

  publish(topics: RealtimeTopic | RealtimeTopic[], reason?: RealtimeReason) {
    this.calls.push({ topics, reason });
  }
}

describe('SalesService', () => {
  let service: SalesService;
  let products: Map<string, Product>;
  let movements: any[];
  let cobros: any[];
  let seqCounter: number;
  let realtime: FakeRealtimePublisher;

  beforeEach(() => {
    seqCounter = 0;
    movements = [];
    cobros = [];
    products = new Map([
      [
        'prod-1',
        {
          id: 'prod-1',
          name: 'Cargador 25W',
          category: { id: 'cat-1', name: 'Accesorios' },
          brand: null,
          cost: 15,
          salePrice: 35,
          stock: 5,
          minStock: 1,
          compatiblePhones: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Product,
      ],
      [
        'prod-2',
        {
          id: 'prod-2',
          name: 'Cable USB-C',
          category: { id: 'cat-1', name: 'Accesorios' },
          brand: null,
          cost: 5,
          salePrice: 15,
          stock: 2,
          minStock: 1,
          compatiblePhones: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Product,
      ],
    ]);

    const fakeCounterModel = {
      findOneAndUpdate: jest.fn().mockImplementation(async () => {
        seqCounter += 1;
        return { seq: seqCounter };
      }),
    };

    const fakeProductRepository: Partial<ProductRepository> = {
      findById: jest.fn().mockImplementation(async (id: string) => {
        return products.get(id) ?? null;
      }),
      adjustStock: jest
        .fn()
        .mockImplementation(async (id: string, delta: number) => {
          const prod = products.get(id);
          if (!prod) return null;
          if (delta < 0 && prod.stock < -delta) return undefined;
          (prod as any).stock += delta;
          return prod;
        }),
    };

    const fakeStockMovementRepository: Partial<StockMovementRepository> = {
      create: jest.fn().mockImplementation(async (input: any) => {
        movements.push(input);
        return input as any;
      }),
    };

    const fakeCobroService = {
      create: jest.fn().mockImplementation(async (input: any) => {
        const doc = {
          _id: `cobro-${cobros.length + 1}`,
          fecha: new Date(),
          ...input,
        };
        cobros.push(doc);
        return doc;
      }),
    };

    realtime = new FakeRealtimePublisher();
    service = new SalesService(
      fakeCounterModel as any,
      fakeProductRepository as any,
      fakeStockMovementRepository as any,
      fakeCobroService as any,
      realtime,
    );
  });

  it('creates a sale successfully, discounts stock, and registers cobro and movement', async () => {
    const sale = await service.createSale(
      {
        items: [
          { productoId: 'prod-1', cantidad: 2, precioUnitario: 35 },
          { productoId: 'prod-2', cantidad: 1, precioUnitario: 15 },
        ],
        metodo: 'efectivo',
        nota: 'Cliente rápido',
      },
      { usuarioId: 'user-1', usuarioEmail: 'admin@armalytech.com' },
    );

    expect(sale.codigo).toBe('V-000001');
    expect(sale.monto).toBe(85);
    expect(sale.metodo).toBe('efectivo');
    expect(products.get('prod-1')!.stock).toBe(3);
    expect(products.get('prod-2')!.stock).toBe(1);
    expect(movements).toHaveLength(2);
    expect(movements[0].type).toBe('venta');
    expect(movements[0].quantity).toBe(-2);
    expect(cobros).toHaveLength(1);
    expect(cobros[0].tipo).toBe('venta');
    expect(cobros[0].origen).toBe('venta');
    expect(cobros[0].items).toHaveLength(2);
    expect(realtime.calls).toContainEqual({
      topics: ['sales', 'inventory'],
      reason: undefined,
    });
  });

  it('fails with 409 and faltantes if stock is insufficient, and never publishes', async () => {
    await expect(
      service.createSale({
        items: [{ productoId: 'prod-2', cantidad: 5, precioUnitario: 15 }],
        metodo: 'yape',
      }),
    ).rejects.toThrow(ConflictException);

    expect(products.get('prod-2')!.stock).toBe(2);
    expect(movements).toHaveLength(0);
    expect(cobros).toHaveLength(0);
    expect(realtime.calls).toHaveLength(0);
  });

  it('fails with 404 if product does not exist', async () => {
    await expect(
      service.createSale({
        items: [
          { productoId: 'prod-inexistente', cantidad: 1, precioUnitario: 10 },
        ],
        metodo: 'efectivo',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

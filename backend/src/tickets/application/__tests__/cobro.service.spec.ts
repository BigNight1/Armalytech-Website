import { ConflictException, NotFoundException } from '@nestjs/common';
import { CobroService } from '../cobro.service';

/**
 * Minimal Mongoose-model stand-in: only the query shapes CobroService
 * actually issues (`find({...}).sort(...)`, `findById`, `new Model(...).save()`).
 */
class FakeCobroModel {
  static docs: any[] = [];
  private _id: string;
  [key: string]: any;

  constructor(data: Record<string, unknown>) {
    Object.assign(this, data);
    this._id = `cobro-${FakeCobroModel.docs.length + 1}`;
  }

  get id() {
    return this._id;
  }

  async save() {
    const existingIndex = FakeCobroModel.docs.findIndex(
      (d) => d._id === this._id,
    );
    if (existingIndex === -1) {
      FakeCobroModel.docs.push(this);
    } else {
      FakeCobroModel.docs[existingIndex] = this;
    }
    return this;
  }

  static find(filter: Record<string, any>) {
    const results = FakeCobroModel.docs.filter((d) => {
      if (filter.referenciaId !== undefined) {
        return d.referenciaId === filter.referenciaId;
      }
      if (filter.fecha) {
        const time = d.fecha.getTime();
        if (filter.fecha.$gte && time < filter.fecha.$gte.getTime())
          return false;
        if (filter.fecha.$lt && time >= filter.fecha.$lt.getTime())
          return false;
        return true;
      }
      return true;
    });
    return {
      sort: async () =>
        [...results].sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
    };
  }

  static async findById(id: string) {
    return FakeCobroModel.docs.find((d) => d._id === id) ?? null;
  }
}

describe('CobroService', () => {
  beforeEach(() => {
    FakeCobroModel.docs = [];
  });

  function buildService(): CobroService {
    return new CobroService(FakeCobroModel as any);
  }

  it('lists cobros within a Lima calendar day (UTC-5, no DST)', async () => {
    const service = buildService();

    const insideStart = new Date('2026-09-26T05:00:00.000Z'); // 2026-09-26 00:00 Lima
    const insideEnd = new Date('2026-09-27T04:59:59.999Z'); // 2026-09-26 23:59:59.999 Lima
    const justBefore = new Date('2026-09-26T04:59:59.999Z'); // 2026-09-25 23:59:59.999 Lima
    const justAfter = new Date('2026-09-27T05:00:00.000Z'); // 2026-09-27 00:00 Lima

    FakeCobroModel.docs = [
      { _id: '1', referenciaId: 'r1', fecha: insideStart, monto: 10 },
      { _id: '2', referenciaId: 'r2', fecha: insideEnd, monto: 20 },
      { _id: '3', referenciaId: 'r3', fecha: justBefore, monto: 30 },
      { _id: '4', referenciaId: 'r4', fecha: justAfter, monto: 40 },
    ] as any;

    const result = await service.listByRange('2026-09-26', '2026-09-26');

    expect(result.map((r: any) => r._id)).toEqual(['1', '2']);
  });

  it('spans multiple Lima days when from != to', async () => {
    const service = buildService();
    FakeCobroModel.docs = [
      { _id: '1', fecha: new Date('2026-09-25T06:00:00.000Z'), monto: 1 },
      { _id: '2', fecha: new Date('2026-09-27T06:00:00.000Z'), monto: 2 },
      { _id: '3', fecha: new Date('2026-09-29T06:00:00.000Z'), monto: 3 },
    ] as any;

    const result = await service.listByRange('2026-09-25', '2026-09-27');
    expect(result.map((r: any) => r._id)).toEqual(['1', '2']);
  });

  it('anular marks the cobro as annulled, without deleting it, and records who/why/when', async () => {
    const service = buildService();
    const created = await service.create({
      origen: 'ticket',
      referenciaId: 'ticket-1',
      codigo: 'AT-000001',
      tipo: 'saldo',
      monto: 100,
      metodo: 'efectivo',
    });

    const annulled = await service.anular(
      (created as any).id,
      'Cliente pagó doble',
      'user-1',
      'owner@armalytech.com',
    );

    expect(annulled.anulado).toBe(true);
    expect(annulled.motivoAnulacion).toBe('Cliente pagó doble');
    expect(annulled.anuladoPor).toBe('owner@armalytech.com');
    expect(annulled.anuladoAt).toBeInstanceOf(Date);
    // Still present, not deleted.
    expect(FakeCobroModel.docs).toHaveLength(1);
  });

  it('rejects annulling a cobro twice', async () => {
    const service = buildService();
    const created = await service.create({
      origen: 'ticket',
      referenciaId: 'ticket-1',
      codigo: 'AT-000001',
      tipo: 'saldo',
      monto: 100,
      metodo: 'efectivo',
    });
    await service.anular((created as any).id, 'motivo 1');

    await expect(
      service.anular((created as any).id, 'motivo 2'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects annulling a cobro that does not exist', async () => {
    const service = buildService();
    await expect(
      service.anular('does-not-exist', 'motivo'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('anular restores stock when cobro is a sale with items', async () => {
    const fakeProductRepo = {
      adjustStock: jest.fn().mockResolvedValue({ id: 'p1', stock: 10 }),
    };
    const fakeMovementRepo = {
      create: jest.fn().mockResolvedValue({}),
    };
    const service = new CobroService(
      FakeCobroModel as any,
      fakeProductRepo as any,
      fakeMovementRepo as any,
    );

    const sale = await service.create({
      origen: 'venta',
      referenciaId: 'sale-1',
      codigo: 'V-000001',
      tipo: 'venta',
      monto: 50,
      metodo: 'efectivo',
      items: [
        {
          productoId: 'p1',
          nombre: 'Cargador',
          cantidad: 2,
          precioUnitario: 25,
        },
      ],
    });

    await service.anular(
      (sale as any).id,
      'Error de digitación',
      'user-1',
      'admin@armalytech.com',
    );

    expect(fakeProductRepo.adjustStock).toHaveBeenCalledWith('p1', 2);
    expect(fakeMovementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p1',
        type: 'venta_anulada',
        quantity: 2,
      }),
    );
  });
});

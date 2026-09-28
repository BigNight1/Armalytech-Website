import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TechnicianDocument,
  TechnicianModel,
} from '../infrastructure/schemas/technician.schema';
import { ITicketRepository } from '../domain/ticket.repository.port';
import { TICKET_REPOSITORY } from './ticket.use-cases';
import { RealtimePublisher } from '../../shared/realtime/realtime-publisher';

export interface TechnicianView {
  id: string;
  nombre: string;
  activo: boolean;
  /** Tickets in pendiente|aprobado|trabajando|listo currently assigned. */
  ticketsEnCurso: number;
}

@Injectable()
export class TechnicianService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(TechnicianModel.name)
    private readonly technicianModel: Model<TechnicianDocument>,
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.technicianModel.countDocuments();
    if (count === 0) {
      await this.technicianModel.insertMany([
        { nombre: 'Martin Armas', activo: true },
        { nombre: 'Kevin Armas', activo: true },
      ]);
    }
  }

  async list(onlyActive = true): Promise<TechnicianView[]> {
    const filter = onlyActive ? { activo: true } : {};
    const docs = await this.technicianModel.find(filter).sort({ nombre: 1 });
    return Promise.all(docs.map((doc) => this.toView(doc)));
  }

  async create(nombre: string): Promise<TechnicianView> {
    const doc = new this.technicianModel({
      nombre: nombre.trim(),
      activo: true,
    });
    const saved = await doc.save();
    this.realtime?.publish('tickets');
    return this.toView(saved);
  }

  async update(
    id: string,
    input: { nombre?: string; activo?: boolean },
  ): Promise<TechnicianView | null> {
    const current = await this.technicianModel.findById(id);
    if (!current) return null;
    if (input.nombre !== undefined) {
      current.nombre = input.nombre.trim();
    }
    if (input.activo !== undefined) {
      current.activo = input.activo;
    }
    const saved = await current.save();
    this.realtime?.publish('tickets');
    return this.toView(saved);
  }

  private async toView(doc: TechnicianDocument): Promise<TechnicianView> {
    const id = doc._id.toString();
    return {
      id,
      nombre: doc.nombre,
      activo: doc.activo,
      ticketsEnCurso: await this.ticketRepository.countActiveByTecnicoId(id),
    };
  }
}

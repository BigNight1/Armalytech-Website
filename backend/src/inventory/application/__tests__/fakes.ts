import { Brand } from '../../domain/brand.entity';
import { BrandRepository } from '../../domain/brand-repository.port';
import { InventoryModel } from '../../domain/model.entity';
import { ModelRepository } from '../../domain/model-repository.port';
import { Part, PartSearchResult } from '../../domain/part.entity';
import {
  CreatePartInput,
  PartRepository,
  UpdatePartInput,
} from '../../domain/part-repository.port';

let seq = 1;
function nextId(): string {
  return String(seq++);
}

export class FakeBrandRepository implements BrandRepository {
  brands: Brand[] = [];

  async findAll(): Promise<Brand[]> {
    return [...this.brands].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Brand | null> {
    return this.brands.find((b) => b.id === id) ?? null;
  }

  async findByNameCaseInsensitive(name: string): Promise<Brand | null> {
    const lower = name.trim().toLowerCase();
    return this.brands.find((b) => b.name.toLowerCase() === lower) ?? null;
  }

  async create(name: string): Promise<Brand> {
    const brand: Brand = { id: nextId(), name };
    this.brands.push(brand);
    return brand;
  }

  async update(id: string, name: string): Promise<Brand | null> {
    const brand = this.brands.find((b) => b.id === id);
    if (!brand) return null;
    brand.name = name;
    return brand;
  }

  async deleteCascade(id: string): Promise<boolean> {
    const idx = this.brands.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.brands.splice(idx, 1);
    return true;
  }
}

export class FakeModelRepository implements ModelRepository {
  models: InventoryModel[] = [];

  async findByBrand(brandId: string): Promise<InventoryModel[]> {
    return this.models.filter((m) => m.brandId === brandId);
  }

  async findById(id: string): Promise<InventoryModel | null> {
    return this.models.find((m) => m.id === id) ?? null;
  }

  async create(brandId: string, name: string): Promise<InventoryModel> {
    const model: InventoryModel = { id: nextId(), brandId, name };
    this.models.push(model);
    return model;
  }

  async update(id: string, name: string): Promise<InventoryModel | null> {
    const model = this.models.find((m) => m.id === id);
    if (!model) return null;
    model.name = name;
    return model;
  }

  async deleteCascade(id: string): Promise<boolean> {
    const idx = this.models.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.models.splice(idx, 1);
    return true;
  }
}

export class FakePartRepository implements PartRepository {
  parts: Part[] = [];

  async findByModel(modelId: string): Promise<Part[]> {
    return this.parts.filter((p) => p.modelId === modelId);
  }

  async findById(id: string): Promise<Part | null> {
    return this.parts.find((p) => p.id === id) ?? null;
  }

  async create(modelId: string, input: CreatePartInput): Promise<Part> {
    const part: Part = { id: nextId(), modelId, ...input };
    this.parts.push(part);
    return part;
  }

  async update(id: string, input: UpdatePartInput): Promise<Part | null> {
    const part = this.parts.find((p) => p.id === id);
    if (!part) return null;
    Object.assign(part, input);
    return part;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.parts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.parts.splice(idx, 1);
    return true;
  }

  async adjustQuantity(
    id: string,
    delta: number,
  ): Promise<Part | null | undefined> {
    const part = this.parts.find((p) => p.id === id);
    if (!part) return null;
    if (part.quantity + delta < 0) return undefined;
    part.quantity += delta;
    return part;
  }

  async search(query: string): Promise<PartSearchResult[]> {
    const lower = query.toLowerCase();
    return this.parts
      .filter((p) => p.name.toLowerCase().includes(lower))
      .map((p) => ({ ...p, modelName: '', brandName: '' }));
  }
}

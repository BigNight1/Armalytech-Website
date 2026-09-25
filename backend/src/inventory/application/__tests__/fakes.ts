import { Brand } from '../../domain/brand.entity';
import { BrandRepository } from '../../domain/brand-repository.port';
import { Phone, PhoneWithBrand } from '../../domain/phone.entity';
import {
  PhoneRepository,
  UpdatePhoneInput,
} from '../../domain/phone-repository.port';
import { Category } from '../../domain/category.entity';
import { CategoryRepository } from '../../domain/category-repository.port';
import {
  ProductBrandRef,
  ProductCategoryRef,
  ProductPhoneRef,
  Product,
} from '../../domain/product.entity';
import {
  CreateProductInput,
  ProductListFilter,
  ProductListResult,
  ProductRepository,
  UpdateProductInput,
} from '../../domain/product-repository.port';
import { StockMovement } from '../../domain/stock-movement.entity';
import {
  CreateStockMovementInput,
  StockMovementListResult,
  StockMovementRepository,
} from '../../domain/stock-movement-repository.port';

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

  async findByIds(ids: string[]): Promise<Brand[]> {
    return this.brands.filter((b) => ids.includes(b.id));
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

  async delete(id: string): Promise<boolean> {
    const idx = this.brands.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.brands.splice(idx, 1);
    return true;
  }
}

export class FakePhoneRepository implements PhoneRepository {
  phones: Phone[] = [];

  constructor(private readonly brandsRepo: FakeBrandRepository) {}

  async findAll(brandId?: string): Promise<Phone[]> {
    const phones = brandId
      ? this.phones.filter((p) => p.brandId === brandId)
      : this.phones;
    return [...phones].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Phone | null> {
    return this.phones.find((p) => p.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Phone[]> {
    return this.phones.filter((p) => ids.includes(p.id));
  }

  async findByBrandAndNameCaseInsensitive(
    brandId: string,
    name: string,
  ): Promise<Phone | null> {
    const lower = name.trim().toLowerCase();
    return (
      this.phones.find(
        (p) => p.brandId === brandId && p.name.toLowerCase() === lower,
      ) ?? null
    );
  }

  async searchByNameWithBrand(query: string): Promise<PhoneWithBrand[]> {
    const lower = query.toLowerCase();
    const matches = this.phones.filter((p) =>
      p.name.toLowerCase().includes(lower),
    );
    return this.withBrandNames(matches);
  }

  async findByIdsWithBrand(ids: string[]): Promise<PhoneWithBrand[]> {
    return this.withBrandNames(this.phones.filter((p) => ids.includes(p.id)));
  }

  async create(brandId: string, name: string): Promise<Phone> {
    const phone: Phone = { id: nextId(), brandId, name };
    this.phones.push(phone);
    return phone;
  }

  async update(id: string, input: UpdatePhoneInput): Promise<Phone | null> {
    const phone = this.phones.find((p) => p.id === id);
    if (!phone) return null;
    if (input.brandId !== undefined) phone.brandId = input.brandId;
    if (input.name !== undefined) phone.name = input.name;
    return phone;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.phones.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.phones.splice(idx, 1);
    return true;
  }

  private async withBrandNames(phones: Phone[]): Promise<PhoneWithBrand[]> {
    return phones.map((p) => ({
      ...p,
      brandName:
        this.brandsRepo.brands.find((b) => b.id === p.brandId)?.name ?? '',
    }));
  }
}

export class FakeCategoryRepository implements CategoryRepository {
  categories: Category[] = [];

  async findAll(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find((c) => c.id === id) ?? null;
  }

  async findByNameCaseInsensitive(name: string): Promise<Category | null> {
    const lower = name.trim().toLowerCase();
    return this.categories.find((c) => c.name.toLowerCase() === lower) ?? null;
  }

  async create(name: string): Promise<Category> {
    const category: Category = { id: nextId(), name };
    this.categories.push(category);
    return category;
  }

  async update(id: string, name: string): Promise<Category | null> {
    const category = this.categories.find((c) => c.id === id);
    if (!category) return null;
    category.name = name;
    return category;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.categories.splice(idx, 1);
    return true;
  }

  async count(): Promise<number> {
    return this.categories.length;
  }
}

interface FakeProductRecord {
  id: string;
  categoryId: string;
  brandId: string | null;
  name: string;
  model?: string;
  stock: number;
  cost: number;
  salePrice: number;
  minStock: number;
  compatiblePhoneIds: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FakeProductRepository implements ProductRepository {
  records: FakeProductRecord[] = [];

  constructor(
    private readonly categoriesRepo: FakeCategoryRepository,
    private readonly brandsRepo: FakeBrandRepository,
    private readonly phonesRepo: FakePhoneRepository,
  ) {}

  async list(filter: ProductListFilter): Promise<ProductListResult> {
    let matchedPhones: PhoneWithBrand[] = [];
    let matchedPhoneIds: string[] = [];
    let matchedBrandIds: string[] = [];

    let records = [...this.records];

    if (filter.q && filter.q.trim()) {
      const lower = filter.q.trim().toLowerCase();
      matchedPhones = await this.phonesRepo.searchByNameWithBrand(lower);
      matchedPhoneIds = matchedPhones.map((p) => p.id);
      matchedBrandIds = this.brandsRepo.brands
        .filter((b) => b.name.toLowerCase().includes(lower))
        .map((b) => b.id);

      records = records.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          (r.model ?? '').toLowerCase().includes(lower) ||
          (r.brandId !== null && matchedBrandIds.includes(r.brandId)) ||
          r.compatiblePhoneIds.some((id) => matchedPhoneIds.includes(id)),
      );
    }

    if (filter.categoryId) {
      records = records.filter((r) => r.categoryId === filter.categoryId);
    }
    if (filter.phoneId) {
      records = records.filter((r) =>
        r.compatiblePhoneIds.includes(filter.phoneId as string),
      );
    }
    if (filter.lowStock) {
      records = records.filter((r) => r.stock <= r.minStock);
    }
    if (!filter.includeArchived) {
      records = records.filter((r) => r.active);
    }

    records.sort((a, b) => a.name.localeCompare(b.name));

    const total = records.length;
    const start = (filter.page - 1) * filter.limit;
    const page = records.slice(start, start + filter.limit);

    return {
      items: page.map((r) => this.toView(r)),
      total,
      page: filter.page,
      limit: filter.limit,
      matchedPhones,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const record = this.records.find((r) => r.id === id);
    return record ? this.toView(record) : null;
  }

  async existsByCategory(categoryId: string): Promise<boolean> {
    return this.records.some((r) => r.categoryId === categoryId);
  }

  async existsByBrand(brandId: string): Promise<boolean> {
    return this.records.some((r) => r.brandId === brandId);
  }

  async existsByCompatiblePhone(phoneId: string): Promise<boolean> {
    return this.records.some((r) => r.compatiblePhoneIds.includes(phoneId));
  }

  async create(input: CreateProductInput): Promise<Product> {
    const now = new Date();
    const record: FakeProductRecord = {
      id: nextId(),
      categoryId: input.categoryId,
      brandId: input.brandId,
      name: input.name,
      model: input.model,
      stock: input.stock,
      cost: input.cost,
      salePrice: input.salePrice,
      minStock: input.minStock,
      compatiblePhoneIds: input.compatiblePhoneIds,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(record);
    return this.toView(record);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const record = this.records.find((r) => r.id === id);
    if (!record) return null;
    if (input.categoryId !== undefined) record.categoryId = input.categoryId;
    if (input.brandId !== undefined) record.brandId = input.brandId;
    if (input.name !== undefined) record.name = input.name;
    if (input.model !== undefined) record.model = input.model;
    if (input.minStock !== undefined) record.minStock = input.minStock;
    if (input.cost !== undefined) record.cost = input.cost;
    if (input.salePrice !== undefined) record.salePrice = input.salePrice;
    if (input.compatiblePhoneIds !== undefined)
      record.compatiblePhoneIds = input.compatiblePhoneIds;
    record.updatedAt = new Date();
    return this.toView(record);
  }

  async setActive(id: string, active: boolean): Promise<Product | null> {
    const record = this.records.find((r) => r.id === id);
    if (!record) return null;
    record.active = active;
    record.updatedAt = new Date();
    return this.toView(record);
  }

  async adjustStock(
    id: string,
    delta: number,
  ): Promise<Product | null | undefined> {
    const record = this.records.find((r) => r.id === id);
    if (!record) return null;
    if (record.stock + delta < 0) return undefined;
    record.stock += delta;
    record.updatedAt = new Date();
    return this.toView(record);
  }

  private toView(record: FakeProductRecord): Product {
    const category = this.categoriesRepo.categories.find(
      (c) => c.id === record.categoryId,
    );
    const categoryRef: ProductCategoryRef = category
      ? { id: category.id, name: category.name }
      : { id: record.categoryId, name: '' };

    const brand = record.brandId
      ? this.brandsRepo.brands.find((b) => b.id === record.brandId)
      : undefined;
    const brandRef: ProductBrandRef | null = record.brandId
      ? { id: record.brandId, name: brand?.name ?? '' }
      : null;

    const compatiblePhones: ProductPhoneRef[] = record.compatiblePhoneIds
      .map((phoneId) => {
        const phone = this.phonesRepo.phones.find((p) => p.id === phoneId);
        if (!phone) return undefined;
        const phoneBrand = this.brandsRepo.brands.find(
          (b) => b.id === phone.brandId,
        );
        return {
          id: phone.id,
          name: phone.name,
          brandName: phoneBrand?.name ?? '',
        };
      })
      .filter((p): p is ProductPhoneRef => Boolean(p));

    return {
      id: record.id,
      category: categoryRef,
      brand: brandRef,
      name: record.name,
      model: record.model,
      stock: record.stock,
      cost: record.cost,
      salePrice: record.salePrice,
      minStock: record.minStock,
      compatiblePhones,
      active: record.active,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export class FakeStockMovementRepository implements StockMovementRepository {
  movements: StockMovement[] = [];

  async create(input: CreateStockMovementInput): Promise<StockMovement> {
    const movement: StockMovement = {
      id: nextId(),
      productId: input.productId,
      type: input.type,
      quantity: input.quantity,
      stockAfter: input.stockAfter,
      reference: input.reference ?? null,
      reason: input.reason,
      userId: input.userId,
      userEmail: input.userEmail,
      occurredAt: new Date(),
    };
    this.movements.push(movement);
    return movement;
  }

  async findByProduct(
    productId: string,
    page: number,
    limit: number,
  ): Promise<StockMovementListResult> {
    // Insertion order is the tiebreaker (mirrors the Mongoose repository's
    // `{ occurredAt: -1, _id: -1 }` sort) since `Date.now()` resolution is
    // coarser than these fakes' back-to-back writes.
    const items = this.movements
      .map((movement, insertionIndex) => ({ movement, insertionIndex }))
      .filter(({ movement }) => movement.productId === productId)
      .sort((a, b) => {
        const byTime =
          b.movement.occurredAt.getTime() - a.movement.occurredAt.getTime();
        return byTime !== 0 ? byTime : b.insertionIndex - a.insertionIndex;
      })
      .map(({ movement }) => movement);
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total: items.length };
  }
}

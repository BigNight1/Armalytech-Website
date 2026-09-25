import {
  StockMovement,
  StockMovementReference,
  StockMovementType,
} from './stock-movement.entity';

export const STOCK_MOVEMENT_REPOSITORY = Symbol('STOCK_MOVEMENT_REPOSITORY');

export interface CreateStockMovementInput {
  productId: string;
  type: StockMovementType;
  quantity: number;
  stockAfter: number;
  reference?: StockMovementReference | null;
  reason?: string;
  userId: string;
  userEmail: string;
}

export interface StockMovementListResult {
  items: StockMovement[];
  total: number;
}

export interface StockMovementRepository {
  create(input: CreateStockMovementInput): Promise<StockMovement>;
  findByProduct(
    productId: string,
    page: number,
    limit: number,
  ): Promise<StockMovementListResult>;
}

export interface Part {
  id: string;
  modelId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface PartSearchResult extends Part {
  modelName: string;
  brandName: string;
}

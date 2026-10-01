export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  createdAt: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  description: string;
  price: number;
}

export interface UpdateProductPayload {
  name: string;
  description: string;
  price: number;
}

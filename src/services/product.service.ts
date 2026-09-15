import api from './api';

export interface Product {
  id: string;
  storeId?: string;
  sku: string;
  title: string;
  categoryName?: string;
  description?: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  customCommissionRate?: number;
  stockQuantity: number;
  isActive: boolean;
  store?: {
    id: string;
    name: string;
    defaultCommissionRate: number;
  };
}

export const productService = {
  async getProducts(params?: {
    storeId?: string;
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const res: any = await api.get('/products', { params });
    return res.data;
  },

  async getProduct(id: string): Promise<Product> {
    const res: any = await api.get(`/products/${id}`);
    return res.data;
  },

  async createProduct(data: Partial<Product> & { storeId?: string }) {
    const res: any = await api.post('/products', data);
    return res.data;
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const res: any = await api.put(`/products/${id}`, data);
    return res.data;
  },

  async softDeleteProduct(id: string) {
    const res: any = await api.delete(`/products/${id}`);
    return res.data;
  },

  async bulkUpdateCommission(productIds: string[], commissionRate: number) {
    const res: any = await api.patch('/products/bulk-commission', { productIds, commissionRate });
    return res.data;
  },
};

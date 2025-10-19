import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../app/api';

export type CreateProductPayload = {
  name: string;
  description: string;
  price: number | string;
  stockQuantity: number | string;
  category: string;
  image?: File;
  brand?: string;
  material?: string;
  weight?: number | string;
  width?: number | string;
  height?: number | string;
};

const createProduct = async (token: string, payload: CreateProductPayload): Promise<IProduct> => {
  const form = new FormData();
  form.append('name', payload.name);
  form.append('description', payload.description);
  form.append('price', String(payload.price));
  form.append('stockQuantity', String(payload.stockQuantity));
  form.append('category', payload.category);
  if (payload.brand) form.append('brand', payload.brand);
  if (payload.material) form.append('material', payload.material);
  if (payload.weight !== undefined && payload.weight !== null && payload.weight !== '') form.append('weight', String(payload.weight));
  if (payload.width !== undefined && payload.width !== null && payload.width !== '') form.append('width', String(payload.width));
  if (payload.height !== undefined && payload.height !== null && payload.height !== '') form.append('height', String(payload.height));
  if (payload.image) form.append('image', payload.image);

  const res = await api.post('/products', form, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const useCreateProductMutation = (token?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(token as string, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products','all'] });
    }
  });
};

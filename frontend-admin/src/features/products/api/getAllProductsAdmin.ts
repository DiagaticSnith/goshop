import { useQuery } from '@tanstack/react-query';
import { api } from '../../../app/api';

const getAllProductsAdmin = async (token: string): Promise<IProduct[]> => {
  const res = await api.get('/products/admin/all', { headers: { Authorization: `Bearer ${token}` } });
  return res.data as IProduct[];
};

export const useGetAllProductsAdminQuery = (token?: string, enabled = false) => {
  return useQuery({
    queryKey: ['products','all-admin', token],
    queryFn: () => getAllProductsAdmin(token as string),
    enabled: Boolean(token && enabled)
  });
};

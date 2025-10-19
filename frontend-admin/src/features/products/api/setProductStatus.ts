import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../app/api';

const setProductStatus = async (token: string, id: string, status: 'ACTIVE' | 'HIDDEN') => {
  const res = await api.patch(`/products/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data as IProduct;
};

export const useSetProductStatusMutation = (token?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'HIDDEN' }) => setProductStatus(token as string, id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

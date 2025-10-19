import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../app/api';

const deleteProduct = async (token: string, id: string): Promise<void> => {
  await api.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
};

export const useDeleteProductMutation = (token?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(token as string, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

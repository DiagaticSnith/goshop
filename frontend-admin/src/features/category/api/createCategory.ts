import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../app/api";
import { useAuth } from "../../../context/AuthContext";

export const useCreateCategoryMutation = () => {
  const qc = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: { name: string }) => {
      return api.post('/category', payload, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['category', 'all'] });
    }
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../app/api";
import { useAuth } from "../../../context/AuthContext";

export const useCreateCategoryMutation = () => {
    const qc = useQueryClient();
    const { token } = useAuth();

    return useMutation({
        mutationFn: (payload: { name: string }) => {
            // eslint-disable-next-line no-console
            console.info('[createCategory] POST', api.defaults.baseURL + '/category', payload);
            return api.post('/category', payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then(res => res.data).catch((err) => {
                // eslint-disable-next-line no-console
                console.error('[createCategory] error', err?.response?.status, err?.response?.data || err.message || err);
                throw err;
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['category', 'all'] });
        }
    });
};

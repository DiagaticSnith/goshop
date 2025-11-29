import { api } from "../../app/api";
import { useQuery } from "@tanstack/react-query";

export const getOrders = (token: string, params: Record<string, any>) => {
  return api.get('/orders', { params, headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
};

export const useGetOrders = (token: string | undefined, params: Record<string, any> | null) => {
  return useQuery({
    queryKey: ['admin', 'orders', params ? JSON.stringify(params) : 'none'],
    queryFn: () => getOrders(token || '', params || {}),
    enabled: !!token && !!params,
  });
};

export const getOrdersStats = (token: string) => {
  return api.get('/orders/stats', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
};

export const useGetOrdersStats = (token: string | undefined) => {
  return useQuery({ queryKey: ['admin','orders','stats'], queryFn: () => getOrdersStats(token || ''), enabled: !!token });
};

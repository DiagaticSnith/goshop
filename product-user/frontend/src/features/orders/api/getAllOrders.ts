import { api } from "../../../app/api";
import { useQuery } from "@tanstack/react-query";

export type OrdersListParams = {
    search?: string;
    sortBy?: 'createdAt' | 'amount';
    sortDir?: 'asc' | 'desc';
    from?: string; // ISO date
    to?: string; // ISO date
    page?: number;
    pageSize?: number;
}

type OrdersListResponse = {
    data: IOrder[];
    total: number;
    page: number;
    pageSize: number;
}

const getAllOrders = (token: string, params: OrdersListParams = {}): Promise<OrdersListResponse> => {
    return api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params
    }).then(response => response.data);
};

export const useGetAllOrdersQuery = (token: string, isAdmin?: boolean, params: OrdersListParams = {}) => {
    return useQuery<OrdersListResponse>({
        queryKey: ["orders", "all", params],
        queryFn: () => getAllOrders(token, params),
        enabled: !!(isAdmin && token)
    });
};
import { api } from "../../../app/api";
import { useQuery } from "@tanstack/react-query";

type OrdersStats = {
    totalOrders: number;
    totalRevenue: number;
    statsByDay: { date: string; count: number; revenue: number }[];
}

const getOrdersStats = (token: string): Promise<OrdersStats> => {
    return api.get("/orders/stats", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then(response => response.data);
}

export const useGetOrdersStatsQuery = (token: string, isAdmin?: boolean) => {
    return useQuery({
        queryKey: ["orders", "stats"],
        queryFn: () => getOrdersStats(token),
        enabled: !!isAdmin && !!token
    });
}

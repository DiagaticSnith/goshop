import { api } from "../../../app/api";
import { useQuery } from "@tanstack/react-query";

const getAllOrders = (token: string): Promise<IOrder[]> => {
    return api.get("/orders", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).then(response => (response.data?.data ?? response.data ?? []));
};

export const useGetAllOrdersQuery = (token: string, isAdmin?: boolean) => {
    return useQuery({
        queryKey: ["orders", "all", "detailed", token],
        queryFn: () => getAllOrders(token),
        enabled: Boolean(isAdmin && token)
    });
};

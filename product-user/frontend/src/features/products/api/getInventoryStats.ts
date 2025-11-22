import { api } from "../../../app/api";
import { useQuery } from "@tanstack/react-query";

type InventoryStats = {
  productsCount: number;
  totalStock: number;
  outOfStockCount: number;
  lowStockCount: number;
};

const getInventoryStats = (token: string): Promise<InventoryStats> => {
  return api
    .get("/products/stats/inventory", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => res.data as InventoryStats);
};

export const useGetInventoryStatsQuery = (token?: string, isAdmin?: boolean) => {
  return useQuery<InventoryStats>({
    queryKey: ["products", "inventory-stats"],
    queryFn: () => getInventoryStats(token || ""),
    enabled: !!(isAdmin && token),
  });
};

export type { InventoryStats };

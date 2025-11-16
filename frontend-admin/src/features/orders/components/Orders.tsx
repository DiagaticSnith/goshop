import React, { useMemo } from "react";
import { useGetAllOrdersQuery } from "../api/getAllOrders";
import { useAuth } from "../../../context/AuthContext";
import { OrderPreview } from "./OrderPreview";
import { MdOutlineRemoveShoppingCart } from "react-icons/md";

export const Orders = () => {
    const { token, isAdmin } = useAuth();
    const { data: ordersAdmin, refetch } = useGetAllOrdersQuery(token, isAdmin);

    const ordersComponent = useMemo(() => {
        if (!ordersAdmin) return null;
        if (isAdmin && ordersAdmin.length > 0) {
            return ordersAdmin.map((order) => {
                const parsedItems = typeof order.items === "string" ? (()=>{
                    try { return JSON.parse(order.items as string); } catch { return []; }
                })() : (order.items || order.details || []);
                return (
                    <OrderPreview key={order.id} {...order} items={parsedItems} onRefresh={refetch} />
                );
            });
        }
        return null;
    }, [ordersAdmin, isAdmin]);

    if (ordersComponent) {
        return (
            <div className="mt-4 p-5 bg-white drop-shadow-custom rounded-md h-full">
                <h3 className="font-semibold text-xl sm:text-3xl mb-8">
          Manage Orders
                </h3>
                {ordersComponent}
            </div>
        );
    }

    return (
        <div className="mt-4 p-5 bg-white drop-shadow-custom rounded-md h-full">
            <h3 className="font-semibold text-xl sm:text-3xl mb-4">Manage Orders</h3>
            <div className="py-10 flex flex-col items-center text-secondary">
                <MdOutlineRemoveShoppingCart className="w-16 h-16" />
                <h4 className="text-xl font-semibold mt-2">No orders yet...</h4>
            </div>
        </div>
    );
};

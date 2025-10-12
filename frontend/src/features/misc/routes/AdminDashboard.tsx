import React from "react";
const ManageCategories = React.lazy(() => import("../../category/routes/ManageCategories"));
import Navbar from "../../../components/Elements/Navbar";
import { AdminProducts } from "../../products/components/AdminProducts";
import { useGetAllOrdersQuery, OrdersListParams } from "../../orders/api/getAllOrders";
import { OrderPreview } from "../../orders/components/OrderPreview";
import { useAuth } from "../../../context/AuthContext";
import { useGetOrdersStatsQuery } from "../../orders/api/getOrdersStats";

const AdminOrdersStats = ({ token, isAdmin }: { token: string; isAdmin?: boolean }) => {
    const { data, isLoading } = useGetOrdersStatsQuery(token, isAdmin);

    if (!isAdmin) return null;
    if (isLoading || !data) return <div className="mb-6 p-4 bg-white rounded-md drop-shadow-custom">Loading stats...</div>;

    return (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-md drop-shadow-custom">
                <h6 className="text-secondary">Total Orders</h6>
                <p className="font-semibold text-2xl">{data.totalOrders}</p>
            </div>
            <div className="p-4 bg-white rounded-md drop-shadow-custom">
                <h6 className="text-secondary">Total Revenue</h6>
                <p className="font-semibold text-2xl">${data.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white rounded-md drop-shadow-custom">
                <h6 className="text-secondary">Last 7 days</h6>
                <ul className="mt-2 text-sm text-secondary space-y-1">
                    {data.statsByDay.map(s => (
                        <li key={s.date} className="flex justify-between">
                            <span>{s.date}</span>
                            <span className="font-medium">{s.count} / ${s.revenue.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export const AdminDashboard = () => {
    const { isAdmin, token } = useAuth();
    const [selectedTab, setSelectedTab] = React.useState<"products" | "orders" | "stats" | "categories">("products");

    // Orders filters state
    const [search, setSearch] = React.useState("");
    const [from, setFrom] = React.useState<string | undefined>(undefined);
    const [to, setTo] = React.useState<string | undefined>(undefined);
    const [sortBy, setSortBy] = React.useState<OrdersListParams['sortBy']>('createdAt');
    const [sortDir, setSortDir] = React.useState<OrdersListParams['sortDir']>('desc');
    const [page, setPage] = React.useState(1);
    const pageSize = 20;

    const ordersParams: OrdersListParams = React.useMemo(() => ({
        search: search || undefined,
        from,
        to,
        sortBy,
        sortDir,
        page,
        pageSize
    }), [search, from, to, sortBy, sortDir, page]);

    const { data: ordersResp, isLoading: ordersLoading } = useGetAllOrdersQuery(token || "", isAdmin, ordersParams);

    // simple client-side guard - ProtectedRoute ensures authenticated
    if (!isAdmin) {
        return (
            <div className="container">
                <Navbar />
                <div className="p-8">You don't have access to the admin dashboard.</div>
            </div>
        );
    }

    return (
        <div className="container">
            <Navbar />

            <div className="mt-6 bg-white rounded-md shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setSelectedTab("products")}
                            className={`px-4 py-2 rounded-md font-medium transition ${selectedTab === "products" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setSelectedTab("stats")}
                            className={`px-4 py-2 rounded-md font-medium transition ${selectedTab === "stats" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                            Orders
                        </button>
                        <button
                            onClick={() => setSelectedTab("categories")}
                            className={`px-4 py-2 rounded-md font-medium transition ${selectedTab === "categories" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                            Categories
                        </button>
                    </div>
                </div>

                <div>
                    {selectedTab === "stats" ? (
                        <div>
                            <AdminOrdersStats token={token} isAdmin={isAdmin} />

                            {/* Orders UI directly under stats as requested */}
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        placeholder="Search by order id or user email"
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        className="px-3 py-2 border rounded-md w-64"
                                    />
                                    <label className="text-sm">From</label>
                                    <input type="date" value={from || ''} onChange={(e) => { setFrom(e.target.value || undefined); setPage(1); }} className="px-2 py-1 border rounded-md" />
                                    <label className="text-sm">To</label>
                                    <input type="date" value={to || ''} onChange={(e) => { setTo(e.target.value || undefined); setPage(1); }} className="px-2 py-1 border rounded-md" />
                                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1 border rounded-md">
                                        <option value="createdAt">Date</option>
                                        <option value="amount">Amount</option>
                                    </select>
                                    <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)} className="px-2 py-1 border rounded-md">
                                        <option value="desc">Desc</option>
                                        <option value="asc">Asc</option>
                                    </select>
                                </div>

                                <div className="bg-white rounded-md drop-shadow-custom p-4">
                                    {ordersLoading && <div>Loading orders...</div>}
                                    {!ordersLoading && ordersResp && ordersResp.data.length === 0 && <div>No orders found.</div>}
                                    {!ordersLoading && ordersResp && ordersResp.data.length > 0 && (
                                        <div className="space-y-3">
                                            {ordersResp.data.map(order => (
                                                <OrderPreview key={order.id} {...order} items={typeof order.items === 'string' ? JSON.parse(order.items) : order.items} />
                                            ))}

                                            <div className="flex items-center justify-between">
                                                <div>Showing page {ordersResp.page} ({ordersResp.total} results)</div>
                                                <div className="space-x-2">
                                                    <button disabled={ordersResp.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
                                                    <button disabled={(ordersResp.page * pageSize) >= ordersResp.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded">Next</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : selectedTab === 'categories' ? (
                        <div>
                            {/* Lazy import ManageCategories to avoid cyclic deps */}
                            <React.Suspense fallback={<div>Loading categories...</div>}>
                                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                {/* @ts-ignore */}
                                <ManageCategories />
                            </React.Suspense>
                        </div>
                    ) : (
                        <div>
                            <AdminProducts />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

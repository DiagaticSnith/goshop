import React from "react";
import { useSearchParams } from "react-router-dom";
const ManageCategories = React.lazy(() => import("../../category/routes/ManageCategories"));
import Navbar from "../../../components/Elements/Navbar";
import { AdminProducts } from "../../products/components/AdminProducts";
import { AdminUsers } from "../../users/components/AdminUsers";
import { useGetInventoryStatsQuery } from "../../products/api/getInventoryStats";
import { useGetAllOrdersQuery, OrdersListParams } from "../../orders/api/getAllOrders";
import { OrderPreview } from "../../orders/components/OrderPreview";
import { useAuth } from "../../../context/AuthContext";
import { useGetOrdersStatsQuery } from "../../orders/api/getOrdersStats";

const MiniLine = ({ points, color = "#3b82f6" }: { points?: number[]; color?: string }) => {
    const width = 240; const height = 60;
    if (!Array.isArray(points) || points.length === 0) return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}></svg>
    );
    const max = Math.max(...points, 1); const min = Math.min(...points, 0);
    const norm = (v: number) => (height - 10) - ((v - min) / (max - min || 1)) * (height - 20);
    const step = width / (points.length - 1 || 1);
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${norm(p)}`).join(' ');
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <path d={d} stroke={color} strokeWidth={2} fill="none" />
        </svg>
    );
};

const AdminOrdersStats = ({ token, isAdmin }: { token: string; isAdmin?: boolean }) => {
    const { data, isLoading } = useGetOrdersStatsQuery(token, isAdmin);

    if (!isAdmin) return null;
    if (isLoading || !data) return <div className="mb-6 p-4 bg-white rounded-md drop-shadow-custom">Loading stats...</div>;

    const counts = Array.isArray(data.statsByDay) ? data.statsByDay.map(s => s.count) : [];
    const revenue = Array.isArray(data.statsByDay) ? data.statsByDay.map(s => s.revenue) : [];

    return (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-md drop-shadow-custom">
                <h6 className="text-secondary">Total Orders</h6>
                <p className="font-semibold text-2xl">{data.totalOrders}</p>
                <div className="mt-2"><MiniLine points={counts} color="#10b981" /></div>
            </div>
            <div className="p-4 bg-white rounded-md drop-shadow-custom">
                <h6 className="text-secondary">Total Revenue</h6>
                <p className="font-semibold text-2xl">${data.totalRevenue.toFixed(2)}</p>
                <div className="mt-2"><MiniLine points={revenue} color="#f59e0b" /></div>
            </div>
            <div className="p-4 bg-white rounded-md drop-shadow-custom">
                <h6 className="text-secondary">Last 7 days</h6>
                <ul className="mt-2 text-sm text-secondary space-y-1">
                    {Array.isArray(data.statsByDay) && data.statsByDay.map(s => (
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
    const [searchParams, setSearchParams] = useSearchParams();
    const validTabs = ["products", "orders", "stats", "categories", "users"] as const;
    type Tab = typeof validTabs[number];
    const getInitialTab = (): Tab => {
        const t = (searchParams.get('tab') || '').toLowerCase();
        return (validTabs as readonly string[]).includes(t) ? (t as Tab) : 'stats';
    };
    const [selectedTab, setSelectedTab] = React.useState<Tab>(getInitialTab());

    React.useEffect(() => {
        // keep URL in sync
        setSearchParams(prev => {
            const p = new URLSearchParams(prev);
            p.set('tab', selectedTab);
            return p as any;
        });
    }, [selectedTab, setSearchParams]);

    // inventory stats
    const { data: invData } = useGetInventoryStatsQuery(token || "", isAdmin);

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

    // client-side guard: wait until role is resolved; only deny when explicitly false
    if (isAdmin === undefined) {
        return (
            <div className="container">
                <Navbar />
                <div className="p-8">Checking permissions…</div>
            </div>
        );
    }

    if (isAdmin === false) {
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
                        <button
                            onClick={() => setSelectedTab("users")}
                            className={`px-4 py-2 rounded-md font-medium transition ${selectedTab === "users" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                            Users
                        </button>
                    </div>
                </div>

                <div>
                    {selectedTab === "stats" ? (
                        <div>
                            {/* Inventory tiles */}
                            {invData && (
                                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-white rounded-md drop-shadow-custom">
                                        <h6 className="text-secondary">Products</h6>
                                        <p className="font-semibold text-2xl">{invData.productsCount}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-md drop-shadow-custom">
                                        <h6 className="text-secondary">Total Stock</h6>
                                        <p className="font-semibold text-2xl">{invData.totalStock}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-md drop-shadow-custom">
                                        <h6 className="text-secondary">Out of Stock</h6>
                                        <p className="font-semibold text-2xl">{invData.outOfStockCount}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-md drop-shadow-custom">
                                        <h6 className="text-secondary">Low Stock (≤5)</h6>
                                        <p className="font-semibold text-2xl">{invData.lowStockCount}</p>
                                    </div>
                                </div>
                            )}
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
                                                <OrderPreview key={order.id} {...order} />
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
                    ) : selectedTab === 'users' ? (
                        <div>
                            <AdminUsers />
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

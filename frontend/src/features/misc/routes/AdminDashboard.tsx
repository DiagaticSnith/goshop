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
import { useGetOrdersReportQuery, exportOrdersReport } from "../../reports/api";

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

    // Reports state
    const [reportType, setReportType] = React.useState<'revenue'|'top_products'|'by_status'>('revenue');
    const [reportFrom, setReportFrom] = React.useState<string | undefined>(undefined);
    const [reportTo, setReportTo] = React.useState<string | undefined>(undefined);
    const [groupBy, setGroupBy] = React.useState<'day'|'week'|'month'>('day');
    const [reportLimit, setReportLimit] = React.useState<number>(10);
    const [reportParams, setReportParams] = React.useState<any | null>(null);

    const reportQuery = useGetOrdersReportQuery(token || "", reportParams);

    const handleExport = async () => {
        if (!token) return;
        try {
            const body = reportParams || { type: reportType, from: reportFrom, to: reportTo, groupBy, limit: reportLimit };
            const resp = await exportOrdersReport(token || "", body);
            const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = resp.headers['content-disposition']?.split('filename=')[1] || 'report.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('export failed', e);
        }
    };

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

                            {/* Reports panel */}
                            <div className="bg-white rounded-md drop-shadow-custom p-4 mt-6">
                                <h4 className="font-semibold mb-3">Order Reports</h4>
                                <div className="flex items-center gap-2 mb-3">
                                    <select id="reportType" defaultValue="revenue" onChange={(e) => setReportType(e.target.value as any)} className="px-2 py-1 border rounded-md">
                                        <option value="revenue">Revenue</option>
                                        <option value="top_products">Top Products</option>
                                        <option value="by_status">Orders by Status</option>
                                    </select>
                                    <label className="text-sm">From</label>
                                    <input type="date" value={reportFrom || ''} onChange={(e) => setReportFrom(e.target.value || undefined)} className="px-2 py-1 border rounded-md" />
                                    <label className="text-sm">To</label>
                                    <input type="date" value={reportTo || ''} onChange={(e) => setReportTo(e.target.value || undefined)} className="px-2 py-1 border rounded-md" />
                                    {reportType === 'revenue' && (
                                        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="px-2 py-1 border rounded-md">
                                            <option value="day">Day</option>
                                            <option value="week">Week</option>
                                            <option value="month">Month</option>
                                        </select>
                                    )}
                                    <button onClick={() => setReportParams({ type: reportType as any, from: reportFrom, to: reportTo, groupBy, limit: reportLimit })} className="px-3 py-1 bg-primary text-white rounded">Generate</button>
                                    <button onClick={handleExport} className="px-3 py-1 border rounded">Export CSV</button>
                                </div>

                                <div>
                                    {reportQuery?.isLoading && <div>Loading report…</div>}
                                    {reportQuery?.data && reportParams?.type === 'revenue' && (
                                        <div>
                                            <h5 className="font-medium mb-2">Revenue ({reportParams.from || 'N/A'} → {reportParams.to || 'N/A'})</h5>
                                            <MiniLine points={Array.isArray(reportQuery.data.data) ? reportQuery.data.data.map((d:any)=>d.revenue) : []} />
                                            <ul className="mt-2 text-sm text-secondary">
                                                {Array.isArray(reportQuery.data.data) && reportQuery.data.data.map((d:any) => (
                                                    <li key={d.label} className="flex justify-between"><span>{d.label}</span><span>${(d.revenue||0).toFixed(2)} ({d.orders} orders)</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {reportQuery?.data && reportParams?.type === 'top_products' && (
                                        <div>
                                            <h5 className="font-medium mb-2">Top Products</h5>
                                            <table className="w-full text-sm">
                                                <thead><tr><th className="text-left">Product</th><th>Qty</th><th>Revenue</th></tr></thead>
                                                <tbody>
                                                    {Array.isArray(reportQuery.data.data) && reportQuery.data.data.map((p:any) => (
                                                        <tr key={p.productId}><td>{p.name}</td><td className="text-center">{p.sold}</td><td className="text-right">${(p.revenue||0).toFixed(2)}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {reportQuery?.data && reportParams?.type === 'by_status' && (
                                        <div>
                                            <h5 className="font-medium mb-2">Orders by status</h5>
                                            <ul>
                                                {Array.isArray(reportQuery.data.data) && reportQuery.data.data.map((s:any) => (
                                                    <li key={s.status}>{s.status}: {s.count}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

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

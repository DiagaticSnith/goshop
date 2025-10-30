import { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../app/api';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { OrderPreview } from './OrderPreview';

type OrdersStats = { totalOrders: number; totalRevenue: number; statsByDay: { date: string; count: number; revenue: number }[] };
type InventoryStats = { productsCount: number; totalStock: number; outOfStockCount: number; lowStockCount: number };

const useOrdersStats = (token?: string, isAdmin?: boolean) => {
  return useQuery({
    queryKey: ['orders','stats', token],
    queryFn: async (): Promise<OrdersStats> => {
      const res = await api.get('/orders/stats', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    enabled: Boolean(token && isAdmin)
  });
};

const useInventoryStats = (token?: string, isAdmin?: boolean) => {
  return useQuery({
    queryKey: ['products','stats','inventory', token],
    queryFn: async (): Promise<InventoryStats> => {
      const res = await api.get('/products/stats/inventory', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    enabled: Boolean(token && isAdmin)
  });
};

export default function AdminOrdersDashboard() {
  const { token, isAdmin } = useAuth();
  const ordersStats = useOrdersStats(token, isAdmin);
  const inventoryStats = useInventoryStats(token, isAdmin);

  const last7 = ordersStats.data?.statsByDay ?? [];
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date'|'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [status, setStatus] = useState<'ALL'|'PENDING'|'CONFIRMED'|'REJECTED'>('ALL');

  const ordersQuery = useQuery({
    queryKey: ['orders','list', { search, from, to, sortBy, sortDir, status }, token],
    queryFn: async () => {
      const res = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, from, to, sortBy: sortBy === 'date' ? 'createdAt' : 'amount', sortDir, status: status === 'ALL' ? undefined : status }
      });
      return res.data as { data: any[]; total: number };
    },
    enabled: Boolean(token && isAdmin)
  });

  return (
    <div className="mt-4 p-5 bg-white drop-shadow-custom rounded-md h-full">
      {/* Top stats (remove out of stock & low stock) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div>
          <div className="text-sm text-gray-600">Products</div>
          <div className="text-2xl font-semibold">{inventoryStats.data?.productsCount ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Stock</div>
          <div className="text-2xl font-semibold">{inventoryStats.data?.totalStock ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-semibold">{ordersStats.data?.totalOrders ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-semibold">${(ordersStats.data?.totalRevenue ?? 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders count chart */}
        <div>
          <div className="text-sm text-gray-600 mb-2">Last 7 days — Orders</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last7}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Revenue chart */}
        <div>
          <div className="text-sm text-gray-600 mb-2">Last 7 days — Revenue</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last7}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Removed the side summary list as requested */}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-3 py-2 text-sm grow min-w-[220px]" placeholder="Search by order id or user email" />
        <label className="text-sm text-gray-600">From</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        <label className="text-sm text-gray-600">To</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        <select value={status} onChange={e => setStatus(e.target.value as any)} className="border rounded px-2 py-2 text-sm">
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border rounded px-2 py-2 text-sm">
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </select>
        <select value={sortDir} onChange={e => setSortDir(e.target.value as any)} className="border rounded px-2 py-2 text-sm">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {/* Orders list using OrderPreview (same UI style as user app) */}
      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-3">Orders</h3>
        {ordersQuery.data?.data?.length ? (
          <div>
            {ordersQuery.data.data.map((o: any) => (
              <OrderPreview key={o.id} {...o} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No orders found.</div>
        )}
      </div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const onToggle = (id: number) => setExpanded(expanded === id ? null : id);

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-3 py-2 w-10"></th>
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Address</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((o: any) => {
            const createdAt = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';
            const parsedItems = Array.isArray(o.items)
              ? o.items
              : typeof o.items === 'string'
              ? (() => { try { return JSON.parse(o.items); } catch { return []; } })()
              : [];
            const lines = (o.details && o.details.length > 0) ? o.details : parsedItems;
            const isOpen = expanded === o.id;
            return (
              <React.Fragment key={o.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 align-top">
                    <button onClick={() => onToggle(o.id)} className="w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center" aria-label="Expand">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </td>
                  <td className="align-top px-3 py-2 font-semibold">#{o.id}</td>
                  <td className="align-top px-3 py-2">{createdAt}</td>
                  <td className="align-top px-3 py-2">{o.user?.email ?? 'N/A'}</td>
                  <td className="align-top px-3 py-2 max-w-[260px] truncate" title={`${o.address || ''}${o.country ? `, ${o.country}` : ''}`}>{o.address}{o.country ? `, ${o.country}` : ''}</td>
                  <td className="align-top px-3 py-2 text-right font-semibold">${(o.amount ?? 0).toFixed(2)}</td>
                </tr>
                {isOpen && (
                  <tr className="bg-white">
                    <td colSpan={6} className="px-3 py-3">
                      <div className="border rounded-xl overflow-hidden">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Product</th>
                              <th className="px-3 py-2 text-left">Qty</th>
                              <th className="px-3 py-2 text-left">Price</th>
                              <th className="px-3 py-2 text-left">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {lines.map((it: any, idx: number) => {
                              const product = it.product;
                              const qty = it.totalQuantity ?? it.quantity ?? 0;
                              const price = product?.price ?? 0;
                              const sub = it.totalPrice ?? (price * qty);
                              const img = toImageUrl(product?.image);
                              return (
                                <tr key={it.id ?? idx} className="hover:bg-neutral-50">
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-3">
                                      {img ? <img src={img} alt={product?.name} className="w-14 h-14 rounded object-cover" /> : <div className="w-14 h-14 rounded bg-gray-200" />}
                                      <div className="font-semibold">{product?.name ?? 'N/A'}</div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">{qty}</td>
                                  <td className="px-3 py-2">${Number(price).toFixed(2)}</td>
                                  <td className="px-3 py-2 font-semibold">${Number(sub).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="px-3 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
                          <div>
                            <div className="text-gray-600">Shipping details</div>
                            <div className="font-semibold">{o.user?.fullName ?? ''}</div>
                            {o.address && <div className="font-semibold">{o.address}</div>}
                          </div>
                          <div className="sm:text-right mt-2 sm:mt-0">
                            <div className="text-gray-600">Total</div>
                            <div className="text-base font-bold">${(o.amount ?? 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../app/api';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  const ordersQuery = useQuery({
    queryKey: ['orders','list', { search, from, to, sortBy, sortDir }, token],
    queryFn: async () => {
      const res = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, from, to, sortBy: sortBy === 'date' ? 'createdAt' : 'amount', sortDir }
      });
      return res.data as { data: any[]; total: number };
    },
    enabled: Boolean(token && isAdmin)
  });

  return (
    <div className="mt-4 p-5 bg-white drop-shadow-custom rounded-md h-full">
      <h2 className="text-2xl font-semibold mb-6">Admin Dashboard</h2>
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
        <div>
          <div className="text-sm text-gray-600">Products</div>
          <div className="text-2xl font-semibold">{inventoryStats.data?.productsCount ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Stock</div>
          <div className="text-2xl font-semibold">{inventoryStats.data?.totalStock ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Out of Stock</div>
          <div className="text-2xl font-semibold">{inventoryStats.data?.outOfStockCount ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Low Stock (≤5)</div>
          <div className="text-2xl font-semibold">{inventoryStats.data?.lowStockCount ?? 0}</div>
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

      {/* Side list summary of last7 like screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="hidden lg:block" />
        <div>
          <ul className="text-sm space-y-1">
            {last7.map(d => (
              <li key={d.date} className="flex justify-between">
                <span>{d.date}</span>
                <span>{d.count} / ${d.revenue.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-3 py-2 text-sm grow min-w-[220px]" placeholder="Search by order id or user email" />
        <label className="text-sm text-gray-600">From</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        <label className="text-sm text-gray-600">To</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border rounded px-2 py-2 text-sm">
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </select>
        <select value={sortDir} onChange={e => setSortDir(e.target.value as any)} className="border rounded px-2 py-2 text-sm">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {/* Orders list moved below */}
      {ordersQuery.data?.data?.length ? (
        <ul className="divide-y">
          {ordersQuery.data.data.map((o: any) => (
            <li key={o.id} className="py-3 text-sm flex justify-between">
              <span>#{o.id} • {o.user?.email ?? 'N/A'}</span>
              <span>${(o.amount ?? 0).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-600">No orders found.</div>
      )}
    </div>
  );
}

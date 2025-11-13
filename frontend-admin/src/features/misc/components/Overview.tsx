import React from 'react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../app/api';
import { useAuth } from '../../../context/AuthContext';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Brush,
  BarChart,
  PieChart,
  Pie,
  Cell,
  LabelList,
  LineChart,
} from 'recharts';

type DayStat = { date: string; count: number; revenue: number };

const fetchOrders = async (token: string | undefined, params: Record<string, any>) => {
  const res = await api.get('/orders', { headers: { Authorization: `Bearer ${token}` }, params: { ...params, pageSize: 200 } });
  return res.data as { data: any[]; total: number };
};

export default function Overview() {
  const { token, isAdmin } = useAuth();

  // default range: last 7 days
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultTo = today.toISOString().slice(0, 10);

  const [from, setFrom] = useState<string>(defaultFrom);
  const [to, setTo] = useState<string>(defaultTo);

  // Overall totals (today / month)
  const totalsQuery = useQuery({
    queryKey: ['overview','totals', token],
    queryFn: async () => {
      if (!token) return null;
      // Orders today
      const startToday = new Date();
      startToday.setHours(0,0,0,0);
      const endToday = new Date();
      endToday.setHours(23,59,59,999);

      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startMonth.setHours(0,0,0,0);
      const endMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
      endMonth.setHours(23,59,59,999);

      const [todayRes, monthRes] = await Promise.all([
        fetchOrders(token, { from: startToday.toISOString(), to: endToday.toISOString() }),
        fetchOrders(token, { from: startMonth.toISOString(), to: endMonth.toISOString() })
      ]);

      // revenue: only CONFIRMED count; sum amounts
      const calcRevenue = (arr: any[]) => arr.filter(a => a.status === 'CONFIRMED').reduce((s, it) => s + (it.amount || 0), 0);

      // Note: avoid double-counting the same order in both "today" and "month" windows.
      // We'll expose both today/month numbers but compute pending/completed from the month range
      // so the summary cards reflect a single timeframe (month) instead of summing overlapping windows.
      return {
        ordersToday: todayRes?.total ?? 0,
        ordersMonth: monthRes?.total ?? 0,
        revenueToday: calcRevenue(todayRes?.data ?? []),
        revenueMonth: calcRevenue(monthRes?.data ?? []),
        pending: (monthRes?.data ?? []).filter(o => o.status === 'PENDING').length,
        completed: (monthRes?.data ?? []).filter(o => o.status === 'CONFIRMED').length
      };
    },
    enabled: Boolean(token && isAdmin)
  });

  const rangeQuery = useQuery({
    queryKey: ['overview','range', from, to, token],
    queryFn: async () => {
      if (!token) return { statsByDay: [] as DayStat[] };
      // fetch orders in range (pageSize 200) and aggregate by day
      const res = await fetchOrders(token, { from: new Date(from).toISOString(), to: new Date(new Date(to).getTime() + 24*60*60*1000 - 1).toISOString() });
      const items = res.data ?? [];
      const map: Record<string, DayStat> = {};
      const start = new Date(from);
      const end = new Date(to);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const key = d.toISOString().slice(0,10);
        map[key] = { date: key, count: 0, revenue: 0 };
      }
      items.forEach(it => {
        const key = new Date(it.createdAt).toISOString().slice(0,10);
        if (!map[key]) map[key] = { date: key, count: 0, revenue: 0 };
        map[key].count += 1;
        if (it.status === 'CONFIRMED') map[key].revenue += (it.amount || 0);
      });
      const stats = Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
      return { statsByDay: stats };
    },
    enabled: Boolean(token && isAdmin && from && to)
  });

  const stats = rangeQuery.data?.statsByDay ?? [];
  // fetch categories for mapping categoryId -> name
  const categoriesQuery = useQuery({
    queryKey: ['categories', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await api.get('/categories', { headers: { Authorization: `Bearer ${token}` } });
      return res.data as any[];
    },
    enabled: Boolean(token && isAdmin)
  });

  // Aggregate orders from the same range query: fetch full orders with details
  const ordersInRangeQuery = useQuery({
    queryKey: ['orders','rangeItems', from, to, token],
    queryFn: async () => {
      if (!token) return [] as any[];
      const res = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { from: new Date(from).toISOString(), to: new Date(new Date(to).getTime() + 24*60*60*1000 - 1).toISOString(), pageSize: 200 }
      });
      return res.data.data as any[];
    },
    enabled: Boolean(token && isAdmin && from && to)
  });

  const ordersRaw = ordersInRangeQuery.data ?? [];

  // Controls for line chart granularity
  const [granularity, setGranularity] = useState<'day'|'week'|'month'>('day');

  // Aggregations
  const revenueSeries = useMemo(() => {
    if (!ordersRaw) return [] as { date: string; revenue: number }[];
    const map: Record<string, number> = {};
    const fmtDay = (d: Date) => d.toISOString().slice(0,10);
    const getKey = (d: Date) => {
      if (granularity === 'day') return fmtDay(d);
      if (granularity === 'week') {
        // ISO week calculation
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
      }
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    };
    for (const o of ordersRaw) {
      const date = new Date(o.createdAt);
      const key = getKey(date);
      const rev = (o.status === 'CONFIRMED' ? (o.amount || 0) : 0);
      map[key] = (map[key] || 0) + rev;
    }
    return Object.keys(map).sort().map(k => ({ date: k, revenue: map[k] }));
  }, [ordersRaw, granularity]);

  const ordersByCategory = useMemo(() => {
    // Build a map of categoryId -> { count, name? } and prefer product-provided category name
    const map: Record<string, { count: number; name?: string }> = {};
    for (const o of ordersRaw) {
      const details = o.details || [];
      for (const d of details) {
        const categoryId = d.product?.categoryId ?? d.product?.category?.id ?? 'unknown';
        const categoryName = d.product?.category?.name ?? d.product?.categoryName ?? undefined;
        if (!map[categoryId]) map[categoryId] = { count: 0, name: categoryName };
        // prefer a name coming from product details if present
        if (!map[categoryId].name && categoryName) map[categoryId].name = categoryName;
        map[categoryId].count += d.totalQuantity || 0;
      }
    }
    const cats = categoriesQuery.data || [];
    return Object.entries(map).map(([catId, info]) => {
      const found = cats.find((c:any) => String(c.id) === String(catId));
      let name = info.name ?? found?.name ?? (catId === 'unknown' ? 'Unknown' : String(catId));
      // If name is just a numeric id (e.g. '5'), make it friendlier
      if (/^\d+$/.test(String(name))) {
        const maybe = cats.find((c:any) => String(c.id) === String(name));
        if (maybe?.name) name = maybe.name;
        else name = `Category #${name}`;
      }
      return { categoryId: catId, name, count: info.count };
    }).sort((a,b)=>b.count-a.count);
  }, [ordersRaw, categoriesQuery.data]);

  const statusPie = useMemo(() => {
    const map: Record<string, number> = { PENDING: 0, CONFIRMED: 0, REJECTED: 0 };
    for (const o of ordersRaw) {
      const s = o.status || 'PENDING';
      map[s] = (map[s] || 0) + 1;
    }
    return Object.keys(map).map(k=>({ name: k, value: map[k] }));
  }, [ordersRaw]);

  const statusColors = useMemo(() => ({ PENDING: '#f59e0b', CONFIRMED: '#10b981', REJECTED: '#ef4444' }), []);

  // Palette for category bars (cycled)
  const categoryPalette = useMemo(() => [
    '#10b981', // green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // teal
    '#f97316', // orange
    '#84cc16'  // lime
  ], []);

  // Prepare bar chart data with colors assigned per category
  const ordersByCategoryWithColor = useMemo(() => {
    const data = (ordersByCategory || []).map((c, idx) => ({
      name: c.name,
      count: c.count,
      color: categoryPalette[idx % categoryPalette.length]
    }));
    return data;
  }, [ordersByCategory, categoryPalette]);

  const topProducts = useMemo(() => {
    const map: Record<string, { id: string; name: string; qty: number }> = {};
    for (const o of ordersRaw) {
      const details = o.details || [];
      for (const d of details) {
        const pid = d.product?.id;
        if (!pid) continue;
        if (!map[pid]) map[pid] = { id: pid, name: d.product?.name || 'Unknown', qty: 0 };
        map[pid].qty += d.totalQuantity || 0;
      }
    }
    return Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,5);
  }, [ordersRaw]);

  const totalOrdersInRange = ordersRaw.length;

  const fmtCurrency = (v: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);

  return (
    <div className="mt-4 p-5 bg-white drop-shadow-custom rounded-md h-full">
      <h3 className="text-lg font-semibold mb-4">Overview</h3>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-md bg-green-50">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18"/></svg>
          </div>
          <div>
            <div className="text-xs text-gray-500">Orders Today</div>
            <div className="text-xl font-semibold">{totalsQuery.data?.ordersToday ?? '—'}</div>
            <div className="text-xs text-gray-400">Compared to yesterday</div>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-md bg-blue-50">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18M3 14h18"/></svg>
          </div>
          <div>
            <div className="text-xs text-gray-500">Orders This Month</div>
            <div className="text-xl font-semibold">{totalsQuery.data?.ordersMonth ?? '—'}</div>
            <div className="text-xs text-gray-400">Monthly total</div>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-md bg-yellow-50">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3-1.567 3-3.5S13.657 1 12 1 9 2.567 9 4.5 10.343 8 12 8zM6 21c0-4 4-7 6-7s6 3 6 7H6z"/></svg>
          </div>
          <div>
            <div className="text-xs text-gray-500">Revenue Today</div>
            <div className="text-xl font-semibold">{totalsQuery.data ? fmtCurrency(totalsQuery.data.revenueToday ?? 0) : '—'}</div>
            <div className="text-xs text-gray-400">Confirmed orders only</div>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-md bg-indigo-50">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18"/></svg>
          </div>
          <div>
            <div className="text-xs text-gray-500">Revenue This Month</div>
            <div className="text-xl font-semibold">{totalsQuery.data ? fmtCurrency(totalsQuery.data.revenueMonth ?? 0) : '—'}</div>
            <div className="text-xs text-gray-400">Confirmed orders only</div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-600">From</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        <label className="text-sm text-gray-600">To</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        <div className="ml-auto text-sm text-gray-600">Showing {stats.length} days</div>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="p-4 bg-white rounded-lg drop-shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Doanh thu</div>
            <div className="flex items-center gap-2">
              <select value={granularity} onChange={e => setGranularity(e.target.value as any)} className="border px-2 py-1 rounded">
                <option value="day">Theo ngày</option>
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
              </select>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={revenueSeries}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => fmtCurrency(Number(v))} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v:any)=>fmtCurrency(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Brush dataKey="date" height={30} stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

  <div className="p-4 bg-white rounded-lg drop-shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Số đơn theo loại sản phẩm</div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={ordersByCategoryWithColor} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fontStyle: 'normal' }}
                  interval={0}
                  // render labels in lowercase and keep them horizontal
                  tickFormatter={(v: any) => String(v).toLowerCase()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value:any) => [value, 'count']} />
                <Bar dataKey="count">
                  {ordersByCategoryWithColor.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded-lg drop-shadow-sm relative">
          <div className="text-sm text-gray-600 mb-2">Tỷ lệ trạng thái đơn</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                  {statusPie.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={statusColors[String(entry.name) as keyof typeof statusColors] || '#9ca3af'} stroke="#ffffff" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend {...({ payload: statusPie.map(e => ({ value: e.name, type: 'square', id: e.name, color: statusColors[String(e.name) as keyof typeof statusColors] || '#9ca3af' })) } as any)} layout="horizontal" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-xl font-semibold">{totalOrdersInRange}</div>
                <div className="text-xs text-gray-400">orders</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Top 5 sản phẩm bán chạy</div>
          <div className="overflow-auto">
            {topProducts.length === 0 ? (
              <div className="text-sm text-gray-500">No data</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr><th className="py-2">Product</th><th className="py-2">Qty</th></tr>
                </thead>
                <tbody>
                  {topProducts.map(p => (
                    <tr key={p.id} className="border-t"><td className="py-2">{p.name}</td><td className="py-2">{p.qty}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-2">Order status summary</div>
        <div className="flex gap-4 flex-wrap">
          <div className="p-3 border rounded-lg w-44 bg-white">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-xl font-semibold">{totalsQuery.data?.pending ?? '—'}</div>
          </div>
          <div className="p-3 border rounded-lg w-44 bg-white">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-xl font-semibold">{totalsQuery.data?.completed ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

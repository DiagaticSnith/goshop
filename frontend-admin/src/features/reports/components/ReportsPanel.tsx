import React from "react";
import { useGetOrders, useGetOrdersStats } from "../api";
import { Spinner } from "../../../features/misc/components/Spinner";

const formatCurrency = (v: number) => `$${(v||0).toFixed(2)}`;

const computeTopProducts = (orders: any[]) => {
  const map: Record<string, { productId: string; name: string; sold: number; revenue: number }> = {};
  orders.forEach(o => {
    const details = o.details || [];
    details.forEach((d: any) => {
      const id = d.productId;
      if (!map[id]) map[id] = { productId: id, name: d.product?.name || d.productName || 'Unknown', sold: 0, revenue: 0 };
      map[id].sold += d.totalQuantity || d.quantity || 0;
      map[id].revenue += d.totalPrice || (d.totalQuantity * (d.unitPrice || 0)) || 0;
    });
  });
  return Object.values(map).sort((a,b) => b.sold - a.sold);
};

const computeOrdersByStatus = (orders: any[]) => {
  const map: Record<string, number> = {};
  orders.forEach(o => {
    const s = o.status || 'UNKNOWN';
    map[s] = (map[s] || 0) + 1;
  });
  return Object.entries(map).map(([status,count])=>({ status, count }));
};

const arraySum = (arr: number[]) => arr.reduce((s,n)=>s+(n||0),0);

const ReportsPanel = ({ token }: { token: string }) => {
  const statsQuery = useGetOrdersStats(token);

  const [type, setType] = React.useState<'revenue'|'top_products'|'by_status'>('revenue');
  const [from, setFrom] = React.useState<string | undefined>(undefined);
  const [to, setTo] = React.useState<string | undefined>(undefined);
  const [params, setParams] = React.useState<Record<string, any> | null>(null);

  const ordersQuery = useGetOrders(token, params);

  const apply = () => {
    if (!from && !to) {
      setParams({});
    } else {
      const p: any = {};
      if (from) p.from = from;
      if (to) p.to = to;
      // fetch many results by setting large pageSize (careful on huge ranges)
      p.pageSize = 1000;
      p.page = 1;
      setParams(p);
    }
  };

  const handleExportTopProducts = () => {
    const orders = ordersQuery.data?.data || [];
    const top = computeTopProducts(orders);
    const rows = top.map(t => `${JSON.stringify(t.name)},${t.sold},${t.revenue.toFixed(2)}`).join('\n');
    const csv = 'Product,Quantity,Revenue\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'top-products.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-md p-4">
      <h4 className="font-semibold mb-3">Order Reports</h4>
      <div className="flex items-center gap-2 mb-3">
        <select value={type} onChange={e => setType(e.target.value as any)} className="px-2 py-1 border rounded-md">
          <option value="revenue">Revenue</option>
          <option value="top_products">Top Products</option>
          <option value="by_status">Orders by Status</option>
        </select>
        <label className="text-sm">From</label>
        <input type="date" value={from||''} onChange={e=>setFrom(e.target.value||undefined)} className="px-2 py-1 border rounded-md" />
        <label className="text-sm">To</label>
        <input type="date" value={to||''} onChange={e=>setTo(e.target.value||undefined)} className="px-2 py-1 border rounded-md" />
        <button onClick={apply} className="px-3 py-1 bg-primary text-white rounded">Apply</button>
        {type === 'top_products' && <button onClick={handleExportTopProducts} className="px-3 py-1 border rounded">Export CSV</button>}
      </div>

      <div>
        {/* Revenue: prefer statsQuery (server side short summary), fallback to compute from orders */}
        {type === 'revenue' && (
          <div>
            {(!from && !to) ? (
              statsQuery.isLoading ? <Spinner /> : (
                <div>
                  <p className="font-medium">Total Orders: {statsQuery.data?.totalOrders ?? 'N/A'}</p>
                  <p className="font-medium">Total Revenue: {formatCurrency(statsQuery.data?.totalRevenue ?? 0)}</p>
                </div>
              )
            ) : (
              ordersQuery.isLoading ? <Spinner /> : (
                <div>
                  {/* compute revenue and grouping by date */}
                  {(() => {
                    const orders = ordersQuery.data?.data || [];
                    const map: Record<string,{label:string,revenue:number,orders:number}> = {};
                    orders.forEach((o:any)=>{
                      const key = new Date(o.createdAt).toISOString().slice(0,10);
                      if (!map[key]) map[key] = { label: key, revenue:0, orders:0 };
                      map[key].orders += 1;
                      if (o.status === 'CONFIRMED') map[key].revenue += o.amount || 0;
                    });
                    const data = Object.values(map).sort((a,b)=>a.label.localeCompare(b.label));
                    return (
                      <div>
                        <p className="font-medium">Total Orders: {orders.length}</p>
                        <p className="font-medium">Total Revenue: {formatCurrency(arraySum(data.map(d=>d.revenue)))}</p>
                        <ul className="mt-2 text-sm text-secondary space-y-1">
                          {data.map(d=> <li key={d.label} className="flex justify-between"><span>{d.label}</span><span>${d.revenue.toFixed(2)} ({d.orders} orders)</span></li>)}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )
            )}
          </div>
        )}

            {type === 'top_products' && (
          <div>
            {ordersQuery.isLoading ? <Spinner /> : (
              <div>
                {(() => {
                  const orders = ordersQuery.data?.data || [];
                  const top = computeTopProducts(orders).slice(0,50);
                  return (
                    <table className="w-full text-sm">
                      <thead><tr><th className="text-left">Product</th><th className="text-center">Qty</th><th className="text-right">Revenue</th></tr></thead>
                      <tbody>
                        {top.map(t=> <tr key={t.productId}><td>{t.name}</td><td className="text-center">{t.sold}</td><td className="text-right">{formatCurrency(t.revenue)}</td></tr>)}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {type === 'by_status' && (
          <div>
            {ordersQuery.isLoading ? <Spinner /> : (
              <div>
                {(() => {
                  const orders = ordersQuery.data?.data || [];
                  const byStatus = computeOrdersByStatus(orders);
                  return (
                    <ul>
                      {byStatus.map(s=> <li key={s.status}>{s.status}: {s.count}</li>)}
                    </ul>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPanel;

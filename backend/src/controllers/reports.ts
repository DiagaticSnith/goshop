import { Request, Response } from "express";
import prisma from "../config/prisma-client";

const clampDateRange = (from?: string, to?: string) => {
    const now = new Date();
    let dTo = to ? new Date(to) : now;
    let dFrom = from ? new Date(from) : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    if (isNaN(dTo.getTime())) dTo = now;
    if (isNaN(dFrom.getTime())) dFrom = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    // ensure from <= to
    if (dFrom.getTime() > dTo.getTime()) {
        const tmp = dFrom; dFrom = dTo; dTo = tmp;
    }
    // limit span to 365 days for safety
    const maxSpan = 365 * 24 * 60 * 60 * 1000;
    if (dTo.getTime() - dFrom.getTime() > maxSpan) {
        dFrom = new Date(dTo.getTime() - maxSpan);
    }
    return { from: dFrom, to: dTo };
};

const groupByPeriod = (date: Date, period: string) => {
    const d = new Date(date);
    if (period === 'month') {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (period === 'week') {
        // ISO week-ish grouping: use year-weekNumber
        const onejan = new Date(d.getFullYear(),0,1);
        const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay()+1)/7);
        return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
    }
    // default: day
    return d.toISOString().slice(0,10);
};

export const getOrdersReport = async (req: Request, res: Response) => {
    try {
        const { type = 'revenue', from, to, groupBy = 'day', limit = '10' } = req.query as Record<string,string>;
        const { from: dFrom, to: dTo } = clampDateRange(from, to);

        if (type === 'revenue') {
            // fetch orders in range and aggregate in JS by period
            const orders = await prisma.order.findMany({
                where: { createdAt: { gte: dFrom, lte: dTo } },
                select: { createdAt: true, amount: true, status: true }
            });
            const map: Record<string, { label: string; revenue: number; orders: number }> = {};
            orders.forEach(o => {
                const key = groupByPeriod(o.createdAt, groupBy);
                if (!map[key]) map[key] = { label: key, revenue: 0, orders: 0 };
                map[key].orders += 1;
                if ((o as any).status === 'CONFIRMED') map[key].revenue += (o.amount || 0) as number;
            });
            const data = Object.values(map).sort((a,b) => a.label.localeCompare(b.label));
            const meta = { totalRevenue: data.reduce((s, r) => s + r.revenue, 0), totalOrders: orders.length };
            return res.json({ type: 'revenue', meta, data });
        }

        if (type === 'top_products') {
            // limit
            const lim = Math.min(100, Number(limit) || 10);
            // fetch order details joined with orders and products where order createdAt in range and order status is CONFIRMED
            const details = await prisma.orderDetails.findMany({
                where: {
                    order: { createdAt: { gte: dFrom, lte: dTo }, status: 'CONFIRMED' }
                },
                select: {
                    productId: true,
                    totalQuantity: true,
                    totalPrice: true,
                    product: { select: { id: true, name: true, image: true } }
                }
            });
            const map: Record<string, { productId: string; name: string; sold: number; revenue: number; image?: string }> = {};
            details.forEach(d => {
                const id = d.productId;
                if (!map[id]) map[id] = { productId: id, name: d.product?.name || 'Unknown', sold: 0, revenue: 0, image: d.product?.image };
                map[id].sold += d.totalQuantity;
                map[id].revenue += d.totalPrice;
            });
            const data = Object.values(map).sort((a,b) => b.sold - a.sold).slice(0, lim);
            const meta = { totalProducts: data.length };
            return res.json({ type: 'top_products', meta, data });
        }

        if (type === 'by_status') {
            const orders = await prisma.order.findMany({ where: { createdAt: { gte: dFrom, lte: dTo } }, select: { status: true } });
            const map: Record<string, number> = {};
            orders.forEach(o => {
                const s = (o as any).status || 'UNKNOWN';
                map[s] = (map[s] || 0) + 1;
            });
            const data = Object.entries(map).map(([status, count]) => ({ status, count }));
            return res.json({ type: 'by_status', meta: { totalOrders: orders.length }, data });
        }

        return res.status(400).json({ message: 'Invalid report type' });
    } catch (error) {
        console.error('getOrdersReport error', error);
        return res.status(500).json({ message: 'Unable to compute report', error });
    }
};

export const exportOrdersReport = async (req: Request, res: Response) => {
    try {
        const { type = 'revenue', from, to, groupBy = 'day', limit = '10', format = 'csv' } = req.body as any;
        // Reuse getOrdersReport logic by calling functions directly here (simple approach)
        // For simplicity call the same controller logic by constructing a mock req
        // But to avoid duplication, call getOrdersReport-like logic inline.
        const { from: dFrom, to: dTo } = clampDateRange(from, to);
        // Only implement CSV export for now
        if (type === 'top_products') {
            const lim = Math.min(100, Number(limit) || 10);
            const details = await prisma.orderDetails.findMany({
                where: { order: { createdAt: { gte: dFrom, lte: dTo }, status: 'CONFIRMED' } },
                select: { productId: true, totalQuantity: true, totalPrice: true, product: { select: { name: true } } }
            });
            const map: Record<string, { name: string; sold: number; revenue: number }> = {};
            details.forEach(d => {
                const id = d.productId;
                if (!map[id]) map[id] = { name: d.product?.name || 'Unknown', sold: 0, revenue: 0 };
                map[id].sold += d.totalQuantity;
                map[id].revenue += d.totalPrice;
            });
            const rows = Object.values(map).sort((a,b)=>b.sold-a.sold).slice(0, lim);
            // build CSV
            const header = 'Product,Quantity,Revenue\n';
            const body = rows.map(r => `${JSON.stringify(r.name)},${r.sold},${r.revenue.toFixed(2)}`).join('\n');
            const csv = header + body;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="top-products.csv"');
            return res.send(csv);
        }

        // Default: 400
        return res.status(400).json({ message: 'Export type not implemented' });
    } catch (error) {
        console.error('exportOrdersReport error', error);
        return res.status(500).json({ message: 'Unable to export report', error });
    }
};

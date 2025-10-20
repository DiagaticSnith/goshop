import { Request, Response } from "express";
import prisma from "../config/prisma-client";

export const getAllOrders = async (req: Request, res: Response) => {
    // Support query params for admin listing: search, sort, from, to, page, pageSize
    try {
        const {
            search = "",
            sortBy = "createdAt",
            sortDir = "desc",
            from,
            to,
            page = "1",
            pageSize = "50"
        } = req.query as Record<string, string>;

        const take = Math.min(200, parseInt(pageSize, 10) || 50);
        const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

        const where: any = {};

        // date range filter (validate)
        if (from || to) {
            const createdAt: any = {};
            if (from) {
                const d = new Date(from as string);
                if (!isNaN(d.getTime())) createdAt.gte = d;
            }
            if (to) {
                const d2 = new Date(to as string);
                if (!isNaN(d2.getTime())) createdAt.lte = d2;
            }
            if (Object.keys(createdAt).length > 0) {
                where.createdAt = createdAt;
            }
        }

        // simple text search: order id (numeric) or user email
        if (search && search.trim().length > 0) {
            const q = search.trim();
            const or: any[] = [];

            // if q is a number, try match id
            const parsed = parseInt(q, 10);
            if (!isNaN(parsed)) {
                or.push({ id: parsed });
            }

            // match user email contains (no `mode` to keep compatibility with current connector)
            or.push({ user: { email: { contains: q } } });

            if (or.length > 0) where.OR = or;
        }

        const orderBy: any = {};
        const dir = sortDir === 'asc' ? 'asc' : 'desc';
        // allow sortBy: createdAt, amount
        if (sortBy === 'amount') {
            orderBy.amount = dir;
        } else {
            orderBy.createdAt = dir;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy,
                include: { user: true, details: { include: { product: true } } },
                skip,
                take
            }),
            prisma.order.count({ where })
        ]);

        return res.status(200).json({ data: orders, total, page: parseInt(page as string, 10), pageSize: take });
    } catch (error) {
        console.error('getAllOrders error', error);
        return res.status(500).json({ message: 'Unable to fetch orders', error });
    }
};

export const getOrdersByUserId = async (req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
        where: {
            userId: req.params.id
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            user: true
        }
    });
    if (!orders) {
        return res.status(404).json({ message: "Orders not found" });
    }
    res.status(200).json(orders);

};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid order id' });

        const p: any = prisma as any;
        const order = await p.order.findUnique({
            where: { id },
            include: { user: true, details: { include: { product: true } } }
        });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // If request has uid (authenticated), ensure user can access their own order unless admin
        const uid = (req as any).uid as string | undefined;
        const role = (req as any).role as string | undefined;
        if (uid && role !== 'ADMIN' && order.userId !== uid) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error('getOrderById error', error);
        return res.status(500).json({ message: 'Unable to fetch order', error });
    }
};

export const getOrdersStats = async (req: Request, res: Response) => {
    // Thống kê đơn hàng: tổng đơn, tổng doanh thu, đơn theo ngày trong 7 ngày gần nhất
    try {
        const totalOrders = await prisma.order.count();
        const totalRevenueAggregate = await prisma.order.aggregate({
            _sum: {
                amount: true
            }
        });
        const totalRevenue = totalRevenueAggregate._sum.amount || 0;

        // Orders per day (last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // includes today (7 days)

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            select: {
                createdAt: true,
                amount: true
            }
        });

        // build map day -> count, revenue
        const statsByDay: { date: string; count: number; revenue: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            statsByDay.push({ date: key, count: 0, revenue: 0 });
        }

        orders.forEach((o: { createdAt: Date; amount?: number | null }) => {
            const key = o.createdAt.toISOString().slice(0, 10);
            const stat = statsByDay.find(s => s.date === key);
            if (stat) {
                stat.count += 1;
                stat.revenue += (o.amount || 0) as number;
            }
        });

        return res.status(200).json({ totalOrders, totalRevenue, statsByDay });
    } catch (error) {
        return res.status(500).json({ message: "Unable to compute orders stats", error });
    }
};

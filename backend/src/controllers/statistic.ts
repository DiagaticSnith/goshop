import { Request, Response} from 'express';
import prisma from '../config/prisma-client';

// GET /api/statistics/summary
export const getStatisticSummary = async (req: Request, res: Response) => {
    try {
        const totalRevenue = await prisma.order.aggregate({
            _sum: {
                amount: true,
            },
        });
        const totalOrders = await prisma.order.count();

        const totalUsers = await prisma.user.count();

        res.status(200).json({
            totalRevenue: totalRevenue._sum.amount || 0,
            totalOrders,
            totalUsers,
        });
    } catch {
        return res.status(500).json({ message: 'Internal server error'})
    }
};  

// GET /api/statistics/sales-over-time
export const getSaleOverTime = async (reg: Request, res: Response) => {
    try {
        const sales = await prisma.order.groupBy({
            by: ['createdAt'],
            _sum: {
                amount: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const formatSales = sales.map(sale => ({
            date: sale.createdAt.toISOString().split('T')[0],
            sales: sale._sum.amount,
        }));

        res.status(200).json(formatSales);
    } catch {
        return res.status(500).json({ message: 'Error fetching sales over time'})
    }
};

// GET /api/statistics/top-products
export const getTopProducts = async (req: Request, res: Response) => {
    try {
        const topProducts = await prisma.orderDetails.groupBy({
            by: ['productId'],
            _sum: {
                totalQuantity: true,
            },
            orderBy: {
                _sum: {
                    totalQuantity: 'desc',
                }
            },
            take: 10,
        });

        const productIds = topProducts.map(p => p.productId);

        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            select: {
                id: true,
                name: true,
                image: true,
            }
        });

        const productMap = new Map(products.map(p => [p.id, p])); 

        const rankedProducts = topProducts.map(p => ({
            ...productMap.get(p.productId),
            totalSold: p._sum.totalQuantity,
        }));
    } catch {
        return res.status(500).json({
            message: 'Error fetching top products'
        });
    }
};
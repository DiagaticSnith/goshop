interface IStatisticSummary {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
} 

interface ÍSaleOverTime {
    date: string;
    sales: number;
} 

interface ITopProduct {
    id: string;
    name: string;
    image: string;
    totalSold: number;
} 

interface ISalesChart {
    data: ISalesData[];
} 

interface ITopProductsList {
    products: ITopProduct[];
}
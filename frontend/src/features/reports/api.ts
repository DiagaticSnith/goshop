import { api } from "../../../app/api";
import { useQuery } from "@tanstack/react-query";

type ReportType = 'revenue' | 'top_products' | 'by_status';

const getOrdersReport = (token: string, params: { type: ReportType; from?: string; to?: string; groupBy?: string; limit?: number }) => {
    return api.get(`/admin/reports/orders`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.data);
};

export const useGetOrdersReportQuery = (token: string, params: { type: ReportType; from?: string; to?: string; groupBy?: string; limit?: number } | null) => {
    return useQuery({
        queryKey: ['admin', 'reports', params ? JSON.stringify(params) : 'no-params'],
        queryFn: () => getOrdersReport(token, params as any),
        enabled: !!token && !!params
    });
};

export const exportOrdersReport = (token: string, body: any) => {
    return api.post(`/admin/reports/orders/export`, body, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
};

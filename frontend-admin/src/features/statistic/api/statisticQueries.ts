
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../app/api';

const getStatisticSummary = () => {
    return api.get('/statistic/summary').then(response => response.data);
}; 

const getSaleOverTime = () => {
    return api.get('/statistic/sales-over-time').then(response => response.data);
};

const getTopProducts = () => {
    return api.get('/statistic/top-products').then(response => response.data);
} 

export const useStatisticSummaryQuery = () => {
    return useQuery({
        queryKey: ['statistic', 'summary'],
        queryFn: getStatisticSummary,
    })
}  

export const useSaleOverTimeQuery = () => {
    return useQuery({
        queryKey: ['statistic', 'saleOverTime'],
        queryFn: getSaleOverTime,
    }); 
} 

export const useTopProductsQuery = () => {
    return useQuery({
        queryKey: ['statistic', 'topProducts'],
        queryFn: getTopProducts,
    })
}
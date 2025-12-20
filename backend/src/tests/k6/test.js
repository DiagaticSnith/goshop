import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
// Thư viện để xuất báo cáo HTML
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options = {
    // Kịch bản Stress Test: Kiểm tra giới hạn chịu tải của hệ thống
    stages: [
        { duration: '20s', target: 100 },  // Ramp-up: Khởi động lên 100 người dùng
        { duration: '40s', target: 400 },  // Stress: Tăng tốc lên 400 người dùng
        { duration: '1m',  target: 1000 },  // Peak: Giữ ở mức 1000 người dùng (Điểm gãy)
        { duration: '30s', target: 0 },    // Scale-down: Giảm về 0 để kiểm tra khả năng phục hồi
    ],
    thresholds: {
        http_req_failed: ['rate<0.1'],      // Tỷ lệ lỗi phải dưới 10%
        http_req_duration: ['p(95)<1000'],  // 95% request phải hoàn thành dưới 1s
    },
};  

const BASE_URL = 'https://backend-production-6e94.up.railway.app';

export default function () {
    const headers = { 'Accept': 'application/json' };

    // Lightweight checks: list products and categories only
    group('Products list', function () {
        const res = http.get(`${BASE_URL}/products`, { headers });
        check(res, {
            'products 200': (r) => r.status === 200,
            'products not slow': (r) => r.timings.duration < 1000,
        });
    });

    group('Categories list', function () {
        const res = http.get(`${BASE_URL}/category`, { headers });
        check(res, {
            'category 200': (r) => r.status === 200,
            'category not slow': (r) => r.timings.duration < 1000,
        });
    });

    // short think time
    sleep(randomIntBetween(1, 3) * 0.1);
}

// Hàm xuất báo cáo sau khi chạy xong
export function handleSummary(data) {
        // Helper to safely read metric values from the k6 summary object
        const getMetricValue = (m, key) => {
                try {
                        const metric = data.metrics[m];
                        if (!metric) return null;
                        // prefer `values` container (p(95), etc.)
                        if (metric.values && Object.prototype.hasOwnProperty.call(metric.values, key)) return metric.values[key];
                        if (metric[key] !== undefined) return metric[key];
                        if (metric.stat && metric.stat[key] !== undefined) return metric.stat[key];
                        return null;
                } catch (e) { return null; }
        };

        const totalReqs = data.metrics.http_reqs ? (data.metrics.http_reqs.count || 0) : 0;
        const failedRate = getMetricValue('http_req_failed', 'rate') || 0;
        const durations = {
                p50: getMetricValue('http_req_duration', 'p(50)') || getMetricValue('http_req_duration', '50') || getMetricValue('http_req_duration', 'median') || 0,
                p95: getMetricValue('http_req_duration', 'p(95)') || 0,
                p99: getMetricValue('http_req_duration', 'p(99)') || 0,
                avg: getMetricValue('http_req_duration', 'avg') || 0,
                max: getMetricValue('http_req_duration', 'max') || 0
        };

        const chartsHtml = `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>k6 Summary Charts</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px} .chart{max-width:800px;margin:30px 0}</style>
</head>
<body>
    <h1>k6 Summary Charts</h1>
    <p>Total requests: <strong>${totalReqs}</strong> — Failed rate: <strong>${(failedRate*100).toFixed(2)}%</strong></p>

    <div class="chart">
        <canvas id="durationsChart" width="800" height="300"></canvas>
    </div>

    <div class="chart">
        <canvas id="requestsChart" width="800" height="300"></canvas>
    </div>

    <script>
        const durations = ${JSON.stringify(durations)};
        const totalReqs = ${JSON.stringify(totalReqs)};
        const failedRate = ${JSON.stringify(failedRate)};

        // Durations bar chart
        new Chart(document.getElementById('durationsChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['p50','p95','p99','avg','max'],
                datasets: [{ label: 'ms', backgroundColor: ['#4dc9f6','#f67019','#f53794','#537bc4','#acc236'], data: [durations.p50, durations.p95, durations.p99, durations.avg, durations.max] }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        // Requests pie chart (success vs failed)
        new Chart(document.getElementById('requestsChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Success','Failed'],
                datasets: [{ data: [Math.round(totalReqs * (1 - failedRate)), Math.round(totalReqs * failedRate)], backgroundColor: ['#36a2eb','#ff6384'] }]
            },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
    </script>
</body>
</html>`;

        return {
                "summary.html": htmlReport(data), // existing html report
                "summary.json": JSON.stringify(data, null, 2),
                "summary_charts.html": chartsHtml,
                stdout: textSummary(data, { indent: " ", enableColors: true }),
        };
}
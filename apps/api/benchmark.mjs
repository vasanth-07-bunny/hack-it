// Benchmark Telemetry Suite for Abhiyantrix In-Memory + Disk Engine
import http from 'http';

const TOTAL_REQUESTS = 2000;
const CONCURRENCY = 50;
const BASE_URL = 'http://localhost:4000/api/health';

console.log('⚡ Starting Abhiyantrix Engine High-Throughput Load Benchmark...');
console.log(`📊 Parameters: ${TOTAL_REQUESTS} requests across ${CONCURRENCY} concurrent workers\n`);

let completed = 0;
let errors = 0;
const startTime = Date.now();
const latencies = [];

async function worker() {
  while (completed < TOTAL_REQUESTS) {
    const current = completed++;
    if (current >= TOTAL_REQUESTS) break;

    const reqStart = Date.now();
    try {
      await new Promise((resolve, reject) => {
        http.get(BASE_URL, (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            latencies.push(Date.now() - reqStart);
            resolve(true);
          });
        }).on('error', reject);
      });
    } catch {
      errors++;
    }
  }
}

async function runBenchmark() {
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const durationMs = Date.now() - startTime;
  const rps = Math.round((TOTAL_REQUESTS / durationMs) * 1000);
  const avgLatency = Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10;
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] || 1;

  console.log('==============================================');
  console.log('🏁 Benchmark Results:');
  console.log(`• Total Requests:    ${TOTAL_REQUESTS}`);
  console.log(`• Throughput:        ${rps.toLocaleString()} requests/second`);
  console.log(`• Average Latency:   ${avgLatency} ms`);
  console.log(`• p95 Latency:       ${p95Latency} ms`);
  console.log(`• Error Rate:        ${((errors / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
  console.log(`• Duration:          ${durationMs} ms`);
  console.log('==============================================');
}

runBenchmark();

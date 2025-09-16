#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:4000';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const duration = Number((end - start) / 1000000n); // Convert to ms
        resolve({ duration, status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runLoadTest() {
  console.log(`🚀 Starting performance test...`);
  console.log(
    `📊 ${TOTAL_REQUESTS} requests with ${CONCURRENT_REQUESTS} concurrent`
  );
  console.log(`🎯 Target: <120ms p95 latency\n`);

  const results = [];
  const startTime = Date.now();

  // Test different endpoints
  const endpoints = [
    '/healthz',
    '/metrics',
    '/graphql', // This will return 400 but still test the endpoint
  ];

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = [];

    for (let j = 0; j < CONCURRENT_REQUESTS && i + j < TOTAL_REQUESTS; j++) {
      const endpoint = endpoints[(i + j) % endpoints.length];
      batch.push(makeRequest(endpoint));
    }

    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Calculate statistics
  const durations = results.map((r) => r.duration).sort((a, b) => a - b);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const min = durations[0];
  const max = durations[durations.length - 1];

  console.log(`📈 Results:`);
  console.log(`   Total time: ${totalTime}ms`);
  console.log(
    `   Requests/sec: ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)}`
  );
  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min}ms`);
  console.log(`   Max: ${max}ms`);
  console.log(`   P50: ${p50}ms`);
  console.log(`   P95: ${p95}ms ${p95 < 120 ? '✅' : '❌'}`);
  console.log(`   P99: ${p99}ms`);

  // Check if we meet our target
  if (p95 < 120) {
    console.log(`\n🎉 SUCCESS: P95 latency (${p95}ms) is under 120ms target!`);
  } else {
    console.log(`\n⚠️  WARNING: P95 latency (${p95}ms) exceeds 120ms target`);
  }

  // Show error rate
  const errors = results.filter((r) => r.status >= 400).length;
  const errorRate = (errors / results.length) * 100;
  console.log(
    `\n📊 Error rate: ${errorRate.toFixed(2)}% (${errors}/${results.length})`
  );

  return { p95, avg, errorRate };
}

// Run the test
runLoadTest().catch(console.error);

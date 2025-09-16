// apps/web/scripts/performance-test.js  (ESM)
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'node:url';

class PerformanceTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {};
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
    this.page = await this.browser.newPage();
    await this.page.setCacheEnabled(false);
    await this.page.setJavaScriptEnabled(true);
  }

  async testPage(url, pageName) {
    console.log(`\n🚀 Testing ${pageName} at ${url}`);

    const startTime = Date.now();
    await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    // NOTE: FCP is a "paint" entry; LCP is NOT. Use its own entry type.
    const metrics = await this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paints = performance.getEntriesByType('paint');
      const fcp = paints.find((e) => e.name === 'first-contentful-paint');
      const lcpEntries = performance.getEntriesByType(
        'largest-contentful-paint'
      );
      const lcp = lcpEntries[lcpEntries.length - 1];

      return {
        domContentLoaded: nav
          ? nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart
          : null,
        loadComplete: nav ? nav.loadEventEnd - nav.loadEventStart : null,
        firstContentfulPaint: fcp ? fcp.startTime : null,
        largestContentfulPaint: lcp ? lcp.startTime : null,
        totalLoadTime: nav ? nav.loadEventEnd - nav.startTime : null,
        memoryUsage: performance.memory
          ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            }
          : null,
      };
    });

    const resourceMetrics = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const totalResources = resources.length;
      const totalSize = resources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0
      );
      const averageLoadTime =
        totalResources === 0
          ? 0
          : resources.reduce((sum, r) => sum + r.duration, 0) / totalResources;
      return { totalResources, totalSize, averageLoadTime };
    });

    const result = {
      pageName,
      url,
      loadTime,
      ...metrics,
      ...resourceMetrics,
      timestamp: new Date().toISOString(),
    };

    this.results[pageName] = result;
    return result;
  }

  async testWebVitals(url, pageName) {
    console.log(`\n📊 Measuring Web Vitals for ${pageName}`);

    await this.page.evaluateOnNewDocument(() => {
      window.webVitalsResults = {};
      window.webVitalsObservers = [];

      // LCP - Monitor continuously for the largest element
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          window.webVitalsResults.lcp = {
            startTime: lastEntry.startTime,
            element: lastEntry.element?.tagName || 'unknown',
            size: lastEntry.size || 0,
            url: lastEntry.url || 'unknown',
          };
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      window.webVitalsObservers.push(lcpObserver);

      // CLS - Cumulative Layout Shift
      let cls = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
        window.webVitalsResults.cls = cls;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      window.webVitalsObservers.push(clsObserver);

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.webVitalsResults.fid = {
            startTime: entry.startTime,
            processingStart: entry.processingStart,
            processingEnd: entry.processingEnd,
            duration: entry.processingStart - entry.startTime,
          };
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      window.webVitalsObservers.push(fidObserver);

      // FCP - First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.webVitalsResults.fcp = entry.startTime;
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      window.webVitalsObservers.push(fcpObserver);

      // TTFB - Time to First Byte
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        window.webVitalsResults.ttfb =
          navigation.responseStart - navigation.requestStart;
      }
    });

    await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait longer for LCP to be captured (it can take time)
    await new Promise((r) => setTimeout(r, 3000));

    // Trigger some interaction to capture FID
    await this.page.click('body');
    await new Promise((r) => setTimeout(r, 500));

    const webVitals = await this.page.evaluate(() => {
      // Clean up observers
      if (window.webVitalsObservers) {
        window.webVitalsObservers.forEach((observer) => observer.disconnect());
      }
      return window.webVitalsResults || {};
    });

    return { pageName, url, webVitals, timestamp: new Date().toISOString() };
  }

  async runFullTest() {
    try {
      await this.init();
      const pages = [
        { url: 'http://localhost:3000', name: 'Home' },
        { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
        { url: 'http://localhost:3000/login', name: 'Login' },
        { url: 'http://localhost:3000/signup', name: 'Signup' },
      ];
      console.log('🔍 Starting Performance Tests...\n');
      for (const p of pages) {
        try {
          await this.testPage(p.url, p.name);
          const webVitalsResult = await this.testWebVitals(p.url, p.name);
          // Store web vitals in the main results
          if (this.results[p.name] && webVitalsResult) {
            this.results[p.name].webVitals = webVitalsResult.webVitals;
          }
        } catch (e) {
          console.error(`❌ Error testing ${p.name}:`, e?.message || e);
        }
      }
      this.printResults();
      this.printWebVitalsResults();
    } finally {
      if (this.browser) await this.browser.close();
    }
  }

  printResults() {
    console.log('\n📈 Performance Test Results');
    console.log('='.repeat(60));
    Object.values(this.results).forEach((result) => {
      console.log(`\n🏠 ${result.pageName}`);
      console.log(`   Load Time: ${result.loadTime}ms`);
      if (result.domContentLoaded != null)
        console.log(
          `   DOM Content Loaded: ${result.domContentLoaded.toFixed(2)}ms`
        );
      if (result.firstContentfulPaint != null)
        console.log(
          `   First Contentful Paint: ${result.firstContentfulPaint.toFixed(2)}ms`
        );
      if (result.largestContentfulPaint != null)
        console.log(
          `   Largest Contentful Paint: ${result.largestContentfulPaint.toFixed(2)}ms`
        );
      console.log(`   Total Resources: ${result.totalResources}`);
      console.log(`   Total Size: ${(result.totalSize / 1024).toFixed(2)}KB`);
      console.log(
        `   Average Resource Load: ${result.averageLoadTime.toFixed(2)}ms`
      );
      if (result.memoryUsage) {
        console.log(
          `   Memory Used: ${(result.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
        );
      }
    });
  }

  printWebVitalsResults() {
    console.log('\n🎯 Web Vitals Results');
    console.log('='.repeat(60));

    // Get all web vitals results from the test
    const webVitalsData = [];
    Object.values(this.results).forEach((result) => {
      if (result.webVitals) {
        webVitalsData.push({
          page: result.pageName,
          ...result.webVitals,
        });
      }
    });

    webVitalsData.forEach((data) => {
      console.log(`\n📊 ${data.page} Web Vitals:`);

      // FCP
      if (data.fcp) {
        const fcpStatus =
          data.fcp < 1800 ? '✅' : data.fcp < 3000 ? '⚠️' : '❌';
        console.log(
          `   FCP (First Contentful Paint): ${data.fcp.toFixed(0)}ms ${fcpStatus}`
        );
      }

      // LCP
      if (data.lcp) {
        const lcpTime =
          typeof data.lcp === 'object' ? data.lcp.startTime : data.lcp;
        const lcpStatus = lcpTime < 2500 ? '✅' : lcpTime < 4000 ? '⚠️' : '❌';
        console.log(
          `   LCP (Largest Contentful Paint): ${lcpTime.toFixed(0)}ms ${lcpStatus}`
        );
        if (typeof data.lcp === 'object') {
          console.log(
            `     Element: ${data.lcp.element}, Size: ${data.lcp.size}`
          );
        }
      }

      // CLS
      if (data.cls !== undefined) {
        const clsStatus = data.cls < 0.1 ? '✅' : data.cls < 0.25 ? '⚠️' : '❌';
        console.log(
          `   CLS (Cumulative Layout Shift): ${data.cls.toFixed(3)} ${clsStatus}`
        );
      }

      // FID
      if (data.fid) {
        const fidTime =
          typeof data.fid === 'object' ? data.fid.duration : data.fid;
        const fidStatus = fidTime < 100 ? '✅' : fidTime < 300 ? '⚠️' : '❌';
        console.log(
          `   FID (First Input Delay): ${fidTime.toFixed(0)}ms ${fidStatus}`
        );
      }

      // TTFB
      if (data.ttfb) {
        const ttfbStatus =
          data.ttfb < 800 ? '✅' : data.ttfb < 1800 ? '⚠️' : '❌';
        console.log(
          `   TTFB (Time to First Byte): ${data.ttfb.toFixed(0)}ms ${ttfbStatus}`
        );
      }
    });

    // Summary
    console.log('\n📋 Web Vitals Summary:');
    console.log('   ✅ Good    ⚠️ Needs Improvement    ❌ Poor');
    console.log(
      '   FCP: <1.8s  LCP: <2.5s  CLS: <0.1  FID: <100ms  TTFB: <800ms'
    );
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

// Run if executed directly (ESM equivalent of require.main === module)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tester = new PerformanceTester();
  tester.runFullTest().catch(console.error);
}

export default PerformanceTester;

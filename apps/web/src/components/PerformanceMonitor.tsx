'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  navigationType: string;
}

interface PerformanceData {
  webVitals: WebVitalMetric[];
  resourceTiming: PerformanceResourceTiming[];
  navigationTiming: PerformanceNavigationTiming | null;
  memoryUsage: any;
}

export default function PerformanceMonitor() {
  useEffect(() => {
    const performanceData: PerformanceData = {
      webVitals: [],
      resourceTiming: [],
      navigationTiming: null,
      memoryUsage: null,
    };

    // Collect Web Vitals
    const sendToAnalytics = (metric: WebVitalMetric) => {
      performanceData.webVitals.push(metric);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Web Vital - ${metric.name}:`, {
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
        });
      }
    };

    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);

    // Collect resource timing data
    const collectResourceTiming = () => {
      const resources = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];
      performanceData.resourceTiming = resources;

      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Resource Timing:', {
          totalResources: resources.length,
          totalSize: resources.reduce(
            (sum, r) => sum + (r.transferSize || 0),
            0
          ),
          averageLoadTime:
            resources.reduce((sum, r) => sum + r.duration, 0) /
            resources.length,
        });
      }
    };

    // Collect navigation timing
    const collectNavigationTiming = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      performanceData.navigationTiming = navigation;

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Navigation Timing:', {
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalLoadTime: navigation.duration,
        });
      }
    };

    // Collect memory usage (if available)
    const collectMemoryUsage = () => {
      if ('memory' in performance) {
        performanceData.memoryUsage = (performance as any).memory;

        if (process.env.NODE_ENV === 'development') {
          console.log('💾 Memory Usage:', {
            used: `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`,
            total: `${Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)}MB`,
            limit: `${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
          });
        }
      }
    };

    // Collect all performance data after page load
    const collectAllData = () => {
      collectResourceTiming();
      collectNavigationTiming();
      collectMemoryUsage();

      // Store in window for debugging
      if (process.env.NODE_ENV === 'development') {
        (window as any).performanceData = performanceData;
        console.log('📈 Complete Performance Data:', performanceData);
      }
    };

    // Collect data after a short delay to ensure all metrics are available
    const timeoutId = setTimeout(collectAllData, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Long Task Detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Monitor layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('📐 Layout Shift:', {
              value: (entry as any).value,
              hadRecentInput: (entry as any).hadRecentInput,
            });
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      return () => {
        longTaskObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);
}

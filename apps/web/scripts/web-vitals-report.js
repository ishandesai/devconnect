// Web Vitals reporting script for production monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Replace with your analytics service
  console.log('Web Vital:', metric);

  // Example: Send to Google Analytics
  // gtag('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_category: 'Web Vitals',
  //   event_label: metric.id,
  //   non_interaction: true,
  // });
}

// Measure and report all Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Performance monitoring for development
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics to console in development
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`Performance Entry: ${entry.name} - ${entry.duration}ms`);
    }
  });

  observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
}

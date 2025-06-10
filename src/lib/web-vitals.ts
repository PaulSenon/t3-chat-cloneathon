"use client";

import { performanceTracker } from './performance';

// Metric interface
interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

// Extend window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      parameters: Record<string, string | number>
    ) => void;
  }
}

// Web Vitals thresholds (Google's recommendations)
export const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// Performance grade calculation
export type PerformanceGrade = 'good' | 'needs-improvement' | 'poor';

export function getPerformanceGrade(metric: string, value: number): PerformanceGrade {
  const thresholds = VITALS_THRESHOLDS[metric as keyof typeof VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// Custom Web Vitals implementation
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals using Performance Observer
  trackCLS();
  trackFID();
  trackFCP();
  trackLCP();
  trackTTFB();
  
  // Track custom metrics
  trackCustomMetrics();
}

// Cumulative Layout Shift (CLS)
function trackCLS() {
  if (!('PerformanceObserver' in window)) return;
  
  let clsValue = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as LayoutShift;
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value;
      }
    }
    
    // Send analytics after processing all entries
    if (list.getEntries().length > 0) {
      sendToAnalytics({
        name: 'CLS',
        value: clsValue,
        delta: clsValue,
        id: 'cls-1',
        entries: list.getEntries(),
      });
    }
  });
  
  try {
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS observer not supported');
  }
}

// First Input Delay (FID)
function trackFID() {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const firstInput = entry as PerformanceEventTiming;
      const fid = firstInput.processingStart - firstInput.startTime;
      
      sendToAnalytics({
        name: 'FID',
        value: fid,
        delta: fid,
        id: 'fid-1',
        entries: [entry],
      });
    }
  });
  
  try {
    observer.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID observer not supported');
  }
}

// First Contentful Paint (FCP)
function trackFCP() {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        sendToAnalytics({
          name: 'FCP',
          value: entry.startTime,
          delta: entry.startTime,
          id: 'fcp-1',
          entries: [entry],
        });
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['paint'] });
  } catch (e) {
    console.warn('FCP observer not supported');
  }
}

// Largest Contentful Paint (LCP)
function trackLCP() {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      sendToAnalytics({
        name: 'LCP',
        value: entry.startTime,
        delta: entry.startTime,
        id: 'lcp-1',
        entries: [entry],
      });
    }
  });
  
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observer not supported');
  }
}

// Time to First Byte (TTFB)
function trackTTFB() {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const navigationEntry = entry as PerformanceNavigationTiming;
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      
      sendToAnalytics({
        name: 'TTFB',
        value: ttfb,
        delta: ttfb,
        id: 'ttfb-1',
        entries: [entry],
      });
    }
  });
  
  try {
    observer.observe({ entryTypes: ['navigation'] });
  } catch (e) {
    console.warn('TTFB observer not supported');
  }
}

function sendToAnalytics(metric: WebVitalMetric) {
  const { name, value, delta, id } = metric;
  const grade = getPerformanceGrade(name, value);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital: ${name}`, {
      value: Math.round(value),
      delta: Math.round(delta),
      grade,
      id,
    });
  }

  // Send to analytics service
  sendMetricToService(name, value, grade, id);
  
  // Alert if performance is poor
  if (grade === 'poor') {
    console.warn(`Poor ${name} performance detected: ${Math.round(value)}ms`);
  }
}

function sendMetricToService(name: string, value: number, grade: PerformanceGrade, id: string) {
  // Integration points for analytics services
  
  // Google Analytics 4 example
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(value),
      metric_grade: grade,
    });
  }

  // Custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value: Math.round(value),
        grade,
        id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(err => console.error('Failed to send web vitals:', err));
  }
}

function trackCustomMetrics() {
  // Track page load time
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    const grade = getPerformanceGrade('LOAD', loadTime);
    
    sendMetricToService('LOAD', loadTime, grade, 'page-load');
    
    if (loadTime > 2000) {
      console.warn(`Page load time exceeded target: ${Math.round(loadTime)}ms`);
    }
  });

  // Track first interaction
  let firstInteraction = true;
  const trackFirstInteraction = () => {
    if (!firstInteraction) return;
    
    firstInteraction = false;
    const interactionTime = performance.now();
    sendMetricToService('FIRST_INTERACTION', interactionTime, 'good', 'first-interaction');
  };

  ['click', 'keydown', 'touchstart'].forEach(event => {
    document.addEventListener(event, trackFirstInteraction, { once: true, passive: true });
  });
}

// Chat-specific performance tracking
export function trackChatPerformance() {
  if (typeof window === 'undefined') return;

  // Track message send time
  window.addEventListener('chat:message:send', ((event: CustomEvent) => {
    const startTime = performance.now();
    
    // Track first token time
    const firstTokenHandler = () => {
      const firstTokenTime = performance.now() - startTime;
      performanceTracker.trackFirstToken(startTime);
      
      if (firstTokenTime > 500) {
        sendMetricToService('FIRST_TOKEN', firstTokenTime, 'poor', 'ai-response');
      }
    };

    // Track complete response time
    const completeHandler = () => {
      const totalTime = performance.now() - startTime;
      performanceTracker.trackStreamComplete(startTime);
      
      sendMetricToService('RESPONSE_COMPLETE', totalTime, 
        totalTime > 5000 ? 'poor' : totalTime > 2000 ? 'needs-improvement' : 'good',
        'ai-complete'
      );
    };

    // Listen for AI response events
    window.addEventListener('chat:ai:firstToken', firstTokenHandler, { once: true });
    window.addEventListener('chat:ai:complete', completeHandler, { once: true });
  }) as EventListener);
}

// Performance monitoring dashboard data
export function getPerformanceReport() {
  const metrics = performanceTracker.getMetrics();
  const report = {
    coreWebVitals: {
      cls: metrics.cls ? {
        value: metrics.cls,
        grade: getPerformanceGrade('CLS', metrics.cls),
      } : null,
      fid: metrics.fid ? {
        value: metrics.fid,
        grade: getPerformanceGrade('FID', metrics.fid),
      } : null,
      fcp: metrics.fcp ? {
        value: metrics.fcp,
        grade: getPerformanceGrade('FCP', metrics.fcp),
      } : null,
      lcp: metrics.lcp ? {
        value: metrics.lcp,
        grade: getPerformanceGrade('LCP', metrics.lcp),
      } : null,
      ttfb: metrics.ttfb ? {
        value: metrics.ttfb,
        grade: getPerformanceGrade('TTFB', metrics.ttfb),
      } : null,
    },
    chatMetrics: {
      firstTokenTime: metrics.firstTokenTime || null,
      streamingDuration: metrics.streamingDuration || null,
      messageCount: metrics.messageCount || 0,
    },
    timestamp: Date.now(),
  };

  return report;
}

// Initialize performance tracking
export function initPerformanceTracking() {
  if (typeof window === 'undefined') return;

  // Basic web vitals tracking
  trackWebVitals();
  
  // Chat-specific tracking
  trackChatPerformance();
  
  // Performance observer for additional metrics
  if ('PerformanceObserver' in window) {
    try {
      // Track long tasks (> 50ms)
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${Math.round(entry.duration)}ms`);
            sendMetricToService('LONG_TASK', entry.duration, 'poor', 'long-task');
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Track resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 2000) {
            console.warn(`Slow resource: ${resource.name} - ${Math.round(resource.duration)}ms`);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Performance observer setup failed:', e);
    }
  }

  console.log('Performance tracking initialized');
}

// Additional performance interfaces
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

// Export for use in _app.tsx or layout.tsx
export { trackWebVitals as reportWebVitals };
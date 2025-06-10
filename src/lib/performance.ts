import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Web Vitals metric interface
interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

// Performance metrics tracking
export interface PerformanceMetrics {
  cls: number;
  fid: number;
  fcp: number;
  lcp: number;
  ttfb: number;
  firstTokenTime?: number;
  streamingDuration?: number;
  messageCount?: number;
}

// Performance tracking state
class PerformanceTracker {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initWebVitals();
      this.initCustomMetrics();
    }
  }

  private initWebVitals() {
    getCLS(this.onCLS.bind(this));
    getFID(this.onFID.bind(this));
    getFCP(this.onFCP.bind(this));
    getLCP(this.onLCP.bind(this));
    getTTFB(this.onTTFB.bind(this));
  }

  private initCustomMetrics() {
    // Monitor layout shifts during streaming
    if ('PerformanceObserver' in window) {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShift;
          if (!layoutShiftEntry.hadRecentInput) {
            console.warn('Layout shift detected:', layoutShiftEntry.value);
          }
        }
      });
      
      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported');
      }
    }
  }

  private onCLS(metric: Metric) {
    this.metrics.cls = metric.value;
    this.reportMetric('CLS', metric.value);
  }

  private onFID(metric: Metric) {
    this.metrics.fid = metric.value;
    this.reportMetric('FID', metric.value);
  }

  private onFCP(metric: Metric) {
    this.metrics.fcp = metric.value;
    this.reportMetric('FCP', metric.value);
  }

  private onLCP(metric: Metric) {
    this.metrics.lcp = metric.value;
    this.reportMetric('LCP', metric.value);
  }

  private onTTFB(metric: Metric) {
    this.metrics.ttfb = metric.value;
    this.reportMetric('TTFB', metric.value);
  }

  private reportMetric(name: string, value: number) {
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${value}`);
    }
  }

  // Track AI response timing
  trackFirstToken(startTime: number) {
    const firstTokenTime = performance.now() - startTime;
    this.metrics.firstTokenTime = firstTokenTime;
    this.reportMetric('First Token Time', firstTokenTime);
    
    // Alert if exceeding target
    if (firstTokenTime > 500) {
      console.warn(`First token time exceeded target: ${firstTokenTime}ms`);
    }
    
    return firstTokenTime;
  }

  // Track complete streaming duration
  trackStreamComplete(startTime: number, messageCount: number = 1) {
    const streamingDuration = performance.now() - startTime;
    this.metrics.streamingDuration = streamingDuration;
    this.metrics.messageCount = messageCount;
    this.reportMetric('Streaming Duration', streamingDuration);
    
    return streamingDuration;
  }

  // Get current metrics snapshot
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics } as PerformanceMetrics;
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Utility functions
export const createPerformanceTimer = () => {
  const startTime = performance.now();
  
  return {
    startTime,
    end: () => performance.now() - startTime,
    checkpoint: (label: string) => {
      const elapsed = performance.now() - startTime;
      console.log(`${label}: ${elapsed}ms`);
      return elapsed;
    }
  };
};

// Debounce utility for performance
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for scroll performance
export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as PerformanceWithMemory).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100,
      total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100,
      limit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100,
    };
  }
  return null;
};

// Memory performance interface
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory: MemoryInfo;
}

// Layout shift interface
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// Intersection Observer for lazy loading
export const createLazyLoadObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// FPS monitoring
export const createFPSMonitor = (callback: (fps: number) => void) => {
  let frames = 0;
  const startTime = performance.now();
  let lastTime = startTime;

  const measureFPS = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      callback(fps);
      
      frames = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  };

  measureFPS();
};

// Bundle size warning (development only)
export const warnLargeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    // This will be replaced by the bundle analyzer
    console.log('Use `npm run analyze` to check bundle size');
  }
};
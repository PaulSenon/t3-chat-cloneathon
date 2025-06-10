# Performance Monitoring & Optimization Setup

This document outlines the complete performance monitoring and optimization setup for the competition chat app.

## 🎯 Performance Targets

- **Page Load**: < 2 seconds
- **First AI Token**: < 500ms
- **Zero Cumulative Layout Shift (CLS)** during streaming
- **Mobile-first responsive design** with 60fps scrolling

## 📦 Installed Dependencies

### Production Dependencies
- `web-vitals`: ^4.2.4 - Web performance metrics tracking

### Development Dependencies
- `@next/bundle-analyzer`: ^15.4.0 - Bundle size analysis
- `cross-env`: ^7.0.3 - Cross-platform environment variables

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build            # Production build
npm run start            # Start production server

# Performance Analysis
npm run analyze          # Analyze bundle size with bundle analyzer
npm run analyze:server   # Server-side bundle analysis
npm run perf            # Full performance analysis (analyze + build)
```

## 📁 File Structure

```
src/
├── lib/
│   ├── performance.ts      # Core performance monitoring utilities
│   └── web-vitals.ts      # Web Vitals tracking implementation
└── components/
    └── ui/
        ├── loading-skeleton.tsx  # Loading skeletons to prevent CLS
        └── error-boundary.tsx    # Error boundaries for chat errors
```

## 🚀 Core Features

### 1. Performance Monitoring (`src/lib/performance.ts`)

**Key Features:**
- Real-time performance tracking
- AI response timing (first token, streaming duration)
- Memory usage monitoring
- FPS monitoring for smooth scrolling
- Layout shift detection
- Custom metrics collection

**Usage:**
```typescript
import { performanceTracker, createPerformanceTimer } from '@/lib/performance';

// Track AI response performance
const timer = createPerformanceTimer();
// ... AI call
performanceTracker.trackFirstToken(timer.startTime);
```

### 2. Web Vitals Tracking (`src/lib/web-vitals.ts`)

**Tracked Metrics:**
- **CLS**: Cumulative Layout Shift
- **FID**: First Input Delay
- **FCP**: First Contentful Paint
- **LCP**: Largest Contentful Paint
- **TTFB**: Time to First Byte

**Performance Grades:**
- 🟢 **Good**: Meeting performance targets
- 🟡 **Needs Improvement**: Close to targets
- 🔴 **Poor**: Exceeding acceptable thresholds

**Usage:**
```typescript
import { initPerformanceTracking } from '@/lib/web-vitals';

// Initialize in your app
initPerformanceTracking();
```

### 3. Loading Skeletons (`src/components/ui/loading-skeleton.tsx`)

**Components Available:**
- `ChatMessageSkeleton` - Prevents CLS during message loading
- `StreamingMessageSkeleton` - Typing indicator for AI responses
- `ChatListSkeleton` - Sidebar chat list loading
- `PageLoadingSkeleton` - Full page loading state
- `OptimizedSkeleton` - Performance-optimized generic skeleton

**Usage:**
```tsx
import { ChatMessageSkeleton, StreamingMessageSkeleton } from '@/components/ui/loading-skeleton';

// Show while loading messages
{isLoading && <ChatMessageSkeleton />}

// Show while AI is responding
{isStreaming && <StreamingMessageSkeleton />}
```

### 4. Error Boundaries (`src/components/ui/error-boundary.tsx`)

**Components Available:**
- `ErrorBoundary` - Generic error boundary with retry logic
- `ChatErrorBoundary` - Chat-specific error handling
- `StreamingErrorBoundary` - AI streaming error handling
- `NetworkErrorBoundary` - Network connectivity errors

**Features:**
- Automatic retry with exponential backoff
- Graceful fallback UI
- Error reporting to monitoring services
- Chat-specific error messages

**Usage:**
```tsx
import { ChatErrorBoundary, StreamingErrorBoundary } from '@/components/ui/error-boundary';

// Wrap your chat components
<ChatErrorBoundary>
  <ChatInterface />
</ChatErrorBoundary>

// Wrap streaming components
<StreamingErrorBoundary>
  <StreamingMessage />
</StreamingErrorBoundary>
```

## 🔧 Configuration

### Bundle Analyzer Setup
The bundle analyzer is configured in `next.config.ts` and can be enabled with:
```bash
ANALYZE=true npm run build
```

### Performance Thresholds
Defined in `src/lib/web-vitals.ts`:
```typescript
export const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};
```

## 📊 Performance Monitoring Integration

### Analytics Integration
The system supports multiple analytics providers:
- Google Analytics 4
- Custom analytics endpoints
- Console logging (development)

### Custom Events
Track chat-specific performance:
```javascript
// Dispatch custom events for tracking
window.dispatchEvent(new CustomEvent('chat:message:send'));
window.dispatchEvent(new CustomEvent('chat:ai:firstToken'));
window.dispatchEvent(new CustomEvent('chat:ai:complete'));
```

## 🏆 Competition Readiness Features

### 1. Zero CLS (Cumulative Layout Shift)
- Pre-sized skeleton components
- Fixed dimensions for dynamic content
- Transform-based animations
- Layout shift monitoring

### 2. Fast AI Response
- Performance tracking for < 500ms first token
- Streaming optimization
- Error recovery mechanisms
- Progress indicators

### 3. Mobile Performance
- 60fps scrolling optimizations
- Touch interaction tracking
- Responsive loading states
- Memory usage monitoring

### 4. Production Monitoring
- Real-time performance alerts
- Error boundary reporting
- Resource loading optimization
- Long task detection

## 🚦 Performance Dashboard

Access performance metrics programmatically:
```typescript
import { getPerformanceReport } from '@/lib/web-vitals';

const report = getPerformanceReport();
console.log('Performance Report:', report);
```

## 🛡️ Error Handling Strategy

1. **Graceful Degradation**: App continues to function even with errors
2. **Retry Logic**: Automatic retries with exponential backoff
3. **User Feedback**: Clear error messages and recovery options
4. **Monitoring**: All errors are logged and can be reported to services

## 📈 Optimization Recommendations

1. **Run bundle analysis regularly**: `npm run analyze`
2. **Monitor Core Web Vitals** in development and production
3. **Use loading skeletons** for all dynamic content
4. **Wrap components** in appropriate error boundaries
5. **Track custom metrics** specific to your chat features

## 🔗 Integration with Existing Architecture

This performance monitoring system integrates seamlessly with:
- **Convex RLS**: Database operation monitoring
- **AI SDK**: Streaming response tracking
- **Next.js**: Built-in performance optimizations
- **Competition Requirements**: All targets and constraints

---

**Competition Ready**: This setup ensures your chat app meets all performance requirements with comprehensive monitoring, error handling, and optimization tools.
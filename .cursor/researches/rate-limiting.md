# Rate Limiting & Subscription Management

**Multi-tier protection against abuse and cost overruns**

[← Back to Overview](./README.md) | [← Rich Streaming](./rich-streaming.md) | [Next: Chat History →](./chat-history.md)

## Overview

Protect your app from $10k+ monthly bills with production-grade protection that covers both abuse prevention (rate limiting) and subscription enforcement (quota management). These are different concerns with different solutions.

## 🛡️ Protection Layers Overview

| Layer | Purpose | Target | Cost | Necessity |
|-------|---------|--------|------|-----------|
| **1. DDoS/Flood Protection** | Prevent abuse attacks | IP addresses | $ | 🔴 Critical |
| **2. User Rate Limiting** | Prevent spam/automation | Individual users | $$ | 🟡 Important |
| **3. Subscription Quotas** | Enforce paid limits | Subscription tiers | $$$ | 🟢 Business |
| **4. Concurrent Limits** | Resource management | Active sessions | $$ | 🔵 Premium |

## Layer 1: DDoS & Flood Protection 🔴

> **Purpose**: Prevent malicious attacks and accidental flooding  
> **Cost**: $ (Low) - Basic infrastructure protection  
> **Necessity**: 🔴 Critical for any public API

### Edge-Level Protection (Cloudflare/Vercel)

```typescript
// Vercel WAF Configuration (Free tier available)
// vercel.json
{
  "security": {
    "rules": [
      {
        "if": {
          "request_path": { "matches": "/api/chat" }
        },
        "then": {
          "rate_limit": {
            "requests": 100,
            "window": "1m"
          }
        }
      }
    ]
  }
}

// Cost: Free tier covers basic protection
// Blocks: 100+ requests/minute from single IP
```

### Application-Level IP Protection

```typescript
// Basic IP rate limiting (Upstash Redis)
// Cost: ~$10/month for Redis
import { Ratelimit } from "@upstash/ratelimit";

const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, "1m"), // 20 req/min per IP
  analytics: true,
  prefix: "ip_limit",
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  
  const { success } = await ipRateLimit.limit(ip);
  if (!success) {
    return new Response("Too many requests from this IP", { status: 429 });
  }
  
  // Continue processing...
}
```

## Layer 2: User Rate Limiting 🟡

> **Purpose**: Prevent individual user spam/automation  
> **Cost**: $$ (Medium) - User tracking required  
> **Necessity**: 🟡 Important for user-facing apps

```typescript
// User-based rate limiting
// Cost: Authentication + Redis storage
const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10m"), // 10 req/10min per user
  analytics: true,
  prefix: "user_limit",
});

export async function POST(req: Request) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await fetchQuery(api.users.getCurrentUser, {}, { token });
  const { success } = await userRateLimit.limit(`user_${user._id}`);
  
  if (!success) {
    return new Response("Rate limit exceeded. Please wait before trying again.", {
      status: 429,
      headers: { "Retry-After": "600" }, // 10 minutes
    });
  }
  
  // Continue processing...
}
```

## Layer 3: Subscription Quotas 🟢

> **Purpose**: Enforce paid subscription limits and usage tracking  
> **Cost**: $$$ (High) - Full subscription management  
> **Necessity**: 🟢 Required for business model

### Quota Management System

```typescript
// Subscription quota enforcement
// Cost: Subscription management + usage tracking
const SUBSCRIPTION_LIMITS = {
  free: {
    monthly_requests: 100,
    concurrent_chats: 1,
    models: ["gpt-3.5-turbo"],
  },
  pro: {
    monthly_requests: 1000,
    concurrent_chats: 3,
    models: ["gpt-3.5-turbo", "gpt-4o-mini"],
  },
  premium: {
    monthly_requests: 10000,
    concurrent_chats: 10,
    models: ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o"],
  },
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const usage = await getCurrentMonthUsage(user._id);
  const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier];
  
  // Check monthly quota
  if (usage.requests >= limits.monthly_requests) {
    return new Response(
      JSON.stringify({
        error: "Monthly quota exceeded",
        current: usage.requests,
        limit: limits.monthly_requests,
        upgradeUrl: "/upgrade",
      }),
      { 
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Check concurrent chats
  const activeChatCount = await getActiveChatCount(user._id);
  if (activeChatCount >= limits.concurrent_chats) {
    return new Response(
      JSON.stringify({
        error: "Concurrent chat limit reached",
        active: activeCount,
        limit: limits.concurrent_chats,
      }),
      { status: 429 }
    );
  }
  
  // Process with appropriate model
  const result = streamText({
    model: selectModelForTier(user.subscriptionTier),
    messages,
  });
  
  // Track usage
  await incrementUsage(user._id);
  
  return result.toDataStreamResponse();
}
```

### Usage Tracking Schema

```typescript
// convex/schema.ts - Quota tracking
export default defineSchema({
  usage: defineTable({
    userId: v.id("users"),
    month: v.string(), // "2024-01"
    requests: v.number(),
    tokensUsed: v.number(),
    estimatedCost: v.number(),
  }).index("by_user_month", ["userId", "month"]),

  activeSessions: defineTable({
    userId: v.id("users"),
    threadId: v.id("threads"),
    startedAt: v.number(),
    lastActivity: v.number(),
  }).index("by_user", ["userId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("premium")),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.number(),
  }).index("by_user", ["userId"]),
});
```

## Layer 4: Concurrent Session Limits 🔵

> **Purpose**: Premium feature for managing active chat sessions  
> **Cost**: $$ (Medium) - Session tracking  
> **Necessity**: 🔵 Premium tier differentiator

 ```typescript
 // Concurrent chat session management
// Cost: Session state tracking in Redis
export async function startChatSession(userId: string, threadId: string) {
  const user = await getUser(userId);
  const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier];
  
  // Get active sessions
  const activeSessions = await redis.smembers(`active_chats:${userId}`);
  
  if (activeSessions.length >= limits.concurrent_chats) {
    // For premium users, provide session management
    if (user.subscriptionTier === "premium") {
      return {
        error: "CONCURRENT_LIMIT_REACHED",
        activeSessions: await getSessionDetails(activeSessions),
        suggestion: "Close an existing chat or upgrade your plan",
      };
    } else {
      return {
        error: "UPGRADE_REQUIRED",
        message: "Upgrade to Pro for multiple concurrent chats",
      };
    }
  }
  
  // Track session
  await redis.sadd(`active_chats:${userId}`, threadId);
  await redis.expire(`active_chats:${userId}`, 86400); // 24h cleanup
  
  return { success: true };
}
```

## Cost & Complexity Comparison

| Solution | Monthly Cost | Setup Time | Maintenance | Effectiveness |
|----------|-------------|------------|-------------|---------------|
| **IP Rate Limiting** | $0-10 | 30 min | Minimal | 90% abuse protection |
| **User Rate Limiting** | $10-50 | 2 hours | Low | 95% spam prevention |
| **Subscription Quotas** | $50-200 | 1-2 weeks | High | 100% business control |
| **Concurrent Limits** | $20-100 | 1 week | Medium | Premium feature value |

## Implementation Priority

### Week 1: Essential Protection (P0)
```typescript
// 1. Basic IP rate limiting (30 minutes)
const ipLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, "1m"),
});

// 2. Simple user rate limiting (2 hours)
const userLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10m"),
});
```

### Week 2-3: Business Logic (P1)
```typescript
// 3. Subscription quota system (1-2 weeks)
// - Usage tracking
// - Tier-based limits
// - Upgrade prompts
```

### Week 4+: Premium Features (P2)
```typescript
// 4. Advanced session management
// - Concurrent chat limits
// - Session details
// - Premium user experience
```

## Rate Limiting vs Quota Management: Key Differences

| Aspect | Rate Limiting | Quota Management |
|--------|---------------|------------------|
| **Purpose** | Abuse prevention | Business enforcement |
| **Time Window** | Minutes/Hours | Monthly/Billing cycle |
| **Scope** | Technical protection | Revenue optimization |
| **User Experience** | "Slow down" | "Upgrade to continue" |
| **Reset Mechanism** | Automatic (time) | Billing cycle/payment |
| **Cost Impact** | Infrastructure protection | Revenue generation |

## Real-World Impact Examples

### Cost Protection (Rate Limiting)
- **Without**: $15k AWS bill from DDoS attack
- **With**: $50/month protection cost
- **ROI**: 300x cost savings

### Revenue Generation (Quotas)
- **Free Tier**: 100 requests/month → 15% convert to paid
- **Pro Tier**: 1,000 requests/month → $10/month
- **Premium**: 10,000 requests/month → $50/month

### Session Management
- **Free**: 1 concurrent chat
- **Pro**: 3 concurrent chats → productivity boost
- **Premium**: 10 concurrent chats → team/power user feature

## Related Topics

- **[Rich Streaming](./rich-streaming.md)**: Protect widget APIs with rate limits
- **[Stream Resumability](./stream-resumability.md)**: Handle rate limit disconnections gracefully
- **[Chat History](./chat-history.md)**: Store usage metadata with messages

---

**Next Steps**: Implement basic IP + user rate limiting, then add subscription tier integration with your [Chat History](./chat-history.md) system.

## 📖 References & Sources

### Rate Limiting & Infrastructure
- **[Upstash Ratelimit Documentation](https://upstash.com/docs/redis/features/ratelimiting)** - Redis-based rate limiting patterns
- **[Vercel WAF](https://vercel.com/docs/security/vercel-waf)** - Edge-level protection and rate limiting
- **[Redis Rate Limiting Patterns](https://redis.io/docs/manual/patterns/#rate-limiter)** - Sliding window and fixed window algorithms
- **[Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)** - Geographic and behavioral patterns

### Authentication & User Management
- **[Clerk Authentication](https://clerk.com/docs)** - User authentication and JWT tokens
- **[Convex Authentication](https://docs.convex.dev/auth)** - Database-level user context
- **[Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)** - Request interception patterns

### Subscription & Payment Processing
- **[Stripe Subscription Management](https://stripe.com/docs/billing/subscriptions)** - Tiered pricing implementation
- **[Convex Subscription Patterns](https://docs.convex.dev/functions/database-mutations)** - Usage tracking and quota management
- **[SaaS Metrics Best Practices](https://www.salesforce.com/resources/articles/saas-metrics/)** - Business model optimization

### Security & Abuse Prevention
- **[OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)** - Security best practices
- **[Device Fingerprinting](https://developer.mozilla.org/en-US/docs/Web/API/Navigator)** - Browser-based identification
- **[IP Geolocation APIs](https://ipapi.co/api/)** - Geographic restriction implementation

### Cost Optimization Case Studies
- **[OpenAI API Best Practices](https://platform.openai.com/docs/guides/production-best-practices)** - LLM cost management
- **Industry Rate Limiting Examples** - Real-world cost protection implementations (*Note: Specific cost savings examples are illustrative based on common industry patterns*)
- **[Redis Memory Optimization](https://redis.io/docs/manual/config/#memory-optimization)** - Efficient state storage 
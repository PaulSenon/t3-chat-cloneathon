# Stripe Integration Architecture & Workflow Diagrams

## Overview

This document provides comprehensive architectural diagrams and visualizations for the Stripe subscription integration in your T3 chat application. It covers data ownership, workflows, sequence diagrams, and integration patterns.

---

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[React Components]
        PRICING[Pricing Table]
        BANNER[Subscription Banner]
        PORTAL[Customer Portal]
    end
    
    subgraph "Application Layer (Vercel)"
        FRONTEND[Next.js Frontend]
        API[API Routes]
        AUTH[Clerk Auth]
    end
    
    subgraph "Backend Services"
        CONVEX[(Convex Database)]
        STRIPE[Stripe API]
        WEBHOOKS[Stripe Webhooks]
    end
    
    subgraph "Data Storage"
        CONV_USERS[Users Table]
        CONV_CUSTOMERS[Stripe Customers]
        CONV_SUBS[Subscriptions Cache]
        CONV_EVENTS[Webhook Events]
        STRIPE_DATA[Stripe Database<br/>AUTHORITATIVE]
    end
    
    %% User interactions
    UI --> FRONTEND
    PRICING --> API
    PORTAL --> STRIPE
    
    %% Authentication flow
    FRONTEND --> AUTH
    AUTH --> CONVEX
    
    %% API interactions
    API --> CONVEX
    API --> STRIPE
    
    %% Webhook flow
    STRIPE --> WEBHOOKS
    WEBHOOKS --> CONVEX
    
    %% Data relationships
    CONVEX --> CONV_USERS
    CONVEX --> CONV_CUSTOMERS
    CONVEX --> CONV_SUBS
    CONVEX --> CONV_EVENTS
    STRIPE --> STRIPE_DATA
    
    %% Data sync
    WEBHOOKS -.->|Sync State| CONV_SUBS
    
    style STRIPE_DATA fill:#ff6b6b
    style CONVEX fill:#4ecdc4
    style STRIPE fill:#635bff
```

---

## 🎭 Actor Responsibilities

### 1. **Next.js Frontend (Vercel)**
- **Owns**: User interface, client-side state, navigation
- **Responsibilities**: 
  - Render subscription UI components
  - Handle user interactions (upgrade, cancel)
  - Display subscription status and usage limits
  - Route users to Stripe Checkout

### 2. **Next.js API Routes (Vercel)**
- **Owns**: Server-side logic, authentication validation
- **Responsibilities**:
  - Validate Clerk authentication
  - Create Stripe checkout sessions
  - Generate customer portal links
  - Process webhook events

### 3. **Convex Database**
- **Owns**: Application state cache, user data, relationships
- **Responsibilities**:
  - Store user profiles and preferences
  - Cache essential subscription state for performance
  - Track usage and limits
  - Log webhook events for reliability

### 4. **Stripe**
- **Owns**: ALL payment data, subscription state, billing logic
- **Responsibilities**:
  - Process payments and handle failures
  - Manage subscription lifecycles
  - Calculate taxes and handle compliance
  - Send webhook events for state changes
  - **SINGLE SOURCE OF TRUTH** for all billing data

---

## 💾 Data Ownership Matrix

| Data Type | Owner | Storage Location | Sync Pattern | Purpose |
|-----------|-------|------------------|--------------|---------|
| **Payment Methods** | Stripe | Stripe Database | N/A | PCI compliance |
| **Subscription Status** | Stripe | Stripe Database | Webhook → Convex | Real-time UI updates |
| **Product Catalog** | Stripe | Stripe Database | Static config | Pricing display |
| **Customer Billing Data** | Stripe | Stripe Database | Webhook → Convex | Invoice generation |
| **User Profiles** | Convex | Convex Database | API → Stripe metadata | Account management |
| **Usage Tracking** | Convex | Convex Database | Real-time updates | Quota enforcement |
| **Subscription Cache** | Convex | Convex Database | Webhook sync | Performance optimization |
| **Webhook Events** | Convex | Convex Database | Immediate logging | Reliability & debugging |

### 🔐 Data Access Patterns

```mermaid
graph LR
    subgraph "Read Patterns"
        USER_SUB[User Subscription Status]
        USAGE[Usage Limits]
        BILLING[Billing History]
    end
    
    subgraph "Write Patterns"
        CREATE_SUB[Create Subscription]
        UPDATE_SUB[Update Subscription]
        CANCEL_SUB[Cancel Subscription]
    end
    
    subgraph "Sources"
        CONVEX_READ[(Convex - Fast)]
        STRIPE_READ[(Stripe - Authoritative)]
        STRIPE_WRITE[(Stripe - Operations)]
    end
    
    %% Read patterns
    USER_SUB --> CONVEX_READ
    USAGE --> CONVEX_READ
    BILLING --> STRIPE_READ
    
    %% Write patterns
    CREATE_SUB --> STRIPE_WRITE
    UPDATE_SUB --> STRIPE_WRITE
    CANCEL_SUB --> STRIPE_WRITE
    
    %% Sync
    STRIPE_WRITE -.->|Webhook| CONVEX_READ
    
    style CONVEX_READ fill:#4ecdc4
    style STRIPE_READ fill:#635bff
    style STRIPE_WRITE fill:#ff6b6b
```

---

## 🔄 Core Workflow Sequences

### 1. New User Subscription Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Route
    participant C as Convex
    participant S as Stripe
    
    U->>F: Click "Upgrade to Premium"
    F->>A: POST /api/stripe/checkout
    A->>A: Validate Clerk auth
    A->>C: getOrCreateStripeCustomer()
    
    alt Customer exists
        C-->>A: Return existing customer ID
    else New customer
        C->>S: Create customer
        S-->>C: Customer created
        C->>C: Store customer mapping
        C-->>A: Return new customer ID
    end
    
    A->>S: Create checkout session
    S-->>A: Return checkout URL
    A-->>F: Return checkout URL
    F->>F: Redirect to Stripe Checkout
    
    U->>S: Complete payment
    S->>A: Webhook: checkout.session.completed
    A->>C: syncStripeSubscription()
    C->>S: Fetch latest subscription data
    S-->>C: Return subscription data
    C->>C: Update subscription cache
    C->>C: Update user tier
    A-->>S: Webhook acknowledged
    
    F->>F: Redirect to success page
    F->>C: Fetch updated subscription
    C-->>F: Return subscription data
    F->>F: Show success message
```

### 2. Subscription Status Check Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant C as Convex
    participant S as Stripe
    
    U->>F: Load dashboard
    F->>C: getUserSubscription(userId)
    
    alt Subscription cached
        C-->>F: Return cached subscription
        F->>F: Render subscription status
    else No cache or expired
        Note over C,S: Fallback to Stripe
        C->>S: Fetch subscription data
        S-->>C: Return current state
        C->>C: Update cache
        C-->>F: Return subscription data
        F->>F: Render subscription status
    end
```

### 3. Webhook Processing Flow

```mermaid
sequenceDiagram
    participant S as Stripe
    participant W as Webhook Handler
    participant C as Convex
    participant U as Users
    
    S->>W: POST /api/stripe/webhooks
    W->>W: Verify signature
    W->>W: Parse event type
    
    alt customer.subscription.updated
        W->>C: syncStripeSubscription(customerId, eventId)
        C->>C: Check idempotency
        
        alt Already processed
            C-->>W: Return "already_processed"
        else New event
            C->>S: Fetch latest subscription
            S-->>C: Return subscription data
            C->>C: Update subscription cache
            C->>C: Update user tier
            C->>C: Log successful processing
            C-->>W: Return success
        end
        
    else customer.subscription.deleted
        W->>C: syncStripeSubscription(customerId, eventId)
        C->>C: Delete subscription cache
        C->>C: Set user tier to "free"
        C->>C: Log successful processing
        C-->>W: Return success
    end
    
    W-->>S: Return 200 OK
    
    Note over U: Real-time updates via Convex subscriptions
    C->>U: Push subscription state changes
```

### 4. Customer Portal Access Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Route
    participant C as Convex
    participant S as Stripe
    
    U->>F: Click "Manage Subscription"
    F->>A: POST /api/stripe/portal
    A->>A: Validate Clerk auth
    A->>C: getStripeCustomer(userId)
    C-->>A: Return customer mapping
    A->>S: Create portal session
    S-->>A: Return portal URL
    A-->>F: Return portal URL
    F->>F: Redirect to Stripe portal
    
    U->>S: Manage subscription in portal
    S->>A: Webhook: customer.subscription.updated
    A->>C: syncStripeSubscription()
    Note over C: Update local cache
    A-->>S: Webhook acknowledged
    
    S->>F: Redirect back to app
    F->>C: Fetch updated subscription
    C-->>F: Return updated data
    F->>F: Show updated status
```

---

## 🔄 Data Synchronization Strategy

### Single Source of Truth Pattern

```mermaid
graph TB
    subgraph "Stripe (Authoritative)"
        STRIPE_CUSTOMERS[Customers]
        STRIPE_SUBS[Subscriptions]
        STRIPE_INVOICES[Invoices]
        STRIPE_PAYMENTS[Payments]
    end
    
    subgraph "Convex (Cache Layer)"
        CACHE_CUSTOMERS[Customer Mappings]
        CACHE_SUBS[Subscription State]
        CACHE_EVENTS[Webhook Events]
        CACHE_USAGE[Usage Tracking]
    end
    
    subgraph "Sync Mechanisms"
        WEBHOOKS[Webhook Events]
        API_CALLS[Direct API Calls]
        FALLBACK[Cache Miss Fallback]
    end
    
    STRIPE_CUSTOMERS -.->|Webhook| CACHE_CUSTOMERS
    STRIPE_SUBS -.->|Webhook| CACHE_SUBS
    STRIPE_INVOICES -.->|Event Log| CACHE_EVENTS
    
    CACHE_SUBS -.->|On Cache Miss| STRIPE_SUBS
    CACHE_CUSTOMERS -.->|Validate| STRIPE_CUSTOMERS
    
    style STRIPE_CUSTOMERS fill:#ff6b6b
    style STRIPE_SUBS fill:#ff6b6b
    style STRIPE_INVOICES fill:#ff6b6b
    style STRIPE_PAYMENTS fill:#ff6b6b
    style CACHE_CUSTOMERS fill:#4ecdc4
    style CACHE_SUBS fill:#4ecdc4
    style CACHE_EVENTS fill:#4ecdc4
    style CACHE_USAGE fill:#4ecdc4
```

### ACID Compliance Measures

1. **Atomicity**: Each webhook event is processed atomically with idempotency checks
2. **Consistency**: Stripe remains authoritative; Convex cache is eventually consistent
3. **Isolation**: Webhook processing uses database transactions
4. **Durability**: All events are logged for replay and debugging

---

## 🌐 Environment & Configuration Data

### Environment Variables Flow

```mermaid
graph LR
    subgraph "Development"
        DEV_ENV[.env.local]
        DEV_STRIPE[Stripe Test Keys]
        DEV_CONVEX[Convex Dev Environment]
    end
    
    subgraph "Production"
        PROD_ENV[Vercel Environment Variables]
        PROD_STRIPE[Stripe Live Keys]
        PROD_CONVEX[Convex Production]
    end
    
    subgraph "Configuration"
        PRICE_IDS[Price ID Mappings]
        WEBHOOK_SECRETS[Webhook Secrets]
        APP_URLS[Application URLs]
    end
    
    DEV_ENV --> DEV_STRIPE
    DEV_ENV --> DEV_CONVEX
    DEV_ENV --> PRICE_IDS
    
    PROD_ENV --> PROD_STRIPE
    PROD_ENV --> PROD_CONVEX
    PROD_ENV --> WEBHOOK_SECRETS
    
    style DEV_STRIPE fill:#ffd93d
    style PROD_STRIPE fill:#ff6b6b
```

---

## 📊 Quota & Usage Integration

### Usage Limit Enforcement Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant C as Convex
    participant AI as AI Service
    
    U->>F: Send chat message
    F->>C: checkUsageLimit(userId)
    C->>C: Get user subscription tier
    C->>C: Get current usage
    
    alt Free tier - limit reached
        C-->>F: Return usage_exceeded
        F->>F: Show upgrade prompt
    else Premium tier - unlimited
        C-->>F: Return can_proceed
        F->>AI: Process message
        AI-->>F: Return response
        F->>C: incrementUsage(userId)
        C->>C: Update usage counters
    else Free tier - under limit
        C-->>F: Return can_proceed
        F->>AI: Process message
        AI-->>F: Return response
        F->>C: incrementUsage(userId)
        C->>C: Update usage counters
        
        alt Approaching limit
            C->>F: Return approaching_limit_warning
            F->>F: Show gentle upgrade suggestion
        end
    end
```

---

## 🚨 Error Handling & Recovery

### Webhook Failure Recovery

```mermaid
graph TB
    subgraph "Webhook Processing"
        WEBHOOK[Incoming Webhook]
        VERIFY[Verify Signature]
        PROCESS[Process Event]
        STORE[Store Event Log]
    end
    
    subgraph "Failure Scenarios"
        SIG_FAIL[Signature Verification Failed]
        PROC_FAIL[Processing Failed]
        DB_FAIL[Database Write Failed]
    end
    
    subgraph "Recovery Mechanisms"
        RETRY[Stripe Automatic Retry]
        MANUAL[Manual Webhook Replay]
        SYNC_API[Direct Stripe API Sync]
        ADMIN[Admin Dashboard Review]
    end
    
    WEBHOOK --> VERIFY
    VERIFY --> PROCESS
    PROCESS --> STORE
    
    VERIFY -.->|Fails| SIG_FAIL
    PROCESS -.->|Fails| PROC_FAIL
    STORE -.->|Fails| DB_FAIL
    
    SIG_FAIL --> RETRY
    PROC_FAIL --> RETRY
    PROC_FAIL --> MANUAL
    DB_FAIL --> SYNC_API
    
    MANUAL --> ADMIN
    SYNC_API --> ADMIN
    
    style SIG_FAIL fill:#ff6b6b
    style PROC_FAIL fill:#ff6b6b
    style DB_FAIL fill:#ff6b6b
    style RETRY fill:#4ecdc4
    style MANUAL fill:#ffd93d
    style SYNC_API fill:#ffd93d
```

---

## 🔍 Monitoring & Observability

### Key Metrics Dashboard

```mermaid
graph TB
    subgraph "Business Metrics"
        MRR[Monthly Recurring Revenue]
        CHURN[Churn Rate]
        LTV[Customer Lifetime Value]
        CONV[Conversion Rate]
    end
    
    subgraph "Technical Metrics"
        WEBHOOK_SUCCESS[Webhook Success Rate]
        API_LATENCY[API Response Times]
        CACHE_HIT[Cache Hit Ratio]
        SYNC_LAG[Sync Lag Time]
    end
    
    subgraph "Operational Metrics"
        FAILED_PAYMENTS[Failed Payments]
        RETRIES[Payment Retries]
        SUPPORT_TICKETS[Support Requests]
        PORTAL_USAGE[Portal Usage]
    end
    
    subgraph "Data Sources"
        STRIPE_DATA[Stripe Analytics]
        CONVEX_LOGS[Convex Logs]
        APP_ANALYTICS[Application Analytics]
        WEBHOOK_LOGS[Webhook Event Logs]
    end
    
    STRIPE_DATA --> MRR
    STRIPE_DATA --> CHURN
    CONVEX_LOGS --> WEBHOOK_SUCCESS
    CONVEX_LOGS --> CACHE_HIT
    WEBHOOK_LOGS --> SYNC_LAG
    APP_ANALYTICS --> CONV
    
    style STRIPE_DATA fill:#635bff
    style CONVEX_LOGS fill:#4ecdc4
    style APP_ANALYTICS fill:#45b7d1
    style WEBHOOK_LOGS fill:#96ceb4
```

---

## 🎯 Integration Patterns Summary

### Best Practices Implemented

1. **Single Source of Truth**: Stripe owns all billing data
2. **Event-Driven Architecture**: Webhooks drive state synchronization
3. **Idempotent Processing**: Prevent duplicate webhook processing
4. **Graceful Degradation**: Cache misses fall back to Stripe API
5. **Minimal Data Storage**: Only cache essential data for performance
6. **Strong Typing**: TypeScript ensures type safety across all layers
7. **Error Boundaries**: Comprehensive error handling and recovery
8. **Real-time Updates**: Convex subscriptions push updates to UI

### Security Considerations

- **PCI Compliance**: No payment data stored in Convex
- **Webhook Security**: Signature verification on all webhook events
- **Authentication**: Clerk integration for user authentication
- **Authorization**: User-scoped access to subscription data
- **Audit Trail**: Complete webhook event logging

### Performance Optimizations

- **Subscription Caching**: Fast reads from Convex cache
- **Indexed Queries**: Optimized database indexes for common queries
- **Batch Processing**: Efficient webhook event processing
- **CDN Delivery**: Static assets served via Vercel Edge Network

This architecture ensures a robust, scalable, and maintainable Stripe integration that follows industry best practices while maintaining strong type safety and reliability for your T3 chat application.
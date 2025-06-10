# Environment Setup Guide

This guide will walk you through setting up environment variables and deploying your T3 Chat Cloneathon to production.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Moving from Dev to Production](#moving-from-dev-to-production)
- [Database Migrations](#database-migrations)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Fill in your development API keys
3. Run `pnpm dev` to start development
4. For production, follow the [Production Deployment](#production-deployment) section

## Environment Variables

### Required Variables

| Variable | Environment | Description | Where to Get |
|----------|-------------|-------------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client | Clerk public key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Server | Clerk secret key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `NEXT_PUBLIC_CLERK_FRONTEND_API_URL` | Client | Clerk frontend API URL | Auto-generated in Clerk Dashboard |
| `CONVEX_DEPLOYMENT` | Server | Convex deployment name | [Convex Dashboard](https://dashboard.convex.dev) → Settings |
| `NEXT_PUBLIC_CONVEX_URL` | Client | Convex API URL | [Convex Dashboard](https://dashboard.convex.dev) → Settings |
| `OPENAI_API_KEY` | Server | OpenAI API key | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Server | Anthropic API key | [Anthropic Console](https://console.anthropic.com/) |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Redirect after sign in | `/chat` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Redirect after sign up | `/chat` |
| `CLERK_JWT_KEY` | JWT verification key (production optimization) | `-----BEGIN PUBLIC KEY-----...` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Webhook verification secret | `whsec_...` |

## Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd t3-chat-cloneathon
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your development keys
```

### 3. Set Up Clerk (Development)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use existing
3. Go to **API Keys** tab
4. Copy the **Publishable Key** (`pk_test_...`) and **Secret Key** (`sk_test_...`)
5. The **Frontend API URL** is auto-generated

### 4. Set Up Convex (Development)

```bash
# Login to Convex
npx convex dev

# This will:
# - Create a development deployment
# - Generate CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL
# - Start the development server
```

### 5. Set Up AI Providers

#### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-...`)

#### Anthropic
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Copy the key (starts with `sk-ant-...`)

### 6. Start Development

```bash
pnpm dev
```

## Production Deployment

### Option 1: Vercel (Recommended)

#### 1. Create Production Clerk Application

1. In [Clerk Dashboard](https://dashboard.clerk.com), create a **new application** for production
2. Configure your production domain in **Domains** section
3. Copy production API keys (`pk_live_...` and `sk_live_...`)

#### 2. Create Production Convex Deployment

```bash
# Deploy to production
npx convex deploy --prod

# This generates production CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL
```

#### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
```

#### 4. Configure Environment Variables in Vercel

In your Vercel project dashboard → Settings → Environment Variables:

**Production Environment:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_secret
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://your-production-clerk.clerk.accounts.dev
CONVEX_DEPLOYMENT=prod:your-production-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-production-deployment.convex.cloud
OPENAI_API_KEY=sk-your_openai_api_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key
```

**Preview Environment:**
Use your **development** keys for preview deployments.

#### 5. Configure Custom Domain

1. In Vercel, go to **Settings** → **Domains**
2. Add your custom domain
3. Update Clerk production app with your custom domain

### Option 2: Other Platforms

For other platforms (Railway, Render, etc.), the process is similar:
1. Set up production services (Clerk, Convex)
2. Configure environment variables
3. Deploy using platform-specific methods

## Moving from Dev to Production

### Clerk: Dev → Production

1. **Create Production Instance:**
   - Create a **new** Clerk application for production
   - Configure production domain
   - Set up authentication methods

2. **Update Environment Variables:**
   - Use `pk_live_` and `sk_live_` keys
   - Update Frontend API URL

3. **Configure Domains:**
   - Add your production domain to Clerk
   - Set up redirect URLs

### Convex: Dev → Production

1. **Deploy to Production:**
   ```bash
   npx convex deploy --prod
   ```

2. **Set Production Environment Variables:**
   - Update `CONVEX_DEPLOYMENT` to `prod:your-deployment`
   - Update `NEXT_PUBLIC_CONVEX_URL`

3. **Migrate Data (if needed):**
   ```bash
   # Export from dev
   npx convex export --format=jsonl dev_data.jsonl

   # Import to prod (be careful!)
   npx convex import dev_data.jsonl --replace
   ```

## Database Migrations

### Convex Schema Changes

Convex handles schema migrations automatically, but follow these best practices:

#### Safe Schema Changes ✅

```typescript
// Adding new optional fields
export default defineSchema({
  messages: defineTable({
    content: v.string(),
    // ✅ Safe: Adding optional field
    metadata: v.optional(v.object({
      model: v.string(),
      tokens: v.number(),
    })),
  }),
})
```

#### Unsafe Schema Changes ❌

```typescript
// ❌ Unsafe: Removing required fields
// ❌ Unsafe: Changing field types
// ❌ Unsafe: Making optional fields required
```

#### Migration Workflow

1. **Development:**
   ```bash
   # Make schema changes
   npx convex dev
   # Test changes thoroughly
   ```

2. **Production:**
   ```bash
   # Deploy schema changes
   npx convex deploy --prod
   ```

3. **Data Migration (if needed):**
   ```typescript
   // Create migration function in convex/migrations.ts
   import { internalMutation } from "./_generated/server";

   export const migrateData = internalMutation({
     handler: async (ctx) => {
       // Migration logic here
     },
   });
   ```

### Breaking Changes

For breaking schema changes:

1. **Two-Phase Deployment:**
   - Phase 1: Add new field as optional
   - Phase 2: Populate data, make required
   - Phase 3: Remove old field

2. **Data Transformation:**
   ```bash
   # Run migration
   npx convex run migrations:migrateData
   ```

## CI/CD Pipeline

The project includes GitHub Actions for automated deployment:

### Workflow Features

- ✅ Automated testing
- ✅ Environment validation
- ✅ Convex deployment
- ✅ Vercel deployment
- ✅ Preview deployments

### Required GitHub Secrets

Add these to your repository secrets:

```
CLERK_SECRET_KEY
CONVEX_DEPLOY_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Manual Deployment

```bash
# Production deployment
pnpm build
npx convex deploy --prod
vercel --prod
```

## Troubleshooting

### Common Issues

#### 1. Environment Variable Errors

```
Error: Invalid environment variables
```

**Solution:**
- Check `.env.local` has all required variables
- Verify no trailing spaces
- Ensure production variables are set in deployment platform

#### 2. Clerk Authentication Errors

```
ClerkJS: Clerk has been loaded with an invalid publishable key
```

**Solution:**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct
- Check if using development key in production
- Ensure Frontend API URL matches

#### 3. Convex Connection Errors

```
ConvexError: Deployment not found
```

**Solution:**
- Verify `CONVEX_DEPLOYMENT` format: `dev:name` or `prod:name`
- Check `NEXT_PUBLIC_CONVEX_URL` is correct
- Run `npx convex dev` to recreate development deployment

#### 4. AI API Errors

```
Error: OpenAI API key is invalid
```

**Solution:**
- Verify API key format and validity
- Check billing and usage limits
- Ensure environment variable is set correctly

### Debug Commands

```bash
# Check environment variables
pnpm build --dry-run

# Test Convex connection
npx convex dev --once

# Verify Clerk configuration
npx @clerk/clerk-sdk-node --version

# Check deployment status
vercel ls
```

### Getting Help

1. **Convex Issues:** [Convex Discord](https://discord.gg/convex)
2. **Clerk Issues:** [Clerk Discord](https://discord.gg/clerk)
3. **Vercel Issues:** [Vercel Discord](https://discord.gg/vercel)
4. **AI SDK Issues:** [AI SDK GitHub](https://github.com/vercel/ai)

## Security Best Practices

1. **Never commit secrets to git**
2. **Use different keys for each environment**
3. **Rotate API keys regularly**
4. **Set up proper CORS policies**
5. **Enable Clerk security features**
6. **Monitor API usage and costs**

---

## Ready for Production? ✅

- [ ] All environment variables configured
- [ ] Production Clerk application created
- [ ] Production Convex deployment created
- [ ] Custom domain configured
- [ ] CI/CD pipeline set up
- [ ] Security settings reviewed
- [ ] Monitoring configured

Your T3 Chat Cloneathon is now ready for production deployment! 🚀
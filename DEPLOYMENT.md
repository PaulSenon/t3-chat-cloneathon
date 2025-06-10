# Production Deployment Guide 🚀

**Target Environment**: Vercel (Recommended)  
**Estimated Deployment Time**: 15-20 minutes  
**Prerequisites**: Vercel account, GitHub repository

---

## 🎯 Quick Deployment (TL;DR)

```bash
# 1. Deploy to Vercel
npx vercel --prod

# 2. Set environment variables in Vercel dashboard
# 3. Configure custom domain (optional)
# 4. Enable monitoring and analytics
```

---

## 📋 Pre-Deployment Checklist

### Required Accounts & Services
- [ ] **Vercel Account** - [Sign up](https://vercel.com)
- [ ] **GitHub Repository** - Code hosted and accessible
- [ ] **Convex Account** - Database and backend functions
- [ ] **Clerk Account** - Authentication service
- [ ] **Stripe Account** - Payment processing
- [ ] **Custom Domain** (optional) - DNS access required

### Environment Variables Required
```bash
# Convex (Database & Backend)
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Stripe (Payments)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Vercel KV (Resumable Streams)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Optional: Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=
```

---

## 🚀 Deployment Methods

### Method 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Follow prompts:
# - Link to existing project? No
# - Project name: t3-chat-cloneathon
# - Directory: ./
# - Override settings? No
```

### Method 2: GitHub Integration

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub
   - Select your repository

2. **Configure Build Settings**:
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm ci
   ```

3. **Deploy**:
   - Click "Deploy"
   - Wait for build completion (~2-3 minutes)

### Method 3: Manual Upload

1. **Build Locally**:
   ```bash
   npm run build
   ```

2. **Upload to Vercel**:
   - Use Vercel dashboard file upload
   - Upload `.next` directory
   - Configure environment variables

---

## ⚙️ Environment Configuration

### Vercel Dashboard Setup

1. **Navigate to Project Settings**:
   - Go to Vercel Dashboard
   - Select your project
   - Click "Settings" → "Environment Variables"

2. **Add All Required Variables**:
   ```bash
   # Copy from your .env.local file
   # Ensure production values are used
   ```

3. **Configure for Different Environments**:
   - **Production**: Live environment variables
   - **Preview**: Staging/testing variables
   - **Development**: Local development variables

### Convex Production Setup

```bash
# 1. Create production deployment
npx convex deploy --prod

# 2. Get production URL
npx convex deployment:url

# 3. Update Vercel environment variables
# CONVEX_DEPLOYMENT=your-prod-deployment
# NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Clerk Production Configuration

1. **Production Instance**:
   - Create production Clerk application
   - Configure allowed domains: `yourdomain.com`
   - Set up webhooks: `https://yourdomain.com/api/webhooks/clerk`

2. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```

### Stripe Production Setup

1. **Enable Live Mode**:
   - Switch to live mode in Stripe Dashboard
   - Get live API keys

2. **Configure Webhooks**:
   ```bash
   # Webhook URL: https://yourdomain.com/api/webhooks/stripe
   # Events to subscribe to:
   # - customer.subscription.created
   # - customer.subscription.updated
   # - customer.subscription.deleted
   # - invoice.payment_succeeded
   # - invoice.payment_failed
   ```

---

## 🔧 Advanced Configuration

### Custom Domain Setup

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Configuration**:
   - Automatic SSL with Let's Encrypt
   - Custom certificates supported

3. **DNS Records**:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### Performance Optimization

1. **Enable Analytics**:
   ```bash
   # In vercel.json
   {
     "analytics": {
       "id": "your-analytics-id"
     }
   }
   ```

2. **Configure Caching**:
   ```bash
   # In next.config.js
   const nextConfig = {
     headers: async () => [
       {
         source: '/api/:path*',
         headers: [
           { key: 'Cache-Control', value: 's-maxage=86400' }
         ]
       }
     ]
   }
   ```

3. **Edge Functions**:
   ```bash
   # Automatically configured for API routes
   # No additional setup required
   ```

---

## 🏗️ Database Migration

### Convex Schema Deployment

```bash
# 1. Deploy schema changes
npx convex deploy --prod

# 2. Run migrations (if any)
npx convex migration run --prod

# 3. Verify deployment
npx convex dashboard --prod
```

### Data Seeding (if required)

```bash
# 1. Create seed script
npx convex run seed:initialData --prod

# 2. Verify data
npx convex query users:list --prod
```

---

## 🔒 Security Configuration

### Environment Security

1. **Secrets Management**:
   - Use Vercel environment variables
   - Never commit secrets to Git
   - Rotate keys regularly

2. **Access Control**:
   ```bash
   # Restrict access to production deployment
   npx convex auth:configure --prod
   ```

### API Security

1. **Rate Limiting**:
   ```typescript
   // Configured in Convex functions
   export const rateLimitConfig = {
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // requests per window
   };
   ```

2. **CORS Configuration**:
   ```typescript
   // In API routes
   const corsOptions = {
     origin: ['https://yourdomain.com'],
     credentials: true
   };
   ```

---

## 📊 Monitoring & Analytics

### Vercel Analytics

1. **Enable Analytics**:
   - Go to Project Settings → Analytics
   - Enable Web Analytics
   - Configure custom events

2. **Performance Monitoring**:
   ```javascript
   // Track Core Web Vitals
   export function reportWebVitals(metric) {
     // Send to analytics provider
   }
   ```

### Error Tracking

1. **Sentry Integration** (Optional):
   ```bash
   npm install @sentry/nextjs
   ```

2. **Custom Error Handling**:
   ```typescript
   // In error boundaries and API routes
   console.error('Production error:', error);
   // Send to monitoring service
   ```

---

## 🧪 Post-Deployment Verification

### Functional Testing

1. **Authentication Flow**:
   - [ ] Sign up with Google/GitHub
   - [ ] User session persistence
   - [ ] Logout functionality

2. **Chat Functionality**:
   - [ ] Send messages to OpenAI
   - [ ] Send messages to Anthropic
   - [ ] Message history persistence
   - [ ] Real-time synchronization

3. **Payment Flow**:
   - [ ] Stripe checkout process
   - [ ] Subscription activation
   - [ ] Usage tracking

4. **Resumable Streams**:
   - [ ] Start AI response
   - [ ] Refresh page during streaming
   - [ ] Verify continuation

### Performance Testing

1. **Core Web Vitals**:
   ```bash
   # Use Lighthouse or WebPageTest
   npx lighthouse https://yourdomain.com --view
   ```

2. **Load Testing**:
   ```bash
   # Test concurrent users
   # Verify database performance
   # Check API response times
   ```

### Security Testing

1. **SSL Certificate**:
   ```bash
   # Verify SSL configuration
   curl -I https://yourdomain.com
   ```

2. **API Security**:
   - [ ] Authentication required for protected routes
   - [ ] Rate limiting functional
   - [ ] Input validation working

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Automated Testing

```bash
# Run tests before deployment
npm run test
npm run lint
npm run type-check
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check environment variables
   # Verify dependencies
   # Review build logs
   ```

2. **Database Connection**:
   ```bash
   # Verify Convex deployment
   # Check environment variables
   # Test connection manually
   ```

3. **Authentication Issues**:
   ```bash
   # Verify Clerk configuration
   # Check domain settings
   # Test webhook endpoints
   ```

### Debug Commands

```bash
# Check deployment status
vercel inspect yourdomain.com

# View logs
vercel logs yourdomain.com

# Test functions
vercel dev
```

---

## 🎯 Production Optimization

### Performance Tuning

1. **Bundle Optimization**:
   ```bash
   # Analyze bundle size
   npm run build && npm run analyze
   ```

2. **Database Optimization**:
   ```bash
   # Review query performance
   # Optimize indexes
   # Monitor usage patterns
   ```

3. **CDN Configuration**:
   - Static assets automatically optimized
   - Edge caching enabled
   - Image optimization configured

### Scaling Considerations

1. **Horizontal Scaling**:
   - Vercel automatically scales
   - No manual configuration needed
   - Pay-per-request pricing

2. **Database Scaling**:
   - Convex handles automatic scaling
   - Monitor usage and costs
   - Consider connection pooling

---

## 📞 Support & Maintenance

### Monitoring Checklist

- [ ] **Uptime monitoring** - Set up alerts
- [ ] **Error tracking** - Monitor error rates
- [ ] **Performance metrics** - Track Core Web Vitals
- [ ] **Usage analytics** - Monitor user behavior
- [ ] **Cost monitoring** - Track service usage

### Regular Maintenance

1. **Weekly**:
   - Review error logs
   - Check performance metrics
   - Monitor user feedback

2. **Monthly**:
   - Update dependencies
   - Review security patches
   - Optimize performance

3. **Quarterly**:
   - Audit environment variables
   - Review access permissions
   - Update documentation

---

## 🏆 Success Metrics

### Key Performance Indicators

- **Uptime**: 99.9%+
- **Page Load Time**: <2 seconds
- **First Token Response**: <500ms
- **Error Rate**: <0.1%
- **User Satisfaction**: Monitor feedback

### Competition Deployment Checklist

- [ ] **Live URL** - Accessible to judges
- [ ] **Demo Data** - Prepared for demonstration
- [ ] **Performance** - Optimized for judging
- [ ] **Documentation** - Complete and accessible
- [ ] **Monitoring** - Alerts configured

---

**🎉 Congratulations! Your T3 Chat Clone is now live in production!**

**Need help?** Check the troubleshooting section or contact the team.
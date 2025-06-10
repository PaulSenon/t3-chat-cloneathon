# Production Deployment Checklist

Use this checklist to ensure your T3 Chat Cloneathon is production-ready.

## 📋 Pre-Deployment Checklist

### Environment Setup ✅

- [ ] **Copy `.env.example` to `.env.local`**
- [ ] **Fill in all development API keys**
- [ ] **Test local development with `pnpm dev`**
- [ ] **Verify all environment variables in `env.ts`**

### Service Accounts & API Keys 🔑

#### Clerk Authentication
- [ ] **Development Clerk app configured**
  - [ ] Publishable Key (`pk_test_...`)
  - [ ] Secret Key (`sk_test_...`)
  - [ ] Frontend API URL set
- [ ] **Production Clerk app created** (separate from dev)
  - [ ] Publishable Key (`pk_live_...`)
  - [ ] Secret Key (`sk_live_...`)
  - [ ] Production domain added to Clerk app
  - [ ] Authentication methods configured

#### Convex Database
- [ ] **Development deployment working**
  - [ ] `npx convex dev` runs successfully
  - [ ] Schema validated
  - [ ] Sample data created (optional)
- [ ] **Production deployment created**
  - [ ] `npx convex deploy --prod` executed
  - [ ] Production environment variables set
  - [ ] Schema deployed successfully

#### AI Providers
- [ ] **OpenAI API Key**
  - [ ] Valid API key obtained
  - [ ] Billing configured
  - [ ] Rate limits understood
- [ ] **Anthropic API Key**
  - [ ] Valid API key obtained
  - [ ] Billing configured
  - [ ] Rate limits understood

### Code Quality 🧹

- [ ] **Linting passes** (`pnpm lint`)
- [ ] **Type checking passes** (`pnpm build --dry-run`)
- [ ] **No console.log statements in production code**
- [ ] **Error boundaries implemented**
- [ ] **Loading states implemented**

## 🚀 Deployment Steps

### 1. Vercel Setup (GitHub Actions Integration)

⚠️ **Important:** This setup uses GitHub Actions for deployment orchestration, not Vercel's automatic Git integration.

#### 1.1 Create Vercel Project
- [ ] **Vercel account created**
- [ ] **Project connected to Git repository**
- [ ] **Framework preset set to Next.js**
- [ ] **Build command set to default** (`next build`)
- [ ] **Output directory set to default** (`.next`)

#### 1.2 Disable Automatic Git Deployments
- [ ] **Git integration disabled** in Vercel Settings → Git
- [ ] **Repository disconnected** from Vercel
- [ ] **Only GitHub Actions will trigger deployments**

#### 1.3 Domain Configuration
- [ ] **Custom domain purchased** (required for production Clerk)
- [ ] **Domain added to Vercel project**
- [ ] **SSL certificate verified**
- [ ] **Domain added to production Clerk app**

### 2. Environment Variables in Vercel

Navigate to Vercel Dashboard → Your Project → Settings → Environment Variables

#### Production Environment Variables
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_live_...)
- [ ] `CLERK_SECRET_KEY` (sk_live_...)
- [ ] `NEXT_PUBLIC_CLERK_FRONTEND_API_URL`
- [ ] `CONVEX_DEPLOYMENT` (prod:your-deployment-name)
- [ ] `NEXT_PUBLIC_CONVEX_URL` (production URL)
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `NODE_ENV=production`

#### Preview Environment Variables (use dev keys)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_test_...)
- [ ] `CLERK_SECRET_KEY` (sk_test_...)
- [ ] `NEXT_PUBLIC_CLERK_FRONTEND_API_URL`
- [ ] `CONVEX_DEPLOYMENT` (dev:your-deployment-name)
- [ ] `NEXT_PUBLIC_CONVEX_URL` (dev URL)
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `NODE_ENV=development`

### 3. GitHub Actions Configuration

#### 3.1 Vercel Integration Setup
- [ ] **Vercel CLI installed** (`npm i -g vercel`)
- [ ] **Vercel login completed** (`vercel login`)
- [ ] **Project linked** (`vercel link`)
- [ ] **Vercel token obtained** (for GitHub secrets)
- [ ] **Project ID copied** from Vercel dashboard
- [ ] **Team ID copied** from Vercel dashboard

#### 3.2 GitHub Secrets Configuration
Add these to Repository Settings → Secrets and variables → Actions:

- [ ] `CLERK_SECRET_KEY` (production: sk_live_...)
- [ ] `CLERK_SECRET_KEY_DEV` (development: sk_test_...)
- [ ] `CONVEX_DEPLOY_KEY` (from `npx convex env get CONVEX_DEPLOY_KEY`)
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `VERCEL_TOKEN` (from `vercel whoami`)
- [ ] `VERCEL_ORG_ID` (Team ID from Vercel dashboard)
- [ ] `VERCEL_PROJECT_ID` (Project ID from Vercel dashboard)

#### 3.3 Workflow Configuration
- [ ] **`.github/workflows/deploy.yml` exists**
- [ ] **Workflow permissions set correctly**
- [ ] **Environment protection rules configured** (optional)
- [ ] **Branch protection rules set** (optional)

### 4. Configuration Files Verification

#### 4.1 `vercel.json` Configuration
- [ ] **No `buildCommand` specified** (GitHub Actions handles Convex)
- [ ] **Framework set to "nextjs"**
- [ ] **API function timeouts configured**
- [ ] **Security headers configured**
- [ ] **CORS settings appropriate**

#### 4.2 Environment Validation
- [ ] **`env.ts` includes all required variables**
- [ ] **AI API keys added to server validation**
- [ ] **Client variables properly prefixed**
- [ ] **No Convex variables in env.ts** (they have built-in validation)

## 🔍 Testing & Validation

### Pre-Launch Testing

- [ ] **Development environment fully functional**
- [ ] **All features working locally**
- [ ] **Authentication flow tested**
- [ ] **AI chat functionality working**
- [ ] **Error handling tested**

### GitHub Actions Testing

- [ ] **Push to feature branch triggers preview deployment**
- [ ] **Preview deployment accessible**
- [ ] **Authentication works on preview**
- [ ] **Database connections working**
- [ ] **AI providers responding**

### Production Testing

- [ ] **Push to main branch triggers production deployment**
- [ ] **Production URL accessible**
- [ ] **Custom domain working**
- [ ] **SSL certificate valid**
- [ ] **Authentication flow complete**
- [ ] **New user registration works**
- [ ] **Chat functionality works**
- [ ] **Real AI responses received**

## 🔒 Security & Performance

### Security Checklist

- [ ] **No API keys in client-side code**
- [ ] **Environment variables properly configured**
- [ ] **Security headers implemented**
- [ ] **CORS configured appropriately**
- [ ] **Rate limiting considered**
- [ ] **Input validation in place**
- [ ] **Vercel Git integration disabled**

### Performance Checklist

- [ ] **Build optimization enabled**
- [ ] **Static assets compressed**
- [ ] **Database queries optimized**
- [ ] **Caching strategies implemented**
- [ ] **Core Web Vitals acceptable**

## 📊 Monitoring & Maintenance

### Post-Launch Monitoring

- [ ] **Error tracking set up (optional)**
- [ ] **Performance monitoring configured (optional)**
- [ ] **Usage analytics set up (optional)**
- [ ] **Uptime monitoring configured (optional)**
- [ ] **GitHub Actions workflow monitoring**

### Maintenance Planning

- [ ] **Backup strategy defined**
- [ ] **Update procedures documented**
- [ ] **Incident response plan created**
- [ ] **Cost monitoring set up**

## 🆘 Troubleshooting Guide

### Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Build fails | Missing environment variables | Check all required vars are set |
| Auth not working | Wrong Clerk keys or domain | Verify production keys and domain config |
| DB connection fails | Convex deployment issue | Check CONVEX_DEPLOYMENT format |
| AI not responding | Invalid API keys | Verify OpenAI/Anthropic keys |
| SSL errors | Domain not configured | Check domain DNS and SSL settings |
| Double Convex deployment | Vercel Git still connected | Disable Vercel Git integration |
| GitHub Actions failing | Missing secrets | Check all GitHub secrets are set |

### Debug Commands

```bash
# Local debugging
pnpm build --dry-run
npx convex dev --once
vercel env ls

# Production debugging
vercel logs
npx convex logs --prod

# GitHub Actions debugging
# Go to GitHub → Actions tab → Click on workflow run
```

### Deployment Flow Verification

**Correct Flow:**
```
Git Push → GitHub Actions → Convex Deploy → Vercel Deploy → Live
```

**Incorrect Flow (avoid):**
```
Git Push → Vercel Auto-Deploy + GitHub Actions → Conflict/Double Deploy
```

## ✅ Final Launch Checklist

### Pre-Launch (Day Before)

- [ ] **All tests passing**
- [ ] **Production environment verified**
- [ ] **GitHub Actions workflow tested**
- [ ] **Backup procedures tested**
- [ ] **Team notified of launch**

### Launch Day

- [ ] **Final push to main branch**
- [ ] **GitHub Actions deployment successful**
- [ ] **Production functionality verified**
- [ ] **DNS propagation complete**
- [ ] **SSL certificate active**
- [ ] **Monitoring active**
- [ ] **Team ready for support**

### Post-Launch (First Week)

- [ ] **Monitor GitHub Actions logs**
- [ ] **Check error rates**
- [ ] **Check performance metrics**
- [ ] **Verify user flows**
- [ ] **Review usage patterns**
- [ ] **Document any issues**

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ **Application loads without errors**
- ✅ **Users can register and sign in**
- ✅ **Chat functionality works end-to-end**
- ✅ **AI responses are generated**
- ✅ **Performance meets requirements**
- ✅ **Security headers present**
- ✅ **GitHub Actions deploys successfully**
- ✅ **No deployment conflicts**

---

## 📞 Need Help?

If you encounter issues:

1. **Check the [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) guide**
2. **Review the troubleshooting section above**
3. **Check GitHub Actions logs** in your repository
4. **Check service status pages**:
   - [Vercel Status](https://www.vercel-status.com/)
   - [Convex Status](https://status.convex.dev/)
   - [Clerk Status](https://status.clerk.com/)
   - [OpenAI Status](https://status.openai.com/)
5. **Join relevant Discord communities for support**

## 🚀 Ready to Launch?

Once all items are checked off, your T3 Chat Cloneathon is ready for production!

**Deployment Architecture:**
```
GitHub Actions (Orchestrator)
├── Deploy Convex Backend
├── Deploy Next.js to Vercel
└── Verify Production Health
```

**Last Updated:** January 2025  
**Next Review:** Before major deployments
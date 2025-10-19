# 🚀 AWS Amplify Deployment Guide

## Step-by-Step Instructions to Deploy Your Hackathon Platform

---

## Prerequisites

- ✅ AWS Account with appropriate permissions
- ✅ GitHub repository: `https://github.com/ashmanpan/AI-Automation-Hackathon`
- ✅ Backend API deployed (or placeholder URL for testing)

---

## Step 1: Access AWS Amplify Console

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to AWS Amplify**:
   - Search for "Amplify" in the services search bar
   - Or go directly to: https://console.aws.amazon.com/amplify/

---

## Step 2: Create New Amplify App

1. **Click "New app"** (orange button in top-right)
2. **Select "Host web app"**
3. **Choose GitHub** as your Git provider
4. **Click "Continue"**

---

## Step 3: Authorize GitHub Access

1. **Authorize AWS Amplify** to access your GitHub account
2. If already authorized, you'll see your repositories immediately
3. **Select repository**: `ashmanpan/AI-Automation-Hackathon`
4. **Select branch**: `main`
5. **Click "Next"**

---

## Step 4: Configure Build Settings

Amplify will auto-detect the `amplify.yml` file in your repository.

**Verify the configuration shows:**
```yaml
Build command: npm run build
Base directory: frontend
Build output directory: frontend/dist
```

**If not auto-detected**, paste this configuration:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

**Click "Next"**

---

## Step 5: Add Environment Variables ⚠️ IMPORTANT

**Click "Advanced settings"** to expand environment variables section.

### Required Environment Variables:

#### Option A: Testing Without Backend (Use Placeholder)
```
VITE_API_URL = http://localhost:5000
VITE_WS_URL = http://localhost:5000
```
*Note: This will allow the frontend to build, but API calls won't work until you connect a real backend*

#### Option B: With Real Backend API
```
VITE_API_URL = <Your Backend API URL>
VITE_WS_URL = <Your Backend API URL>
```

**Examples:**
- API Gateway: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`
- Load Balancer: `https://api.yourdomain.com`
- Elastic Beanstalk: `https://your-app.us-east-1.elasticbeanstalk.com`

**Click "Next"**

---

## Step 6: Review and Deploy

1. **Review all settings**:
   - Repository: `ashmanpan/AI-Automation-Hackathon`
   - Branch: `main`
   - Build settings: ✓ Configured
   - Environment variables: ✓ Set

2. **Click "Save and deploy"**

---

## Step 7: Wait for Build (5-10 minutes)

You'll see 4 stages:
1. **Provision** - Setting up build environment
2. **Build** - Running `npm ci && npm run build`
3. **Deploy** - Deploying to CDN
4. **Verify** - Health checks

### Build Progress:
```
✓ Provision (1 min)
⏳ Build (3-5 mins)
⏳ Deploy (2-3 mins)
⏳ Verify (30 sec)
```

---

## Step 8: Access Your Live Application! 🎉

Once deployment completes, you'll see:
- **Domain**: `https://main.d1234567890.amplifyapp.com`
- **Status**: ✓ Deployed

**Click the domain link** to view your live hackathon platform!

---

## Step 9: Test the Application

### Public Access (No Login Required):
1. **Leaderboard**: `https://your-amplify-url/leaderboard`
   - Should display podium and rankings (empty if no data)

### Login and Test Roles:
1. **Login Page**: `https://your-amplify-url/login`
2. **Default Credentials**:
   - Username: `admin`
   - Password: `admin123`
3. **Test Admin Dashboard**: Should redirect to `/admin/dashboard`

---

## Step 10: Update Environment Variables with Real Backend

Once you have a backend API deployed:

1. **Go to Amplify Console** → Your App
2. **Click "App settings" → "Environment variables"**
3. **Update**:
   ```
   VITE_API_URL = https://your-real-backend-api.com
   VITE_WS_URL = https://your-real-backend-api.com
   ```
4. **Click "Save"**
5. **Redeploy**: Amplify will automatically rebuild

---

## Continuous Deployment 🔄

### Automatic Deployments:
From now on, **every git push to main** will trigger automatic deployment!

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# AWS Amplify automatically:
# ✓ Detects push
# ✓ Builds frontend
# ✓ Deploys to production
# ✓ Updates live URL
```

### Manual Redeploy:
1. Go to Amplify Console → Your App
2. Click "Redeploy this version"

---

## Custom Domain (Optional)

### Add Your Custom Domain:
1. **Go to**: App settings → Domain management
2. **Click**: "Add domain"
3. **Enter**: `hackathon.yourcompany.com`
4. **Configure DNS**: Follow AWS instructions
5. **SSL Certificate**: Automatically provisioned

**Result**: `https://hackathon.yourcompany.com`

---

## Monitoring & Logs

### View Build Logs:
1. Click on any build in the history
2. View detailed logs for each phase
3. Debug any build failures

### Access Logs:
1. App settings → Monitoring
2. View metrics, traffic, errors

---

## Troubleshooting

### Build Fails?

**Check:**
1. **Build logs** for specific errors
2. **Environment variables** are set correctly
3. **Node version**: Amplify uses Node 18 by default

**Add to amplify.yml if needed:**
```yaml
frontend:
  phases:
    preBuild:
      commands:
        - nvm use 18
        - cd frontend
        - npm ci
```

### Application Loads but API Calls Fail?

**Verify:**
1. `VITE_API_URL` is set correctly
2. Backend API is deployed and accessible
3. CORS is configured on backend to allow Amplify domain
4. Check browser console for errors (F12)

### Environment Variables Not Taking Effect?

**Remember to:**
1. Save environment variables
2. **Redeploy** the application
3. Amplify needs to rebuild with new env vars

---

## Next Steps After Deployment

### 1. Deploy Backend
- Use Docker on EC2, ECS, or Elastic Beanstalk
- Or use API Gateway + Lambda
- Update `VITE_API_URL` once backend is live

### 2. Set Up Database
- RDS PostgreSQL instance
- Run migrations from `database/migrations/`
- Seed initial admin user

### 3. Configure Backend Environment
See `backend/.env.aws` for required variables

### 4. Test Complete Flow
- Admin: Create exercises
- Judge: Grade submissions
- Participant: Solve challenges
- Public: View leaderboard

---

## Support

**AWS Amplify Documentation:**
- https://docs.aws.amazon.com/amplify/

**GitHub Repository:**
- https://github.com/ashmanpan/AI-Automation-Hackathon

**For Issues:**
- Check build logs in Amplify Console
- Review environment variables
- Verify backend connectivity

---

## Cost Estimate

**AWS Amplify Pricing (Free Tier):**
- Build minutes: 1000/month free
- Hosting: 15 GB served free
- Typical monthly cost: **$0-5** for small hackathons

**Note:** After free tier, ~$0.01 per build minute, ~$0.15/GB served

---

## 🎉 Congratulations!

Your hackathon platform is now live on AWS Amplify with:
- ✅ Automatic deployments on git push
- ✅ Global CDN distribution
- ✅ HTTPS enabled
- ✅ Auto-scaling
- ✅ Build & deploy logs

**Happy Hacking! 🚀**

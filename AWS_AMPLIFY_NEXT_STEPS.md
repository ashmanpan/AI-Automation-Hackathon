# AWS Amplify - Final Setup Steps

## ✅ Completed
- AWS Amplify app created successfully
- App ID: `d1bik9cnv8higc`
- Default domain: `d1bik9cnv8higc.amplifyapp.com`
- Environment variables configured:
  - `VITE_API_URL=http://localhost:5000`
  - `VITE_WS_URL=http://localhost:5000`

## 🔗 Next Step: Connect GitHub Repository

To complete the deployment, you need to authorize GitHub access via the AWS Console:

### Option 1: Direct Console Link (Recommended)
**Open this URL in your browser:**
```
https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d1bik9cnv8higc
```

### Option 2: Manual Navigation
1. Go to: https://console.aws.amazon.com/amplify/
2. Make sure you're in **us-east-1** region (top-right)
3. Click on **"AI-Automation-Hackathon"** app

### Steps to Connect GitHub:

1. **In the Amplify app console**, click **"Connect branch"** or **"Connect repository"**

2. **Select GitHub** as the Git provider

3. **Authorize AWS Amplify** to access your GitHub account
   - You'll be redirected to GitHub
   - Click "Authorize AWS Amplify"
   - Authenticate if prompted

4. **Select repository**: `ashmanpan/AI-Automation-Hackathon`

5. **Select branch**: `main`

6. **Review build settings**:
   - Amplify will auto-detect `amplify.yml`
   - Verify it shows:
     ```
     Build command: npm run build
     Base directory: frontend
     Output directory: frontend/dist
     ```

7. **Verify environment variables** (should already be set):
   - `VITE_API_URL = http://localhost:5000`
   - `VITE_WS_URL = http://localhost:5000`

   **Note:** Update these to your real backend URL when ready!

8. **Click "Save and deploy"**

9. **Wait for deployment** (5-10 minutes)
   - Provision
   - Build
   - Deploy
   - Verify

10. **Access your live app!**
    - URL: `https://main.d1bik9cnv8higc.amplifyapp.com`

## 🎯 After Deployment

### Test the Application:
```bash
# Public leaderboard (no login required)
https://main.d1bik9cnv8higc.amplifyapp.com/leaderboard

# Login page
https://main.d1bik9cnv8higc.amplifyapp.com/login

# Default credentials (from backend):
Username: admin
Password: admin123
```

### Update Environment Variables with Real Backend:
Once your backend is deployed:

1. Go to: App settings → Environment variables
2. Update:
   ```
   VITE_API_URL = https://your-backend-api.com
   VITE_WS_URL = https://your-backend-api.com
   ```
3. Click "Save"
4. Amplify will automatically redeploy

## 🔄 Continuous Deployment

From now on, **every git push to main** triggers automatic deployment:

```bash
git add .
git commit -m "Update features"
git push origin main
# AWS Amplify automatically builds and deploys!
```

## 📊 Monitoring

**View build logs:**
- Click on any build in the deployment history
- Check each phase (Provision, Build, Deploy, Verify)

**Access logs and metrics:**
- App settings → Monitoring
- View traffic, errors, performance

## 🎉 You're Almost There!

Just complete the GitHub connection in the AWS Console, and your hackathon platform will be live!

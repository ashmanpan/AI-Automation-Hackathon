# 🚀 Deployment Checklist - Both Versions Ready

**Last Updated:** October 19, 2025
**Status:** ✅ Both versions are ready for deployment

---

## ✅ COMPLETED: Backend Build Fixes

### TypeScript Compilation Errors - FIXED ✅

1. **Fixed `backend/src/config/minio.ts`** - Added null check for `obj.name`
2. **Fixed `backend/src/utils/jwt.ts`** - Fixed JWT type annotations

**Build Status:** ✅ **PASSING** (24 JavaScript files generated)

```bash
cd backend
npm run build  # ✅ Success!
```

---

## 📋 DEPLOYMENT OPTION 1: AWS Amplify (RECOMMENDED) ⭐

### Prerequisites Checklist

- [ ] AWS Account with billing enabled
- [ ] GitHub repository with code pushed
- [ ] OpenAI API key for AI grading
- [ ] Domain name (optional, for custom domain)

### Step 1: Create AWS Resources (30 minutes)

#### A. Create RDS PostgreSQL Database

**Option 1: AWS Console**
```
1. Go to RDS Console: https://console.aws.amazon.com/rds/
2. Click "Create database"
3. Settings:
   - Engine: PostgreSQL 15.4
   - Templates: Production (or Free tier for testing)
   - DB identifier: hackathon-postgres
   - Master username: postgres
   - Master password: [CREATE STRONG PASSWORD - Save this!]
   - Instance: db.t3.micro (Free tier) or db.t3.small (Production)
   - Storage: 20 GB with autoscaling to 100 GB
   - Public access: YES (for Amplify)
   - Database name: hackathon_platform

4. After creation (5-10 min), note the ENDPOINT
5. Configure Security Group:
   - Allow PostgreSQL (5432) from 0.0.0.0/0 (⚠️ restrict in production)
```

**Option 2: AWS CLI**
```bash
aws rds create-db-instance \
  --db-instance-identifier hackathon-postgres \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 20 \
  --db-name hackathon_platform \
  --backup-retention-period 7 \
  --publicly-accessible \
  --region us-east-1

# Wait for availability
aws rds wait db-instance-available --db-instance-identifier hackathon-postgres

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier hackathon-postgres \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

**Save these values:**
```
DB_HOST: hackathon-postgres.xxxxx.us-east-1.rds.amazonaws.com
DB_PASSWORD: YourSecurePassword123!
```

#### B. Create S3 Bucket

**Option 1: AWS Console**
```
1. Go to S3 Console: https://s3.console.aws.amazon.com/
2. Click "Create bucket"
3. Settings:
   - Bucket name: hackathon-files-[your-account-id]
   - Region: us-east-1
   - Block public access: Keep enabled
   - Versioning: Enable
4. After creation, configure CORS:
   - Bucket > Permissions > CORS
   - Paste the JSON below
```

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Option 2: AWS CLI**
```bash
# Create bucket
BUCKET_NAME="hackathon-files-$(aws sts get-caller-identity --query Account --output text)"
aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Configure CORS (create cors.json with config above first)
aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file://cors.json

echo "Bucket created: $BUCKET_NAME"
```

**Save this value:**
```
AWS_S3_BUCKET: hackathon-files-123456789012
```

#### C. Run Database Migrations

```bash
# Install psql if needed
brew install postgresql  # macOS
sudo apt install postgresql-client  # Linux

# Connect to RDS and run migrations
psql -h hackathon-postgres.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d hackathon_platform \
     < database/migrations/001_initial_schema.sql

# Enter password when prompted
```

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not done)
cd /home/kpanse/wsl-myprojects/CiscoSP-Hackathon
git init
git add .
git commit -m "Ready for AWS Amplify deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR-USERNAME/CiscoSP-Hackathon.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to AWS Amplify (15 minutes)

#### A. Create Amplify App

```
1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Click "New app" > "Host web app"
3. Connect repository:
   - Provider: GitHub
   - Authorize AWS Amplify
   - Repository: CiscoSP-Hackathon
   - Branch: main
4. App settings:
   - App name: hackathon-platform
   - Environment: production
```

#### B. Configure Build Settings

The `amplify.yml` file is already in your repo. Amplify will auto-detect it.

**Verify it contains:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd backend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: backend/dist
    files:
      - '**/*'
  cache:
    paths:
      - backend/node_modules/**/*
```

#### C. Set Environment Variables

In Amplify Console > Environment variables, add:

```bash
NODE_ENV=production
PORT=5000

# Database (from Step 1A)
DB_HOST=hackathon-postgres.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=hackathon_platform
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!

# JWT Secret (generate new one)
JWT_SECRET=your-random-32-char-secret-here-change-this
JWT_EXPIRES_IN=24h

# Storage (from Step 1B)
USE_MINIO=false
USE_AWS_S3=true
AWS_REGION=us-east-1
AWS_S3_BUCKET=hackathon-files-123456789012

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000

# AI Grading
AI_GRADING_ENABLED=true
AI_GRADING_AUTO=false

# File Upload
MAX_FILE_SIZE=10485760
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### D. Create IAM Service Role

```
1. In Amplify setup, click "Create new role"
2. Service: Amplify
3. Attach policies:
   - AmplifyBackendDeployFullAccess
   - AmazonS3FullAccess (or custom S3 policy)
   - AmazonRDSDataFullAccess
4. Role name: AmplifyBackendRole
5. Attach to app
```

#### E. Deploy

```
1. Click "Save and deploy"
2. Monitor build (5-10 minutes):
   - Provision
   - Build
   - Deploy
   - Verify
3. Note your app URL: https://main.d1234567890.amplifyapp.com
```

### Step 4: Test Deployment

```bash
# Health check
curl https://your-amplify-url.amplifyapp.com/api/health

# Login
curl -X POST https://your-amplify-url.amplifyapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return JWT token
```

### Step 5: Change Admin Password (CRITICAL!)

```bash
# Get token from login response
TOKEN="eyJhbGc..."

# Change password
curl -X POST https://your-amplify-url.amplifyapp.com/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "NewSecurePassword123!"
  }'
```

### Step 6: Configure Custom Domain (Optional)

```
1. Amplify Console > Domain management
2. Add domain
3. Configure DNS records
4. Wait for SSL certificate (5-10 min)
```

### ✅ AWS Amplify Deployment Complete!

**Your app is now:**
- ✅ Deployed with auto-scaling
- ✅ SSL/HTTPS enabled
- ✅ CI/CD from GitHub
- ✅ Using RDS PostgreSQL
- ✅ Using S3 for file storage

---

## 📋 DEPLOYMENT OPTION 2: On-Premises with Docker

### Prerequisites Checklist

- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] 4 GB RAM minimum
- [ ] 20 GB storage minimum
- [ ] OpenAI API key (optional, for AI grading)

### Step 1: Install Docker (if needed)

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

**macOS:**
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Docker Compose is included
```

### Step 2: Configure Environment

```bash
cd /home/kpanse/wsl-myprojects/CiscoSP-Hackathon/backend

# Copy template
cp .env.onprem .env

# Edit configuration
nano .env
```

**Update these values in `.env`:**
```bash
# Database - Match docker-compose.yml
DB_PASSWORD=postgres  # Or change both files

# JWT Secret - Generate new one
JWT_SECRET=your-random-32-char-secret-change-this

# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-api-key-here

# MinIO is already configured for Docker
# No changes needed unless you modify docker-compose.yml
```

### Step 3: Start Infrastructure

```bash
cd /home/kpanse/wsl-myprojects/CiscoSP-Hackathon

# Start PostgreSQL and MinIO
docker-compose up -d postgres minio

# Wait for services to be ready (30 seconds)
sleep 30

# Verify services are running
docker-compose ps
# Should show:
# - hackathon-postgres (healthy)
# - hackathon-minio (healthy)

# Check logs if needed
docker-compose logs postgres
docker-compose logs minio
```

### Step 4: Access MinIO Console

```
1. Open browser: http://localhost:9001
2. Login:
   - Username: minioadmin
   - Password: minioadmin
3. Verify bucket exists: hackathon-files
   - If not, create it manually
```

### Step 5: Run Database Migrations

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npm run migrate

# Should see: "Migrations completed successfully"

# Verify admin user exists
docker exec -it hackathon-postgres psql -U postgres -d hackathon_platform -c \
  "SELECT username, role FROM users WHERE role='admin';"
# Should show: admin | admin
```

### Step 6: Build and Start Backend

**Development Mode:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

**Production Mode with PM2:**
```bash
# Install PM2 globally
npm install -g pm2

# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name hackathon-backend

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it shows

# Monitor
pm2 monit

# View logs
pm2 logs hackathon-backend
```

### Step 7: Test Deployment

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return JWT token
```

### Step 8: Change Admin Password (CRITICAL!)

```bash
# Get token from login
TOKEN="eyJhbGc..."

# Change password
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "NewSecurePassword123!"
  }'
```

### Step 9: Configure Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install nginx  # Ubuntu
# or
brew install nginx  # macOS

# Create config
sudo nano /etc/nginx/sites-available/hackathon
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    client_max_body_size 10M;
}
```

```bash
# Enable and restart
sudo ln -s /etc/nginx/sites-available/hackathon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### ✅ On-Premises Deployment Complete!

**Your app is now:**
- ✅ Running on Docker
- ✅ Using PostgreSQL container
- ✅ Using MinIO for file storage
- ✅ Ready for local/on-prem use

---

## 📊 Deployment Comparison

| Feature | AWS Amplify | On-Premises |
|---------|-------------|-------------|
| **Setup Time** | 30 min | 15 min |
| **Cost** | $40-60/month | $0 (your hardware) |
| **Scaling** | Automatic | Manual |
| **CI/CD** | Automatic | Manual |
| **SSL** | Included | Manual (Let's Encrypt) |
| **Backups** | RDS automated | Manual |
| **Best For** | Production cloud | Development/On-prem |

---

## 🔐 Security Checklist

Both Deployments:
- [ ] Change default admin password (admin/admin123)
- [ ] Use strong JWT secret (32+ characters)
- [ ] Secure OpenAI API key
- [ ] Enable CORS restrictions in production
- [ ] Regular security updates

AWS Amplify:
- [ ] Restrict RDS security group (not 0.0.0.0/0)
- [ ] Enable RDS encryption
- [ ] Use AWS Secrets Manager
- [ ] Enable CloudTrail logging
- [ ] Configure CloudWatch alarms

On-Premises:
- [ ] Change MinIO credentials (minioadmin/minioadmin)
- [ ] Change PostgreSQL password
- [ ] Configure firewall (ufw/firewalld)
- [ ] Setup SSL with Let's Encrypt
- [ ] Regular backups configured

---

## 📈 Next Steps

After deployment:

1. **Build Frontend** (from `FRONTEND_TASKS.md`)
   - 7 tasks, 11-13 hours
   - React + TypeScript + Vite
   - Admin dashboard, team management, leaderboard

2. **Test All Features**
   - User import (CSV)
   - Team creation
   - Exercise creation
   - Submissions
   - AI grading
   - Leaderboard

3. **Production Hardening**
   - Monitor logs
   - Setup alerts
   - Configure backups
   - Load testing

---

## 🆘 Troubleshooting

### AWS Amplify Issues

**Build fails:**
```bash
# Check Amplify Console > Build history > View logs
# Common issues:
# - Missing environment variables
# - npm install failures
# - TypeScript errors (should be fixed now!)
```

**Cannot connect to database:**
```bash
# Check RDS security group allows 0.0.0.0/0 on port 5432
# Verify DB_HOST environment variable is correct
# Test from local machine:
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d hackathon_platform
```

**S3 access denied:**
```bash
# Verify IAM role attached to Amplify has S3 permissions
# Check AWS_S3_BUCKET environment variable matches bucket name
# Verify CORS configuration on bucket
```

### On-Premises Issues

**Docker containers won't start:**
```bash
# Check Docker is running
sudo systemctl status docker

# Check logs
docker-compose logs postgres
docker-compose logs minio

# Restart containers
docker-compose restart
```

**Cannot connect to MinIO:**
```bash
# Check if MinIO is running
docker-compose ps minio

# Access console
open http://localhost:9001

# Check backend MINIO_ENDPOINT=localhost (not 'minio' unless backend in Docker)
```

**Backend won't start:**
```bash
# Check build succeeded
cd backend && npm run build

# Check environment variables
cat .env

# Check logs
pm2 logs hackathon-backend
# or
npm run dev  # See errors directly
```

---

## ✅ Both Versions Are Ready!

You can now deploy to either:
- **AWS Amplify** (recommended for production)
- **On-Premises** (recommended for development/internal use)

Both use the **same codebase** - just different environment configurations!

**Happy deploying! 🚀**

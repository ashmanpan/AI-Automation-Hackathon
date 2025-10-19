# AWS Amplify Deployment Guide

This guide covers deploying the Hackathon Platform using AWS Amplify for simplified cloud deployment with automatic CI/CD.

## Table of Contents

1. [Why AWS Amplify?](#why-aws-amplify)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Setup Instructions](#setup-instructions)
5. [Database Setup (RDS)](#database-setup-rds)
6. [S3 Bucket Setup](#s3-bucket-setup)
7. [Amplify Hosting Setup](#amplify-hosting-setup)
8. [Environment Configuration](#environment-configuration)
9. [Deployment](#deployment)
10. [Post-Deployment](#post-deployment)
11. [Monitoring](#monitoring)
12. [Troubleshooting](#troubleshooting)

---

## Why AWS Amplify?

AWS Amplify provides a complete solution for fullstack application deployment:

### Benefits
- ✅ **Automatic CI/CD**: Deploys automatically on git push
- ✅ **Managed Infrastructure**: No need to manage EC2 instances
- ✅ **Built-in Services**: Easy integration with S3, RDS, Lambda
- ✅ **SSL/HTTPS**: Automatic SSL certificates
- ✅ **Global CDN**: CloudFront distribution included
- ✅ **Easy Rollback**: One-click rollback to previous versions
- ✅ **Branch Deployments**: Deploy multiple environments (dev, staging, prod)

### vs Traditional EC2 Deployment
| Feature | Amplify | EC2 |
|---------|---------|-----|
| Setup Time | 15-20 min | 45-60 min |
| CI/CD | Automatic | Manual setup |
| Scaling | Automatic | Manual |
| SSL Certificates | Automatic | Manual (Let's Encrypt) |
| Server Management | Managed | Self-managed |
| Cost (typical) | $50-80/month | $50-100/month |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AWS Amplify Hosting                   │
│              (Node.js Backend - Port 5000)              │
│         with CloudFront CDN & Automatic SSL             │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             ▼                           ▼
    ┌────────────────────┐     ┌──────────────────────┐
    │   Amazon RDS       │     │    Amazon S3         │
    │   PostgreSQL       │     │  (File Storage)      │
    │   (Database)       │     │                      │
    └────────────────────┘     └──────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │   OpenAI API       │
    │  (AI Grading)      │
    └────────────────────┘
```

---

## Prerequisites

### 1. AWS Account
- Active AWS account with billing enabled
- IAM user with appropriate permissions

### 2. GitHub Account
- Repository with your code
- Admin access to the repository

### 3. Development Tools
- AWS CLI installed and configured
- Git installed

### 4. Required Information
- OpenAI API key for AI grading
- Strong passwords for database and JWT

---

## Setup Instructions

### Step 1: Push Code to GitHub

```bash
# If not already done
cd /path/to/hackathon-platform
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/hackathon-platform.git
git branch -M main
git push -u origin main
```

### Step 2: Install AWS CLI (if not installed)

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download and install from: https://aws.amazon.com/cli/

# Configure
aws configure
```

---

## Database Setup (RDS)

### Option 1: Using AWS Console

1. **Go to RDS Console**: https://console.aws.amazon.com/rds/

2. **Create Database**:
   - Click "Create database"
   - Engine: PostgreSQL
   - Version: PostgreSQL 15.4
   - Templates: Free tier (or Production for production)

3. **Settings**:
   - DB instance identifier: `hackathon-postgres`
   - Master username: `postgres`
   - Master password: **[Create strong password]**

4. **Instance Configuration**:
   - DB instance class: `db.t3.micro` (free tier) or `db.t3.small` (production)

5. **Storage**:
   - Allocated storage: 20 GB
   - Storage type: General Purpose SSD (gp2)
   - Enable storage autoscaling: Yes
   - Maximum storage threshold: 100 GB

6. **Connectivity**:
   - VPC: Default VPC
   - Public access: **Yes** (for Amplify access)
   - VPC security group: Create new
     - Name: `hackathon-rds-sg`

7. **Database Options**:
   - Initial database name: `hackathon_platform`

8. **Backup**:
   - Backup retention: 7 days
   - Preferred backup window: Default

9. **Monitoring**:
   - Enable Enhanced Monitoring: Optional

10. **Create Database** (takes 5-10 minutes)

11. **Configure Security Group**:
    - Go to EC2 > Security Groups
    - Find `hackathon-rds-sg`
    - Edit inbound rules
    - Add rule:
      - Type: PostgreSQL
      - Port: 5432
      - Source: `0.0.0.0/0` (⚠️ For production, restrict this to Amplify IPs)

### Option 2: Using AWS CLI

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier hackathon-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 20 \
  --db-name hackathon_platform \
  --backup-retention-period 7 \
  --publicly-accessible \
  --region us-east-1

# Wait for instance to be available (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier hackathon-postgres

# Get endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier hackathon-postgres \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"
# Save this endpoint for later
```

### Step 3: Run Database Migrations

```bash
# Install PostgreSQL client (if not installed)
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt install postgresql-client

# Connect and run migrations
psql -h <RDS-ENDPOINT> -U postgres -d hackathon_platform < database/migrations/001_initial_schema.sql

# Enter password when prompted
```

---

## S3 Bucket Setup

### Option 1: Using AWS Console

1. **Go to S3 Console**: https://s3.console.aws.amazon.com/

2. **Create Bucket**:
   - Click "Create bucket"
   - Bucket name: `hackathon-files-[your-account-id]` (must be globally unique)
   - Region: `us-east-1` (or your preferred region)

3. **Block Public Access**:
   - Keep "Block all public access" enabled

4. **Bucket Versioning**:
   - Enable versioning

5. **Tags** (optional):
   - Add tags for organization

6. **Create Bucket**

7. **Configure CORS**:
   - Go to bucket > Permissions > CORS
   - Add this configuration:
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

### Option 2: Using AWS CLI

```bash
# Create bucket
BUCKET_NAME="hackathon-files-$(aws sts get-caller-identity --query Account --output text)"
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Configure CORS
cat > cors.json << 'EOF'
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file://cors.json

echo "S3 Bucket: $BUCKET_NAME"
# Save this bucket name for later
```

---

## Amplify Hosting Setup

### Step 1: Go to AWS Amplify Console

https://console.aws.amazon.com/amplify/

### Step 2: Create New App

1. Click "New app" > "Host web app"

2. **Connect Repository**:
   - Select: GitHub
   - Authorize AWS Amplify to access your GitHub
   - Repository: Select `hackathon-platform`
   - Branch: `main`

3. **App Settings**:
   - App name: `hackathon-platform`
   - Environment name: `production`

### Step 3: Build Settings

Amplify should auto-detect the `amplify.yml` file. If not, paste this configuration:

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

### Step 4: Advanced Settings

1. **Create Service Role** (if you don't have one):
   - Click "Create new role"
   - Service: Amplify
   - Policy: AmplifyBackendDeployFullAccess
   - Role name: `AmplifyRole`

2. **Attach Additional Policies** to the role:
   - Go to IAM Console
   - Find `AmplifyRole`
   - Attach policies:
     - `AmazonS3FullAccess` (or custom S3 policy)
     - `AmazonRDSDataFullAccess`

---

## Environment Configuration

### Step 1: Add Environment Variables in Amplify Console

1. Go to Amplify Console
2. Select your app
3. Go to "Environment variables" (left sidebar)
4. Add these variables:

```
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=<YOUR-RDS-ENDPOINT>
DB_PORT=5432
DB_NAME=hackathon_platform
DB_USER=postgres
DB_PASSWORD=<YOUR-RDS-PASSWORD>

# JWT Configuration
JWT_SECRET=<GENERATE-A-STRONG-SECRET-32-CHARS>

# Storage Configuration
USE_MINIO=false
USE_AWS_S3=true
AWS_REGION=us-east-1
AWS_S3_BUCKET=<YOUR-S3-BUCKET-NAME>

# Note: AWS credentials are automatically provided by Amplify IAM role
# No need to set AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY

# OpenAI Configuration
OPENAI_API_KEY=<YOUR-OPENAI-API-KEY>
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000

# AI Grading Configuration
AI_GRADING_ENABLED=true
AI_GRADING_AUTO=false

# File Upload Configuration
MAX_FILE_SIZE=10485760
```

### Generate Strong JWT Secret

```bash
# Generate a random 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deployment

### Step 1: Deploy

1. In Amplify Console, click "Save and deploy"

2. Amplify will:
   - Pull code from GitHub
   - Install dependencies
   - Build the application
   - Deploy to CloudFront CDN

3. **Deployment time**: 5-10 minutes

4. Monitor the build:
   - Provision
   - Build
   - Deploy
   - Verify

### Step 2: Get Your App URL

Once deployed, you'll see:
```
https://main.d1234567890.amplifyapp.com
```

---

## Post-Deployment

### Step 1: Test API

```bash
# Health check
curl https://your-amplify-url.amplifyapp.com/api/health

# Login
curl -X POST https://your-amplify-url.amplifyapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Step 2: Change Admin Password

```bash
# Get JWT token from login response
TOKEN="your-jwt-token"

# Change password
curl -X POST https://your-amplify-url.amplifyapp.com/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "YourNewSecurePassword123!"
  }'
```

### Step 3: Configure Custom Domain (Optional)

1. In Amplify Console > Domain management
2. Click "Add domain"
3. Enter your domain name
4. Follow DNS configuration steps
5. Wait for SSL certificate (5-10 minutes)

---

## Continuous Deployment

### Automatic Deployment

Every time you push to GitHub, Amplify will automatically:
1. Pull latest code
2. Run build
3. Deploy if build succeeds

### Manual Redeploy

In Amplify Console:
1. Go to your app
2. Click "Redeploy this version"

### Rollback

In Amplify Console:
1. Go to build history
2. Find previous successful build
3. Click "Redeploy"

---

## Monitoring

### CloudWatch Logs

1. Go to CloudWatch Console
2. Log groups > `/aws/amplify/[your-app-name]`
3. View logs

### Amplify Monitoring

In Amplify Console:
1. Go to "Monitoring"
2. View:
   - Build history
   - Deployment status
   - Performance metrics
   - Error logs

### Cost Monitoring

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

---

## Scaling

### Amplify Auto-scaling

Amplify automatically scales based on traffic. No configuration needed.

### Database Scaling

To scale RDS:

```bash
# Modify instance class
aws rds modify-db-instance \
  --db-instance-identifier hackathon-postgres \
  --db-instance-class db.t3.small \
  --apply-immediately
```

---

## Troubleshooting

### Build Fails

**Check build logs**:
1. Amplify Console > Build history
2. Click failed build
3. View logs

**Common issues**:
- Missing environment variables
- npm install failures
- Build command errors

### Cannot Connect to Database

1. **Check RDS security group**:
   ```bash
   aws ec2 describe-security-groups \
     --filters Name=group-name,Values=hackathon-rds-sg
   ```

2. **Verify RDS is publicly accessible**
3. **Test connection from local machine**:
   ```bash
   psql -h <RDS-ENDPOINT> -U postgres -d hackathon_platform
   ```

### S3 Access Denied

1. **Check IAM role attached to Amplify**
2. **Verify S3 bucket policy**
3. **Check environment variable `AWS_S3_BUCKET`**

### High Costs

**Identify expensive services**:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Cost optimization**:
- Use RDS Reserved Instances (save up to 60%)
- Enable S3 Lifecycle policies
- Delete old Amplify builds

---

## Estimated Costs

### Monthly Cost Breakdown

| Service | Configuration | Approximate Cost |
|---------|--------------|------------------|
| AWS Amplify Hosting | Build + Hosting | $15-25/month |
| RDS t3.micro | PostgreSQL | $15/month |
| RDS t3.small | PostgreSQL (recommended) | $30/month |
| S3 Storage | 10 GB + requests | $1-5/month |
| Data Transfer | 10 GB out | $1/month |
| **Total (t3.micro)** | | **~$32-46/month** |
| **Total (t3.small)** | | **~$47-61/month** |

**Plus**: OpenAI API costs (see MINIO_AI_GRADING_GUIDE.md)

---

## Cleanup (Delete Resources)

### Delete Amplify App

```bash
# Using Console
1. Amplify Console > App > Actions > Delete app

# Using CLI
aws amplify delete-app --app-id <APP-ID>
```

### Delete RDS Instance

```bash
# With final snapshot
aws rds delete-db-instance \
  --db-instance-identifier hackathon-postgres \
  --final-db-snapshot-identifier hackathon-final-snapshot

# Without snapshot (⚠️ Data will be lost)
aws rds delete-db-instance \
  --db-instance-identifier hackathon-postgres \
  --skip-final-snapshot
```

### Delete S3 Bucket

```bash
# Empty bucket first
aws s3 rm s3://$BUCKET_NAME --recursive

# Delete bucket
aws s3api delete-bucket --bucket $BUCKET_NAME
```

---

## Security Best Practices

1. ✅ Change default admin password immediately
2. ✅ Use strong JWT secret (32+ characters)
3. ✅ Restrict RDS security group (not 0.0.0.0/0 in production)
4. ✅ Enable RDS encryption at rest
5. ✅ Use AWS Secrets Manager for sensitive data
6. ✅ Enable CloudTrail for audit logging
7. ✅ Regularly update dependencies
8. ✅ Monitor CloudWatch logs for suspicious activity

---

## Next Steps

1. **Configure Custom Domain**: Add your domain name
2. **Setup Email Notifications**: Use AWS SES
3. **Add Monitoring Alerts**: CloudWatch alarms
4. **Setup Staging Environment**: Create separate branch/app
5. **Enable WAF**: Add Web Application Firewall
6. **Backup Strategy**: Automated RDS snapshots

---

## Support

- AWS Amplify Docs: https://docs.amplify.aws/
- AWS RDS Docs: https://docs.aws.amazon.com/rds/
- AWS S3 Docs: https://docs.aws.amazon.com/s3/
- Project Issues: GitHub repository

---

## Comparison with Other Options

| Feature | Amplify | CloudFormation + EC2 | On-Prem Docker |
|---------|---------|---------------------|----------------|
| Setup Time | 20 min | 45 min | 10 min |
| CI/CD | ✅ Automatic | ❌ Manual | ❌ Manual |
| Scaling | ✅ Automatic | ⚠️ Manual | ❌ None |
| Cost | $40-60/month | $50-100/month | Free (own hardware) |
| Maintenance | ✅ Managed | ❌ Self-managed | ❌ Self-managed |
| Best For | Production apps | Enterprise/Custom | Development/Testing |

**Recommendation**: Use Amplify for production deployment for easier management and automatic scaling.

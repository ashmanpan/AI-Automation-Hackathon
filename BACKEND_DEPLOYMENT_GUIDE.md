# 🚀 Backend Deployment Guide - AWS

Complete guide to deploy your hackathon backend on AWS with multiple deployment options.

---

## 📋 Prerequisites

- ✅ AWS Account: `567097740753` (new-sept2025-runon)
- ✅ AWS CLI configured with profile: `new-sept2025-runon`
- ✅ Docker installed locally
- ✅ Backend code in `backend/` directory

---

## 🎯 Deployment Options

| Option | Complexity | Cost | Best For |
|--------|-----------|------|----------|
| **AWS App Runner** | ⭐ Easy | $ | Quick deployment |
| **AWS ECS Fargate** | ⭐⭐ Medium | $$ | Production-ready |
| **AWS Elastic Beanstalk** | ⭐⭐ Medium | $$ | Traditional apps |
| **AWS EC2 + Docker** | ⭐⭐⭐ Complex | $ | Full control |

**Recommended: AWS App Runner or ECS Fargate**

---

## 🚀 Option 1: AWS App Runner (Easiest & Recommended)

### Step 1: Prepare Backend

```bash
cd /home/kpanse/wsl-myprojects/CiscoSP-Hackathon/backend

# Build and test locally
docker build -t hackathon-backend .
docker run -p 5000:5000 --env-file .env.aws hackathon-backend
```

### Step 2: Push to ECR (Elastic Container Registry)

```bash
export AWS_PROFILE=new-sept2025-runon
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=567097740753

# Create ECR repository
aws ecr create-repository \
  --repository-name hackathon-backend \
  --region $AWS_REGION

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push image
docker tag hackathon-backend:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/hackathon-backend:latest

docker push \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/hackathon-backend:latest
```

### Step 3: Create RDS PostgreSQL Database

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier hackathon-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-name hackathon_platform \
  --backup-retention-period 7 \
  --publicly-accessible \
  --region $AWS_REGION
```

**Wait 5-10 minutes for RDS to be available.**

### Step 4: Deploy with App Runner

```bash
# Create App Runner service
aws apprunner create-service \
  --service-name hackathon-backend \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/hackathon-backend:latest",
      "ImageConfiguration": {
        "Port": "5000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "5000",
          "DB_HOST": "<RDS-ENDPOINT>",
          "DB_PORT": "5432",
          "DB_NAME": "hackathon_platform",
          "DB_USER": "postgres",
          "DB_PASSWORD": "YourSecurePassword123!",
          "JWT_SECRET": "your-super-secret-jwt-key-change-in-production",
          "AWS_REGION": "us-east-1",
          "AWS_S3_BUCKET": "hackathon-uploads-bucket",
          "STORAGE_TYPE": "s3"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "1024",
    "Memory": "2048"
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }' \
  --region $AWS_REGION
```

### Step 5: Get App Runner URL

```bash
aws apprunner list-services --region $AWS_REGION

# Get service details
aws apprunner describe-service \
  --service-arn <SERVICE-ARN> \
  --region $AWS_REGION \
  --query 'Service.ServiceUrl' \
  --output text
```

**Your backend URL:** `https://xxxxxxxxxx.us-east-1.awsapprunner.com`

---

## 🐳 Option 2: AWS ECS Fargate (Production-Ready)

### Step 1: Create Infrastructure

Use the CloudFormation template (see below) or manual setup:

```bash
export AWS_PROFILE=new-sept2025-runon

# Create ECS Cluster
aws ecs create-cluster \
  --cluster-name hackathon-cluster \
  --region us-east-1

# Create task execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### Step 2: Create Task Definition

Save as `task-definition.json`:

```json
{
  "family": "hackathon-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::567097740753:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "backend",
    "image": "567097740753.dkr.ecr.us-east-1.amazonaws.com/hackathon-backend:latest",
    "portMappings": [{
      "containerPort": 5000,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "PORT", "value": "5000"},
      {"name": "DB_HOST", "value": "<RDS-ENDPOINT>"},
      {"name": "DB_PORT", "value": "5432"},
      {"name": "DB_NAME", "value": "hackathon_platform"},
      {"name": "DB_USER", "value": "postgres"},
      {"name": "DB_PASSWORD", "value": "YourSecurePassword123!"},
      {"name": "JWT_SECRET", "value": "your-super-secret-jwt-key"},
      {"name": "STORAGE_TYPE", "value": "s3"},
      {"name": "AWS_REGION", "value": "us-east-1"},
      {"name": "AWS_S3_BUCKET", "value": "hackathon-uploads"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/hackathon-backend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    }
  }]
}
```

Register task:
```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region us-east-1
```

### Step 3: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name hackathon-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --region us-east-1

# Create target group
aws elbv2 create-target-group \
  --name hackathon-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health \
  --region us-east-1

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn <ALB-ARN> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<TG-ARN> \
  --region us-east-1
```

### Step 4: Create ECS Service

```bash
aws ecs create-service \
  --cluster hackathon-cluster \
  --service-name hackathon-backend-service \
  --task-definition hackathon-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration '{
    "awsvpcConfiguration": {
      "subnets": ["subnet-xxxxx", "subnet-yyyyy"],
      "securityGroups": ["sg-xxxxx"],
      "assignPublicIp": "ENABLED"
    }
  }' \
  --load-balancers '[{
    "targetGroupArn": "<TG-ARN>",
    "containerName": "backend",
    "containerPort": 5000
  }]' \
  --region us-east-1
```

---

## 🎯 Option 3: Quick EC2 Deployment

### Launch EC2 Instance

```bash
export AWS_PROFILE=new-sept2025-runon

# Launch instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=hackathon-backend}]' \
  --user-data file://ec2-user-data.sh \
  --region us-east-1
```

**ec2-user-data.sh:**
```bash
#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# Pull and run container
docker run -d \
  -p 80:5000 \
  --restart always \
  --name hackathon-backend \
  -e NODE_ENV=production \
  -e DB_HOST=<RDS-ENDPOINT> \
  -e DB_PASSWORD=YourSecurePassword123! \
  567097740753.dkr.ecr.us-east-1.amazonaws.com/hackathon-backend:latest
```

---

## 📦 Database Migration

Once backend is deployed, run migrations:

```bash
# SSH into EC2 or use ECS Exec
# Or run migration container

docker run --rm \
  -e DB_HOST=<RDS-ENDPOINT> \
  -e DB_PASSWORD=YourSecurePassword123! \
  567097740753.dkr.ecr.us-east-1.amazonaws.com/hackathon-backend:latest \
  node dist/scripts/migrate.js
```

---

## 🔧 Update Frontend with Backend URL

Once backend is deployed, update Amplify:

```bash
export AWS_PROFILE=new-sept2025-runon
export BACKEND_URL="https://your-backend-url.com"

aws amplify update-app \
  --app-id d1bik9cnv8higc \
  --environment-variables \
    VITE_API_URL=$BACKEND_URL,VITE_WS_URL=$BACKEND_URL \
  --region us-east-1

# Trigger redeploy
aws amplify start-job \
  --app-id d1bik9cnv8higc \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

---

## 🌐 Custom Domain Setup

### Map ai-dev-hackathon.ciscoaidemo.com to backend:

#### Option A: Use Route 53

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name ciscoaidemo.com \
  --caller-reference $(date +%s)

# Create A record for backend
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE-ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "ai-dev-hackathon.ciscoaidemo.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "<ALB-DNS-NAME>"}]
      }
    }]
  }'
```

#### Option B: AWS Certificate Manager (SSL)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name ai-dev-hackathon.ciscoaidemo.com \
  --validation-method DNS \
  --region us-east-1

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn <ALB-ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<CERT-ARN> \
  --default-actions Type=forward,TargetGroupArn=<TG-ARN>
```

---

## 🧪 Test Backend

```bash
# Health check
curl https://your-backend-url.com/health

# Login test
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# WebSocket test (from browser console)
const socket = io('https://your-backend-url.com')
socket.on('connect', () => console.log('Connected!'))
```

---

## 📊 Estimated Costs (Monthly)

| Service | Configuration | Cost |
|---------|--------------|------|
| **RDS PostgreSQL** | db.t3.micro (20GB) | ~$15 |
| **App Runner** | 1 vCPU, 2GB RAM | ~$20-30 |
| **ECS Fargate** | 0.5 vCPU, 1GB RAM (2 tasks) | ~$25-35 |
| **ALB** | Standard | ~$16 |
| **S3** | 10GB storage + transfers | ~$3 |
| **ECR** | Image storage | ~$1 |
| **Total (App Runner)** | | **~$40-50/month** |
| **Total (ECS Fargate)** | | **~$60-70/month** |

---

## 🚀 Quick Start Script

I'll create an automated deployment script for you. Would you like me to:

1. **Deploy with App Runner** (easiest, recommended)
2. **Deploy with ECS Fargate** (production-ready)
3. **Deploy to EC2** (full control)

Let me know which option you prefer, and I'll create the deployment script!

---

## 📚 Next Steps

1. Choose deployment option
2. Run deployment script
3. Update Amplify frontend with backend URL
4. Test complete application flow
5. Set up monitoring and logging

---

**Ready to deploy?** Tell me which option you prefer! 🚀

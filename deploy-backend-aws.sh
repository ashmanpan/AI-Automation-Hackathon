#!/bin/bash

set -e  # Exit on error

echo "🚀 AWS Backend Deployment Script"
echo "=================================="
echo ""

# Configuration
export AWS_PROFILE=new-sept2025-runon
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=567097740753
export APP_NAME=hackathon-backend
export DB_PASSWORD="HackathonDB2025!"
export JWT_SECRET="jwt-secret-key-change-in-production-$(date +%s)"
export S3_BUCKET="hackathon-uploads-${AWS_ACCOUNT_ID}"

echo "📋 Configuration:"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   Region: $AWS_REGION"
echo "   App Name: $APP_NAME"
echo ""

# Step 1: Create S3 Bucket for uploads
echo "📦 Step 1/7: Creating S3 bucket..."
aws s3api create-bucket \
  --bucket $S3_BUCKET \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION 2>/dev/null || echo "   Bucket already exists"

aws s3api put-bucket-cors \
  --bucket $S3_BUCKET \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }' 2>/dev/null || true

echo "   ✅ S3 bucket ready: $S3_BUCKET"
echo ""

# Step 2: Create RDS Database
echo "🗄️  Step 2/7: Creating RDS PostgreSQL database..."

RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier hackathon-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text 2>/dev/null || echo "")

if [ -z "$RDS_ENDPOINT" ] || [ "$RDS_ENDPOINT" == "None" ]; then
  echo "   Creating new RDS instance (this takes 5-10 minutes)..."

  # Get default VPC and security group
  DEFAULT_VPC=$(aws ec2 describe-vpcs \
    --filters "Name=is-default,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text)

  DEFAULT_SG=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$DEFAULT_VPC" "Name=group-name,Values=default" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

  # Add PostgreSQL ingress rule
  aws ec2 authorize-security-group-ingress \
    --group-id $DEFAULT_SG \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 2>/dev/null || echo "   PostgreSQL rule already exists"

  aws rds create-db-instance \
    --db-instance-identifier hackathon-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.14 \
    --master-username postgres \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --vpc-security-group-ids $DEFAULT_SG \
    --db-name hackathon_platform \
    --backup-retention-period 7 \
    --publicly-accessible \
    --region $AWS_REGION \
    --no-multi-az \
    --storage-type gp3 > /dev/null

  echo "   Waiting for RDS to be available..."
  aws rds wait db-instance-available \
    --db-instance-identifier hackathon-db \
    --region $AWS_REGION

  RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier hackathon-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

  echo "   ✅ RDS created: $RDS_ENDPOINT"
else
  echo "   ✅ RDS already exists: $RDS_ENDPOINT"
fi
echo ""

# Step 3: Create ECR Repository
echo "🐳 Step 3/7: Creating ECR repository..."
aws ecr create-repository \
  --repository-name $APP_NAME \
  --region $AWS_REGION 2>/dev/null || echo "   Repository already exists"

echo "   ✅ ECR repository ready"
echo ""

# Step 4: Build and Push Docker Image
echo "🔨 Step 4/7: Building Docker image..."
cd backend

docker build -t $APP_NAME:latest . --platform linux/amd64

echo "   ✅ Image built"
echo ""

echo "📤 Step 5/7: Pushing to ECR..."
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push
docker tag $APP_NAME:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest

docker push \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest

echo "   ✅ Image pushed to ECR"
cd ..
echo ""

# Step 6: Deploy to App Runner
echo "🚀 Step 6/7: Deploying to AWS App Runner..."

# Get ECR access role ARN
ECR_ACCESS_ROLE_ARN=$(aws iam get-role \
  --role-name AppRunnerECRAccessRole \
  --query 'Role.Arn' \
  --output text 2>/dev/null || echo "")

if [ -z "$ECR_ACCESS_ROLE_ARN" ]; then
  echo "   Creating App Runner ECR access role..."
  aws iam create-role \
    --role-name AppRunnerECRAccessRole \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "build.apprunner.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' > /dev/null

  aws iam attach-role-policy \
    --role-name AppRunnerECRAccessRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess

  # Wait for role to propagate
  sleep 10

  ECR_ACCESS_ROLE_ARN=$(aws iam get-role \
    --role-name AppRunnerECRAccessRole \
    --query 'Role.Arn' \
    --output text)
fi

# Check if service exists
SERVICE_ARN=$(aws apprunner list-services \
  --query "ServiceSummaryList[?ServiceName=='$APP_NAME'].ServiceArn" \
  --output text 2>/dev/null || echo "")

if [ -z "$SERVICE_ARN" ]; then
  echo "   Creating new App Runner service..."

  SERVICE_ARN=$(aws apprunner create-service \
    --service-name $APP_NAME \
    --source-configuration '{
      "ImageRepository": {
        "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/'$APP_NAME':latest",
        "ImageConfiguration": {
          "Port": "5000",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "PORT": "5000",
            "DB_HOST": "'$RDS_ENDPOINT'",
            "DB_PORT": "5432",
            "DB_NAME": "hackathon_platform",
            "DB_USER": "postgres",
            "DB_PASSWORD": "'$DB_PASSWORD'",
            "JWT_SECRET": "'$JWT_SECRET'",
            "AWS_REGION": "'$AWS_REGION'",
            "AWS_S3_BUCKET": "'$S3_BUCKET'",
            "STORAGE_TYPE": "s3",
            "CORS_ORIGIN": "https://main.d1bik9cnv8higc.amplifyapp.com"
          }
        },
        "ImageRepositoryType": "ECR"
      },
      "AuthenticationConfiguration": {
        "AccessRoleArn": "'$ECR_ACCESS_ROLE_ARN'"
      },
      "AutoDeploymentsEnabled": true
    }' \
    --instance-configuration '{
      "Cpu": "1024",
      "Memory": "2048"
    }' \
    --health-check-configuration '{
      "Protocol": "HTTP",
      "Path": "/api/health",
      "Interval": 10,
      "Timeout": 5,
      "HealthyThreshold": 1,
      "UnhealthyThreshold": 5
    }' \
    --region $AWS_REGION \
    --query 'Service.ServiceArn' \
    --output text)

  echo "   Waiting for service to be running..."
  aws apprunner wait service-running \
    --service-arn "$SERVICE_ARN" \
    --region $AWS_REGION || true
else
  echo "   Service exists, updating..."
  aws apprunner update-service \
    --service-arn "$SERVICE_ARN" \
    --source-configuration '{
      "ImageRepository": {
        "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/'$APP_NAME':latest",
        "ImageConfiguration": {
          "Port": "5000",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "PORT": "5000",
            "DB_HOST": "'$RDS_ENDPOINT'",
            "DB_PORT": "5432",
            "DB_NAME": "hackathon_platform",
            "DB_USER": "postgres",
            "DB_PASSWORD": "'$DB_PASSWORD'",
            "JWT_SECRET": "'$JWT_SECRET'",
            "AWS_REGION": "'$AWS_REGION'",
            "AWS_S3_BUCKET": "'$S3_BUCKET'",
            "STORAGE_TYPE": "s3",
            "CORS_ORIGIN": "https://main.d1bik9cnv8higc.amplifyapp.com"
          }
        }
      }
    }' \
    --region $AWS_REGION > /dev/null
fi

# Get service URL
BACKEND_URL=$(aws apprunner describe-service \
  --service-arn "$SERVICE_ARN" \
  --region $AWS_REGION \
  --query 'Service.ServiceUrl' \
  --output text)

echo "   ✅ App Runner service deployed!"
echo "   Backend URL: https://$BACKEND_URL"
echo ""

# Step 7: Update Amplify Frontend
echo "🔗 Step 7/7: Connecting frontend to backend..."

aws amplify update-app \
  --app-id d1bik9cnv8higc \
  --environment-variables \
    VITE_API_URL=https://$BACKEND_URL,VITE_WS_URL=https://$BACKEND_URL \
  --region $AWS_REGION > /dev/null

echo "   ✅ Amplify environment variables updated"
echo ""

echo "🔄 Triggering frontend redeploy..."
aws amplify start-job \
  --app-id d1bik9cnv8higc \
  --branch-name main \
  --job-type RELEASE \
  --region $AWS_REGION > /dev/null

echo "   ✅ Frontend redeployment started"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Resources Created:"
echo "   • S3 Bucket: $S3_BUCKET"
echo "   • RDS Database: $RDS_ENDPOINT"
echo "   • Backend API: https://$BACKEND_URL"
echo "   • Frontend: https://main.d1bik9cnv8higc.amplifyapp.com"
echo ""
echo "🧪 Test Backend:"
echo "   curl https://$BACKEND_URL/api/health"
echo ""
echo "🔑 Database Credentials:"
echo "   Host: $RDS_ENDPOINT"
echo "   Database: hackathon_platform"
echo "   Username: postgres"
echo "   Password: $DB_PASSWORD"
echo ""
echo "⏱️  Frontend will be ready in ~5 minutes"
echo "   Monitor: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d1bik9cnv8higc"
echo ""
echo "🎉 Your hackathon platform is now fully deployed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

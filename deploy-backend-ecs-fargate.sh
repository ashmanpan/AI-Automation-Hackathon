#!/bin/bash

set -e

echo "🚀 ECS Fargate Backend Deployment"
echo "=================================="
echo ""

# Configuration
export AWS_PROFILE=new-sept2025-runon
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=567097740753
export CLUSTER_NAME=hackathon-cluster
export SERVICE_NAME=hackathon-backend
export TASK_FAMILY=hackathon-backend-task
export DB_PASSWORD="HackathonDB2025!"
export JWT_SECRET="jwt-secret-key-$(date +%s)"
export RDS_ENDPOINT="hackathon-db.cc1kkam20uyn.us-east-1.rds.amazonaws.com"
export S3_BUCKET="hackathon-uploads-${AWS_ACCOUNT_ID}"
export CONTAINER_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/hackathon-backend:latest"

echo "📋 Configuration:"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   Region: $AWS_REGION"
echo "   Cluster: $CLUSTER_NAME"
echo ""

# Step 1: Get Default VPC
echo "🌐 Step 1/10: Getting VPC information..."
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=is-default,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text)

SUBNET_1=$(echo $SUBNETS | awk '{print $1}')
SUBNET_2=$(echo $SUBNETS | awk '{print $2}')

echo "   VPC: $VPC_ID"
echo "   Subnets: $SUBNET_1, $SUBNET_2"
echo ""

# Step 2: Create Security Group for ALB
echo "🔐 Step 2/10: Creating Security Groups..."
ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name hackathon-alb-sg \
  --description "Security group for hackathon ALB" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=hackathon-alb-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow HTTP/HTTPS to ALB
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 2>/dev/null || true

# Create Security Group for ECS Tasks
ECS_SG_ID=$(aws ec2 create-security-group \
  --group-name hackathon-ecs-sg \
  --description "Security group for hackathon ECS tasks" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=hackathon-ecs-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow traffic from ALB to ECS
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 5000 \
  --source-group $ALB_SG_ID 2>/dev/null || true

echo "   ALB Security Group: $ALB_SG_ID"
echo "   ECS Security Group: $ECS_SG_ID"
echo ""

# Step 3: Create ECS Cluster
echo "🐳 Step 3/10: Creating ECS Cluster..."
aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  --region $AWS_REGION 2>/dev/null || echo "   Cluster already exists"

echo "   ✅ Cluster ready: $CLUSTER_NAME"
echo ""

# Step 4: Create IAM Role for ECS Task Execution
echo "👤 Step 4/10: Creating IAM Roles..."

# Task Execution Role
TASK_EXEC_ROLE_ARN=$(aws iam get-role \
  --role-name ecsTaskExecutionRole \
  --query 'Role.Arn' \
  --output text 2>/dev/null || echo "")

if [ -z "$TASK_EXEC_ROLE_ARN" ]; then
  aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' > /dev/null

  aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

  TASK_EXEC_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole"
fi

# Task Role (for S3 access)
TASK_ROLE_ARN=$(aws iam get-role \
  --role-name ecsTaskRole \
  --query 'Role.Arn' \
  --output text 2>/dev/null || echo "")

if [ -z "$TASK_ROLE_ARN" ]; then
  aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' > /dev/null

  aws iam attach-role-policy \
    --role-name ecsTaskRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

  TASK_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskRole"
fi

echo "   ✅ IAM Roles configured"
echo ""

# Step 5: Create CloudWatch Log Group
echo "📊 Step 5/10: Creating CloudWatch Log Group..."
aws logs create-log-group \
  --log-group-name /ecs/hackathon-backend \
  --region $AWS_REGION 2>/dev/null || echo "   Log group already exists"

echo "   ✅ Log group ready"
echo ""

# Step 6: Register Task Definition
echo "📝 Step 6/10: Registering ECS Task Definition..."

cat > /tmp/task-definition.json <<EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "$TASK_EXEC_ROLE_ARN",
  "taskRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [{
    "name": "backend",
    "image": "$CONTAINER_IMAGE",
    "essential": true,
    "portMappings": [{
      "containerPort": 5000,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "PORT", "value": "5000"},
      {"name": "DB_HOST", "value": "$RDS_ENDPOINT"},
      {"name": "DB_PORT", "value": "5432"},
      {"name": "DB_NAME", "value": "hackathon_platform"},
      {"name": "DB_USER", "value": "postgres"},
      {"name": "DB_PASSWORD", "value": "$DB_PASSWORD"},
      {"name": "JWT_SECRET", "value": "$JWT_SECRET"},
      {"name": "AWS_REGION", "value": "$AWS_REGION"},
      {"name": "AWS_S3_BUCKET", "value": "$S3_BUCKET"},
      {"name": "STORAGE_TYPE", "value": "s3"},
      {"name": "CORS_ORIGIN", "value": "https://main.d1bik9cnv8higc.amplifyapp.com"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/hackathon-backend",
        "awslogs-region": "$AWS_REGION",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    }
  }]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-definition.json \
  --region $AWS_REGION > /dev/null

echo "   ✅ Task definition registered"
echo ""

# Step 7: Create Application Load Balancer
echo "⚖️  Step 7/10: Creating Application Load Balancer..."

ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names hackathon-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$ALB_ARN" ] || [ "$ALB_ARN" == "None" ]; then
  ALB_ARN=$(aws elbv2 create-load-balancer \
    --name hackathon-alb \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

  echo "   Created new ALB"
else
  echo "   ALB already exists"
fi

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "   ALB DNS: $ALB_DNS"
echo ""

# Step 8: Create Target Group
echo "🎯 Step 8/10: Creating Target Group..."

TG_ARN=$(aws elbv2 describe-target-groups \
  --names hackathon-backend-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$TG_ARN" ] || [ "$TG_ARN" == "None" ]; then
  TG_ARN=$(aws elbv2 create-target-group \
    --name hackathon-backend-tg \
    --protocol HTTP \
    --port 5000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-enabled \
    --health-check-path /api/health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

  echo "   Created new Target Group"
else
  echo "   Target Group already exists"
fi

echo "   ✅ Target Group ready"
echo ""

# Step 9: Create ALB Listener
echo "👂 Step 9/10: Creating ALB Listener..."

LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[0].ListenerArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$LISTENER_ARN" ] || [ "$LISTENER_ARN" == "None" ]; then
  aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --region $AWS_REGION > /dev/null

  echo "   Created HTTP listener"
else
  echo "   Listener already exists"
fi

echo "   ✅ Listener configured"
echo ""

# Step 10: Create ECS Service
echo "🚀 Step 10/10: Creating ECS Service..."

SERVICE_EXISTS=$(aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --query 'services[0].serviceName' \
  --output text 2>/dev/null || echo "")

if [ "$SERVICE_EXISTS" == "$SERVICE_NAME" ]; then
  echo "   Updating existing service..."
  aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force-new-deployment \
    --region $AWS_REGION > /dev/null
else
  echo "   Creating new service..."
  aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $TASK_FAMILY \
    --desired-count 2 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=backend,containerPort=5000" \
    --health-check-grace-period-seconds 60 \
    --region $AWS_REGION > /dev/null
fi

echo "   ✅ ECS Service deployed"
echo ""

# Wait for service to stabilize
echo "⏳ Waiting for service to be stable (this may take 2-3 minutes)..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION

echo "   ✅ Service is stable!"
echo ""

# Update Amplify with backend URL
echo "🔗 Connecting frontend to backend..."

BACKEND_URL="http://$ALB_DNS"

aws amplify update-app \
  --app-id d1bik9cnv8higc \
  --environment-variables \
    VITE_API_URL=$BACKEND_URL,VITE_WS_URL=$BACKEND_URL \
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
echo "   • ECS Cluster: $CLUSTER_NAME"
echo "   • ECS Service: $SERVICE_NAME (2 tasks)"
echo "   • Application Load Balancer: $ALB_DNS"
echo "   • Target Group: hackathon-backend-tg"
echo "   • RDS Database: $RDS_ENDPOINT"
echo "   • S3 Bucket: $S3_BUCKET"
echo ""
echo "🌐 Backend URL:"
echo "   http://$ALB_DNS"
echo ""
echo "🧪 Test Backend:"
echo "   curl http://$ALB_DNS/api/health"
echo ""
echo "🎯 Frontend URL:"
echo "   https://main.d1bik9cnv8higc.amplifyapp.com"
echo ""
echo "⏱️  Frontend will be ready in ~5 minutes"
echo ""
echo "🎉 Your hackathon platform is now fully deployed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

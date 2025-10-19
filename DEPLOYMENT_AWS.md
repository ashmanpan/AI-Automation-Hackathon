# AWS Deployment Guide

This guide covers deploying the Hackathon Platform on AWS using S3, RDS, and various compute options.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Option 1: CloudFormation (Automated)](#option-1-cloudformation-automated)
4. [Option 2: Manual Setup](#option-2-manual-setup)
5. [Option 3: AWS Amplify](#option-3-aws-amplify)
6. [Option 4: Elastic Beanstalk](#option-4-elastic-beanstalk)
7. [Post-Deployment](#post-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Deployment Options

| Option | Best For | Complexity | Cost | Scalability |
|--------|----------|------------|------|-------------|
| CloudFormation | Complete infrastructure automation | Medium | $$$ | High |
| Manual Setup | Existing AWS infrastructure | High | $$ | Medium |
| AWS Amplify | Quick hosting | Low | $$ | Medium |
| Elastic Beanstalk | Managed application hosting | Low | $$$ | High |

---

## Prerequisites

### AWS Account Setup

1. **AWS Account** with billing enabled
2. **IAM User** with appropriate permissions:
   - EC2FullAccess
   - RDSFullAccess
   - S3FullAccess
   - CloudFormationFullAccess
   - IAMFullAccess (for role creation)

3. **AWS CLI** installed and configured:
   ```bash
   aws configure
   ```

4. **OpenAI API Key** for AI grading

### Cost Estimate

**Monthly costs (typical production setup):**
- EC2 t3.small: ~$15/month
- RDS t3.micro PostgreSQL: ~$15/month
- Application Load Balancer: ~$20/month
- S3 Storage (10 GB): ~$0.25/month
- Data Transfer: ~$1/month
- **Total: ~$51/month**

---

## Option 1: CloudFormation (Automated)

### Complete Infrastructure Deployment

This deploys everything: VPC, ALB, EC2, RDS, S3.

#### Step 1: Prepare Parameters

Create `parameters.json`:

```bash
cat > parameters.json << 'EOF'
[
  {
    "ParameterKey": "EnvironmentName",
    "ParameterValue": "hackathon-platform"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "your-key-pair-name"
  },
  {
    "ParameterKey": "InstanceType",
    "ParameterValue": "t3.small"
  },
  {
    "ParameterKey": "DBUsername",
    "ParameterValue": "postgres"
  },
  {
    "ParameterKey": "DBPassword",
    "ParameterValue": "YourSecurePassword123!"
  },
  {
    "ParameterKey": "JWTSecret",
    "ParameterValue": "your-jwt-secret-minimum-16-characters"
  },
  {
    "ParameterKey": "OpenAIAPIKey",
    "ParameterValue": "sk-your-openai-api-key"
  }
]
EOF
```

#### Step 2: Create Key Pair

```bash
aws ec2 create-key-pair \
  --key-name hackathon-key \
  --query 'KeyMaterial' \
  --output text > hackathon-key.pem

chmod 400 hackathon-key.pem
```

#### Step 3: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name hackathon-platform \
  --template-body file://aws-deployment/cloudformation/hackathon-infrastructure.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

#### Step 4: Monitor Progress

```bash
# Watch creation progress
aws cloudformation describe-stack-events \
  --stack-name hackathon-platform \
  --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table

# Wait for completion (10-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name hackathon-platform
```

#### Step 5: Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name hackathon-platform \
  --query 'Stacks[0].Outputs' \
  --output table
```

Save these values:
- **LoadBalancerURL**: Your application URL
- **RDSEndpoint**: Database endpoint
- **S3BucketName**: File storage bucket
- **EC2PublicIP**: SSH access

#### Step 6: Complete Deployment

SSH to EC2 and deploy application:

```bash
ssh -i hackathon-key.pem ec2-user@<EC2PublicIP>

# Clone repository
cd /opt/hackathon-platform
git clone https://github.com/your-org/hackathon-platform.git .

# Install dependencies
cd backend
npm install

# Run migrations
npm run migrate

# Build and start
npm run build
pm2 start dist/server.js --name hackathon-backend
pm2 startup
pm2 save
```

#### Step 7: Access Application

Visit `http://<LoadBalancerURL>/api/health`

---

## Option 2: Manual Setup

### Step 1: Create VPC (Optional)

Skip if using existing VPC.

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --query 'Vpc.VpcId' \
  --output text)

# Enable DNS
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames

# Create subnets
SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --query 'Subnet.SubnetId' \
  --output text)

SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --query 'Subnet.SubnetId' \
  --output text)
```

### Step 2: Create S3 Bucket

```bash
BUCKET_NAME="hackathon-files-$(date +%s)"

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
```

### Step 3: Create RDS PostgreSQL

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name hackathon-db-subnet \
  --db-subnet-group-description "Hackathon DB subnets" \
  --subnet-ids $SUBNET_1 $SUBNET_2

# Create security group for RDS
RDS_SG=$(aws ec2 create-security-group \
  --group-name hackathon-rds-sg \
  --description "Hackathon RDS security group" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier hackathon-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --db-name hackathon_platform \
  --db-subnet-group-name hackathon-db-subnet \
  --vpc-security-group-ids $RDS_SG \
  --backup-retention-period 7 \
  --no-publicly-accessible

# Wait for RDS to be available (10-15 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier hackathon-postgres

# Get endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier hackathon-postgres \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"
```

### Step 4: Create EC2 Instance

```bash
# Create security group for EC2
EC2_SG=$(aws ec2 create-security-group \
  --group-name hackathon-ec2-sg \
  --description "Hackathon EC2 security group" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow HTTP and SSH
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp --port 5000 --cidr 0.0.0.0/0

# Allow EC2 to access RDS
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp --port 5432 --source-group $EC2_SG

# Create IAM role for EC2
# (See CloudFormation template for full policy)

# Launch EC2 instance
EC2_ID=$(aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name hackathon-key \
  --security-group-ids $EC2_SG \
  --subnet-id $SUBNET_1 \
  --iam-instance-profile Name=hackathon-ec2-role \
  --query 'Instances[0].InstanceId' \
  --output text)

# Get public IP
aws ec2 describe-instances \
  --instance-ids $EC2_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

### Step 5: Configure and Deploy

SSH to EC2 and follow the deployment steps from Option 1.

---

## Option 3: AWS Amplify

AWS Amplify provides simplified hosting for fullstack applications.

### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Step 2: Initialize Amplify

```bash
cd hackathon-platform
amplify init

# Follow prompts:
# - Project name: hackathon-platform
# - Environment: production
# - Default editor: Your choice
# - App type: javascript
# - Framework: node
# - Source directory: backend/src
# - Build command: npm run build
# - Start command: npm start
```

### Step 3: Add Backend API

```bash
amplify add api

# Choose:
# - REST
# - API name: hackathonapi
# - Path: /api
# - Lambda function: hackathon-backend
# - Runtime: NodeJS
# - Template: Express REST API
```

### Step 4: Add Storage

```bash
# Add S3
amplify add storage

# Choose:
# - Content (Images, audio, video, etc.)
# - Name: hackathonfiles
# - Access: Auth and guest users

# Add Database (RDS)
amplify add database

# Choose:
# - PostgreSQL
# - Database name: hackathon_platform
```

### Step 5: Deploy

```bash
amplify push

# This will:
# - Create S3 bucket
# - Create RDS instance
# - Deploy Lambda functions
# - Set up API Gateway
```

### Step 6: Connect Git Repository

```bash
# In AWS Amplify Console:
1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your GitHub/GitLab repository
4. Configure build settings
5. Deploy
```

---

## Option 4: Elastic Beanstalk

### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

### Step 2: Initialize EB

```bash
cd backend
eb init

# Follow prompts:
# - Region: us-east-1
# - Application name: hackathon-platform
# - Platform: Node.js 18
# - SSH: Yes (use existing key pair)
```

### Step 3: Create Environment

```bash
eb create hackathon-production \
  --instance-type t3.small \
  --envvars \
    NODE_ENV=production,\
    DB_HOST=your-rds-endpoint,\
    DB_PASSWORD=your-password,\
    AWS_S3_BUCKET=your-bucket,\
    JWT_SECRET=your-secret,\
    OPENAI_API_KEY=your-key
```

### Step 4: Configure RDS

```bash
eb create hackathon-production \
  --database \
  --database.engine postgres \
  --database.instance db.t3.micro
```

### Step 5: Deploy

```bash
eb deploy
```

### Step 6: Open Application

```bash
eb open
```

---

## Post-Deployment

### Run Database Migrations

#### Method 1: SSH to EC2

```bash
ssh -i hackathon-key.pem ec2-user@<EC2-IP>
cd /opt/hackathon-platform/backend
npm run migrate
```

#### Method 2: Direct RDS Connection

```bash
# Install PostgreSQL client locally
psql -h <RDS-ENDPOINT> \
  -U postgres \
  -d hackathon_platform \
  -f database/migrations/001_initial_schema.sql
```

#### Method 3: AWS Systems Manager

```bash
aws ssm start-session --target <INSTANCE-ID>
cd /opt/hackathon-platform/backend
npm run migrate
```

### Configure Domain Name

#### Using Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Create A record for ALB
cat > route53-record.json << EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.yourdomain.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "<ALB-HOSTED-ZONE-ID>",
        "DNSName": "<ALB-DNS-NAME>",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE-ID> \
  --change-batch file://route53-record.json
```

### Enable HTTPS

#### Request Certificate

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

#### Add HTTPS Listener to ALB

```bash
aws elbv2 create-listener \
  --load-balancer-arn <ALB-ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<ACM-CERT-ARN> \
  --default-actions Type=forward,TargetGroupArn=<TG-ARN>
```

---

## Monitoring and Maintenance

### CloudWatch Logs

```bash
# View logs
aws logs tail /aws/ec2/hackathon-backend --follow

# Create log group
aws logs create-log-group \
  --log-group-name /aws/ec2/hackathon-backend
```

### CloudWatch Alarms

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name hackathon-cpu-high \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=InstanceId,Value=<INSTANCE-ID>
```

### RDS Monitoring

```bash
# Check database metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=hackathon-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### S3 Storage Monitoring

```bash
# Check bucket size
aws s3 ls s3://your-bucket --recursive --summarize

# Storage class analysis
aws s3api get-bucket-location --bucket your-bucket
```

---

## Cost Optimization

### Reserved Instances

Save up to 72% by committing to 1 or 3 years:

```bash
# Purchase EC2 Reserved Instance
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id <OFFERING-ID> \
  --instance-count 1

# Purchase RDS Reserved Instance
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id <OFFERING-ID>
```

### Auto Scaling

```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name hackathon-asg \
  --launch-configuration-name hackathon-lc \
  --min-size 1 \
  --max-size 4 \
  --desired-capacity 2 \
  --target-group-arns <TG-ARN> \
  --health-check-type ELB \
  --health-check-grace-period 300
```

### S3 Lifecycle Policies

```bash
cat > lifecycle.json << 'EOF'
{
  "Rules": [{
    "Id": "Move to Glacier after 90 days",
    "Status": "Enabled",
    "Transitions": [{
      "Days": 90,
      "StorageClass": "GLACIER"
    }],
    "NoncurrentVersionExpiration": {
      "NoncurrentDays": 30
    }
  }]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket your-bucket \
  --lifecycle-configuration file://lifecycle.json
```

---

## Troubleshooting

### Cannot Connect to RDS

```bash
# Check security group
aws ec2 describe-security-groups --group-ids <RDS-SG-ID>

# Test connection from EC2
telnet <RDS-ENDPOINT> 5432

# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier hackathon-postgres \
  --query 'DBInstances[0].DBInstanceStatus'
```

### S3 Access Denied

```bash
# Check IAM role policies
aws iam get-role --role-name hackathon-ec2-role
aws iam list-attached-role-policies --role-name hackathon-ec2-role

# Test S3 access from EC2
aws s3 ls s3://your-bucket/
```

### High Costs

```bash
# Check cost explorer
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Set billing alert
aws cloudwatch put-metric-alarm \
  --alarm-name high-billing \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

---

## Cleanup (Delete Resources)

```bash
# Delete CloudFormation stack (deletes everything)
aws cloudformation delete-stack --stack-name hackathon-platform

# Or delete manually:
# 1. Terminate EC2 instances
aws ec2 terminate-instances --instance-ids <INSTANCE-ID>

# 2. Delete RDS (with final snapshot)
aws rds delete-db-instance \
  --db-instance-identifier hackathon-postgres \
  --final-db-snapshot-identifier hackathon-final-snapshot

# 3. Empty and delete S3 bucket
aws s3 rm s3://your-bucket --recursive
aws s3api delete-bucket --bucket your-bucket

# 4. Delete Load Balancer and Target Groups
aws elbv2 delete-load-balancer --load-balancer-arn <ALB-ARN>
aws elbv2 delete-target-group --target-group-arn <TG-ARN>
```

---

## Support

- AWS Documentation: https://docs.aws.amazon.com/
- CloudFormation: See `aws-deployment/cloudformation/README.md`
- Project Issues: GitHub repository

# AWS CloudFormation Deployment

This directory contains CloudFormation templates for deploying the Hackathon Platform on AWS.

## Available Templates

### 1. Complete Infrastructure (`hackathon-infrastructure.yaml`)

Deploys a complete, production-ready infrastructure including:
- VPC with public and private subnets
- Application Load Balancer (ALB)
- EC2 instance for backend
- RDS PostgreSQL database
- S3 bucket for file storage
- All necessary security groups and IAM roles

**Use this if:** You're starting from scratch and want a complete AWS setup.

### 2. Simplified Stack (`hackathon-simple.yaml`)

Deploys only the core resources:
- RDS PostgreSQL database
- S3 bucket for file storage
- IAM policy for S3 access

**Use this if:** You already have VPC, EC2, or other infrastructure and just need RDS + S3.

---

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **EC2 Key Pair** created (for SSH access)
   ```bash
   aws ec2 create-key-pair --key-name hackathon-key --query 'KeyMaterial' --output text > hackathon-key.pem
   chmod 400 hackathon-key.pem
   ```

3. **OpenAI API Key** for AI grading

4. **Strong passwords** for database and JWT secret

---

## Deployment Option 1: Complete Infrastructure

### Step 1: Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://hackathon-infrastructure.yaml
```

### Step 2: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name hackathon-platform \
  --template-body file://hackathon-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=hackathon-platform \
    ParameterKey=KeyPairName,ParameterValue=hackathon-key \
    ParameterKey=InstanceType,ParameterValue=t3.small \
    ParameterKey=DBUsername,ParameterValue=postgres \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=JWTSecret,ParameterValue=your-jwt-secret-min-16-chars \
    ParameterKey=OpenAIAPIKey,ParameterValue=sk-your-openai-api-key \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Monitor Deployment

```bash
# Watch stack creation progress
aws cloudformation describe-stack-events \
  --stack-name hackathon-platform \
  --query 'StackEvents[0:10].[ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table

# Wait for completion (takes 10-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name hackathon-platform
```

### Step 4: Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name hackathon-platform \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Step 5: Access Your Application

The outputs will include:
- **LoadBalancerURL**: Your application URL (http://alb-dns-name)
- **EC2PublicIP**: SSH access to backend server
- **RDSEndpoint**: Database connection endpoint
- **S3BucketName**: File storage bucket

### Step 6: SSH to EC2 and Complete Setup

```bash
# SSH to EC2 instance
ssh -i hackathon-key.pem ec2-user@<EC2PublicIP>

# Navigate to app directory
cd /opt/hackathon-platform

# Clone your repository
git clone https://github.com/your-org/hackathon-platform.git .

# Install dependencies
cd backend
npm install

# Run database migrations
npm run migrate

# Build and start
npm run build
pm2 start dist/server.js --name hackathon-backend
pm2 startup
pm2 save
```

---

## Deployment Option 2: Simplified Stack

### Step 1: Deploy Stack

You need to provide your existing VPC and subnet IDs:

```bash
aws cloudformation create-stack \
  --stack-name hackathon-simple \
  --template-body file://hackathon-simple.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=hackathon \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxx \
    ParameterKey=PrivateSubnet1,ParameterValue=subnet-xxxxxxxx \
    ParameterKey=PrivateSubnet2,ParameterValue=subnet-yyyyyyyy \
    ParameterKey=DBUsername,ParameterValue=postgres \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=AllowedSecurityGroup,ParameterValue=sg-xxxxxxxx \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 2: Get Outputs and Configure

```bash
aws cloudformation describe-stacks \
  --stack-name hackathon-simple \
  --query 'Stacks[0].Outputs[?OutputKey==`ConnectionString`].OutputValue' \
  --output text
```

Copy the output to your `.env` file.

### Step 3: Attach IAM Policy to Your Role

```bash
# Get the policy ARN from stack outputs
POLICY_ARN=$(aws cloudformation describe-stacks \
  --stack-name hackathon-simple \
  --query 'Stacks[0].Outputs[?OutputKey==`S3AccessPolicyArn`].OutputValue' \
  --output text)

# Attach to your EC2/ECS IAM role
aws iam attach-role-policy \
  --role-name YourEC2Role \
  --policy-arn $POLICY_ARN
```

---

## Post-Deployment Steps

### 1. Run Database Migrations

Connect to your EC2 instance and run:

```bash
cd /opt/hackathon-platform/backend
npm run migrate
```

Or connect directly to RDS:

```bash
psql -h <RDSEndpoint> -U postgres -d hackathon_platform < database/migrations/001_initial_schema.sql
```

### 2. Verify S3 Access

```bash
# List buckets (should see your new bucket)
aws s3 ls

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://<BucketName>/test/test.txt
```

### 3. Configure DNS (Optional)

```bash
# Create Route53 hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://route53-record.json
```

### 4. Add HTTPS (Optional)

```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn <ALB-ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<ACM-Certificate-ARN> \
  --default-actions Type=forward,TargetGroupArn=<TargetGroup-ARN>
```

---

## Update Stack

To update an existing stack:

```bash
aws cloudformation update-stack \
  --stack-name hackathon-platform \
  --template-body file://hackathon-infrastructure.yaml \
  --parameters \
    ParameterKey=InstanceType,ParameterValue=t3.medium \
    ParameterKey=DBPassword,UsePreviousValue=true \
    ParameterKey=JWTSecret,UsePreviousValue=true \
    ParameterKey=OpenAIAPIKey,UsePreviousValue=true \
    ParameterKey=KeyPairName,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM
```

---

## Delete Stack

**Warning:** This will delete all resources including RDS (database).

```bash
# Disable termination protection (if enabled)
aws cloudformation update-termination-protection \
  --stack-name hackathon-platform \
  --no-enable-termination-protection

# Delete stack
aws cloudformation delete-stack --stack-name hackathon-platform

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name hackathon-platform
```

To keep RDS snapshot:

```bash
# Create snapshot before deleting
aws rds create-db-snapshot \
  --db-instance-identifier hackathon-platform-postgres \
  --db-snapshot-identifier hackathon-final-snapshot

# Then delete stack
```

---

## Estimated Costs

**Monthly cost estimate for t3.small instance:**

| Resource | Approximate Cost |
|----------|------------------|
| EC2 t3.small (1 instance) | $15/month |
| RDS t3.micro | $15/month |
| Application Load Balancer | $20/month |
| S3 Storage (10 GB) | $0.25/month |
| Data Transfer (10 GB out) | $1/month |
| **Total** | **~$51/month** |

**Note:** Add OpenAI API costs based on usage (see MINIO_AI_GRADING_GUIDE.md)

---

## Troubleshooting

### Stack Creation Failed

```bash
# View failed events
aws cloudformation describe-stack-events \
  --stack-name hackathon-platform \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# View full error
aws cloudformation describe-stack-resources \
  --stack-name hackathon-platform \
  --logical-resource-id <ResourceId>
```

### Cannot Connect to RDS

1. Check security group allows your EC2 security group
2. Verify EC2 and RDS are in same VPC
3. Test connection from EC2:
   ```bash
   telnet <RDS-Endpoint> 5432
   ```

### S3 Access Denied

1. Verify IAM role is attached to EC2
2. Check IAM policy allows S3 actions
3. Test with AWS CLI:
   ```bash
   aws s3 ls s3://<BucketName>/
   ```

---

## Security Best Practices

1. **Rotate Credentials**: Change default passwords immediately
2. **Restrict SSH**: Update security group to allow SSH only from your IP
3. **Enable MFA**: Enable MFA for AWS account
4. **Use Secrets Manager**: Store sensitive values in AWS Secrets Manager
5. **Enable CloudTrail**: Enable audit logging
6. **Restrict S3 CORS**: Update CORS configuration to allow only your domain

---

## Support

For issues or questions:
- Check CloudFormation events for detailed errors
- Review application logs on EC2: `pm2 logs hackathon-backend`
- See main project README for application-level issues

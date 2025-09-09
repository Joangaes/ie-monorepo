# AWS Elastic Beanstalk Deployment Guide

This guide covers deploying the IE Manager application to AWS Elastic Beanstalk using multi-container Docker with nginx reverse proxy.

## Architecture Overview

- **nginx**: Single public entrypoint on port 80, reverse proxy
- **backend**: Django API on port 8000 (internal)
- **frontend**: Next.js SSR on port 3000 (internal)
- **Database**: External RDS PostgreSQL
- **Logs**: CloudWatch Logs via awslogs driver

## Prerequisites

### 1. AWS Services Setup

#### RDS Database
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier iemanager-prod-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username dbadmin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name default
```

#### ACM Certificate (for HTTPS)
```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS
```

### 2. IAM Roles & Permissions

#### Instance Role Permissions
Your EB instance role needs these additional policies for CloudWatch Logs:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

#### Security Groups
- **Load Balancer SG**: Allow HTTP (80) and HTTPS (443) from 0.0.0.0/0
- **Instance SG**: Allow HTTP (80) from Load Balancer SG
- **RDS SG**: Allow PostgreSQL (5432) from Instance SG

### 3. Local Tools
```bash
# Install EB CLI
pip install awsebcli

# Verify installation
eb --version
```

## Deployment Methods

### Method 1: Direct Docker Build (Recommended for Development)

EB builds containers from source Dockerfiles in your deployment package.

#### One-Time Setup
```bash
# Initialize EB application
eb init

# Select:
# - Region: us-east-1 (or your preferred region)
# - Application name: ie-manager
# - Platform: Multi-container Docker
# - CodeCommit: No (unless you want it)

# Create environment
eb create production \
  --instance-type t3.medium \
  --platform "Multi-container Docker" \
  --envvars \
    SECRET_KEY=your-secret-key,\
    DATABASE_URL=postgresql://user:pass@host:5432/db,\
    ALLOWED_HOSTS=your-domain.com,\
    CORS_ALLOWED_ORIGINS=https://your-domain.com,\
    NEXT_PUBLIC_API_BASE=https://your-domain.com

# Enable HTTPS with ACM certificate
eb config
# Add under aws:elbv2:listener:443:
#   ListenerEnabled: true
#   Protocol: HTTPS
#   SSLCertificateArns: arn:aws:acm:region:account:certificate/cert-id
```

#### Set Environment Variables
```bash
# Core settings
eb setenv \
  SECRET_KEY="your-very-secure-secret-key" \
  DATABASE_URL="postgresql://dbadmin:password@your-rds-endpoint:5432/iemanager" \
  ALLOWED_HOSTS="yourdomain.com,your-eb-env.region.elasticbeanstalk.com" \
  CSRF_TRUSTED_ORIGINS="https://yourdomain.com,https://your-eb-env.region.elasticbeanstalk.com" \
  CORS_ALLOWED_ORIGINS="https://yourdomain.com" \
  NEXT_PUBLIC_API_BASE="https://yourdomain.com" \
  DJANGO_COLLECTSTATIC="1"

# Optional: Create superuser on first deploy
eb setenv \
  DJANGO_SUPERUSER_EMAIL="admin@yourdomain.com" \
  DJANGO_SUPERUSER_PASSWORD="secure-admin-password"
```

#### Deploy
```bash
# Deploy application
eb deploy

# Check status
eb status
eb health

# View logs
eb logs
```

### Method 2: Pre-built ECR Images (Recommended for Production CI/CD)

Build and push images to ECR, then reference them in docker-compose.yml.

#### Setup ECR Repositories
```bash
# Create ECR repositories
aws ecr create-repository --repository-name iemanager/frontend
aws ecr create-repository --repository-name iemanager/backend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### Build and Push Images
```bash
# Set variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
export IMAGE_TAG=latest

# Build and push backend
cd ie_professors_database
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/iemanager/backend:$IMAGE_TAG .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/iemanager/backend:$IMAGE_TAG

# Build and push frontend
cd ../ie-professors-frontend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/iemanager/frontend:$IMAGE_TAG .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/iemanager/frontend:$IMAGE_TAG

cd ..
```

#### Update docker-compose.yml
Uncomment and update the ECR image references in `docker-compose.yml`:
```yaml
# backend:
#   image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/iemanager/backend:${IMAGE_TAG:-latest}
# frontend:
#   image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/iemanager/frontend:${IMAGE_TAG:-latest}
```

Set ECR environment variables:
```bash
eb setenv \
  AWS_ACCOUNT_ID="123456789012" \
  ECR_BACKEND_REPO="iemanager/backend" \
  ECR_FRONTEND_REPO="iemanager/frontend" \
  IMAGE_TAG="latest"
```

## Environment Management

### Production Environment Variables
Update `.ebextensions/01-env.config` with your actual values, then:

```bash
# Apply all environment variables from config
eb config put production
```

### Environment-Specific Configs
```bash
# Staging environment
eb create staging --cfg production
eb setenv DEBUG="true" --environment staging

# Production environment  
eb create production --cfg production
```

## Database Migrations

Migrations run automatically via the entrypoint script on each deployment. For manual migration:

```bash
# SSH into instance
eb ssh

# Run migrations manually
docker exec $(docker ps -q -f name=backend) poetry run python manage.py migrate

# Create superuser
docker exec -it $(docker ps -q -f name=backend) poetry run python manage.py createsuperuser
```

## Monitoring & Logs

### CloudWatch Logs
Logs are automatically sent to CloudWatch with these log groups:
- `/aws/elasticbeanstalk/environment-name/nginx`
- `/aws/elasticbeanstalk/environment-name/backend` 
- `/aws/elasticbeanstalk/environment-name/frontend`

### Health Monitoring
- Load balancer health check: `GET /healthz`
- Container health checks run every 30s
- Auto-scaling based on CPU/memory usage

### View Logs
```bash
# EB logs (last 100 lines)
eb logs

# Tail logs in real-time
eb logs --all

# CloudWatch logs
aws logs tail /aws/elasticbeanstalk/your-env-name/backend --follow
```

## Scaling & Performance

### Auto Scaling Configuration
```bash
# Update auto scaling settings
eb config
# Modify:
# aws:autoscaling:asg:
#   MinSize: 2
#   MaxSize: 10
# aws:autoscaling:trigger:
#   MeasureName: CPUUtilization
#   UpperThreshold: 70
#   LowerThreshold: 20
```

### Instance Types
- **Development**: t3.small (2 vCPU, 2GB RAM)
- **Production**: t3.medium+ (2+ vCPU, 4+ GB RAM)
- **High Traffic**: c5.large+ (optimized for compute)

## Rolling Deployments

EB performs rolling deployments by default:
1. Builds new containers on existing instances
2. Health checks pass before switching traffic
3. Migrations run during deployment
4. Zero-downtime deployment (with multiple instances)

### Deployment Policies
```bash
# Configure deployment policy
eb config
# Add:
# aws:elasticbeanstalk:command:
#   DeploymentPolicy: RollingWithAdditionalBatch
#   BatchSizeType: Percentage
#   BatchSize: 30
```

## Troubleshooting

### Common Issues

#### 1. Health Check Failures
```bash
# Check container logs
eb logs

# Verify health endpoint
curl -f https://your-domain.com/healthz
```

#### 2. Database Connection Issues
```bash
# Verify RDS connectivity
eb ssh
docker exec -it $(docker ps -q -f name=backend) nc -zv your-rds-endpoint 5432
```

#### 3. Static Files Not Loading
```bash
# Ensure collectstatic runs
eb setenv DJANGO_COLLECTSTATIC="1"
eb deploy
```

#### 4. CORS/CSRF Errors
```bash
# Update allowed origins
eb setenv \
  ALLOWED_HOSTS="yourdomain.com,your-eb-env.region.elasticbeanstalk.com" \
  CORS_ALLOWED_ORIGINS="https://yourdomain.com" \
  CSRF_TRUSTED_ORIGINS="https://yourdomain.com"
```

### Debug Commands
```bash
# SSH into instance
eb ssh

# View running containers
docker ps

# Check container logs
docker logs $(docker ps -q -f name=backend)
docker logs $(docker ps -q -f name=frontend)
docker logs $(docker ps -q -f name=nginx)

# Execute commands in containers
docker exec -it $(docker ps -q -f name=backend) bash
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **SSL/TLS**: Always use HTTPS in production with ACM certificates
3. **Security Groups**: Restrict access to minimum required ports
4. **Database**: Use RDS with encrypted storage and backups
5. **Updates**: Regularly update base images and dependencies

## Cost Optimization

1. **Instance Sizing**: Start small and scale based on metrics
2. **Auto Scaling**: Configure appropriate thresholds
3. **Reserved Instances**: Use RIs for predictable workloads
4. **Monitoring**: Set up CloudWatch alarms for cost anomalies

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions or CodePipeline
2. Configure monitoring with CloudWatch dashboards
3. Set up backup strategy for RDS and application data
4. Implement log aggregation and alerting
5. Configure custom domain with Route 53

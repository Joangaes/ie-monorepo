# CI/CD Pipeline Guide for IE Manager

This guide explains how to set up automated CI/CD pipelines for deploying to AWS Elastic Beanstalk.

## Overview

Our Docker-based setup supports **two deployment strategies**:

1. **Direct Build**: EB builds Docker images from source code (simpler setup)
2. **ECR Pre-build**: Build images in CI, push to ECR, deploy references (production recommended)

## Pipeline Features

### ✅ What Our Pipelines Include

- **Automated Testing**: Backend (Django) and Frontend (Next.js) tests
- **Multi-stage Builds**: Optimized Docker images with security best practices  
- **Environment Management**: Separate staging/production deployments
- **Zero-downtime Deployments**: Rolling updates via EB
- **Rollback Support**: Easy rollback to previous versions
- **Security Scanning**: Optional container vulnerability scanning
- **Notifications**: Slack/email notifications on deployment status

## Platform Support

| Platform | Configuration File | Status |
|----------|-------------------|---------|
| GitHub Actions | `.github/workflows/deploy.yml` | ✅ Ready |
| GitHub Actions (Simple) | `.github/workflows/deploy-simple.yml` | ✅ Ready |
| GitLab CI/CD | `.gitlab-ci.yml` | ✅ Ready |
| Azure DevOps | `azure-pipelines.yml` | 📋 Available on request |
| Jenkins | `Jenkinsfile` | 📋 Available on request |
| CircleCI | `.circleci/config.yml` | 📋 Available on request |

## Setup Instructions

### 1. Choose Your Strategy

#### Strategy A: Direct Build (Simpler)
- EB builds from Dockerfiles in your repo
- Faster setup, good for small teams
- Uses current docker-compose.yml as-is

#### Strategy B: ECR Pre-build (Production)
- Build in CI, push to ECR, deploy image references  
- Better for large teams, faster deployments
- Requires ECR setup and image registry management

### 2. GitHub Actions Setup

#### Required Secrets
```bash
# In GitHub: Settings → Secrets and variables → Actions
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_ACCOUNT_ID=123456789012
```

#### Optional Secrets
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

#### Enable the Pipeline
```bash
# For direct build (simpler)
mv .github/workflows/deploy-simple.yml .github/workflows/deploy.yml

# For ECR pre-build (production)
# Use .github/workflows/deploy.yml as-is
```

### 3. GitLab CI/CD Setup

#### Required Variables
```bash
# In GitLab: Settings → CI/CD → Variables
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  
AWS_ACCOUNT_ID=123456789012
```

#### Enable Pipeline
The `.gitlab-ci.yml` file is ready to use. Push to main branch to trigger.

### 4. Environment-Specific Deployments

#### Multiple Environments
```yaml
# Example: staging and production
deploy-staging:
  script:
    - eb deploy staging
  only:
    - develop

deploy-production:
  script:
    - eb deploy production
  only:
    - main
  when: manual  # Require manual approval
```

#### Environment Variables
```bash
# Set different env vars per environment
eb setenv DEBUG="true" --environment staging
eb setenv DEBUG="false" --environment production

eb setenv ALLOWED_HOSTS="staging.yourdomain.com" --environment staging
eb setenv ALLOWED_HOSTS="yourdomain.com" --environment production
```

## Pipeline Stages Explained

### 1. Test Stage
```yaml
# Runs on every PR and main branch push
- Backend tests: Django unit tests, linting
- Frontend tests: Next.js build validation, type checking
- Security scanning: Dependency vulnerability checks
```

### 2. Build Stage (ECR method only)
```yaml
# Only on main branch
- Build backend Docker image
- Build frontend Docker image  
- Push to ECR with commit SHA tag
- Push to ECR with 'latest' tag
```

### 3. Deploy Stage
```yaml
# Only on main branch (manual approval for production)
- Update docker-compose.yml with new image tags
- Deploy to Elastic Beanstalk
- Run health checks
- Send notifications
```

## Advanced Configuration

### Database Migrations
Migrations run automatically via our entrypoint script:
```bash
# In ie_professors_database/infra/entrypoint.sh
poetry run python manage.py migrate --noinput
```

### Blue/Green Deployments
```yaml
# Configure in .ebextensions/01-env.config
aws:elasticbeanstalk:command:
  DeploymentPolicy: Immutable  # Blue/green deployment
  HealthCheckSuccessThreshold: Ok
  HealthCheckInterval: 15
```

### Rollback Strategy
```bash
# Automatic rollback on health check failure
eb deploy production --timeout 20

# Manual rollback to previous version
eb deploy production --version-label previous-version-label
```

### Performance Monitoring
```yaml
# Add performance monitoring to pipeline
- name: Run performance tests
  run: |
    # Load testing with artillery or similar
    npx artillery run load-test.yml
```

## Security Best Practices

### 1. Secrets Management
- ✅ Never commit secrets to git
- ✅ Use platform secret management (GitHub Secrets, GitLab Variables)
- ✅ Rotate AWS keys regularly
- ✅ Use least-privilege IAM policies

### 2. Image Security
```yaml
# Add to pipeline
- name: Scan Docker images
  uses: anchore/scan-action@v3
  with:
    image: ${{ env.ECR_REGISTRY }}/${{ env.BACKEND_REPO }}:${{ github.sha }}
```

### 3. Environment Isolation
- ✅ Separate AWS accounts for staging/production
- ✅ Different ECR repositories per environment
- ✅ Environment-specific security groups and VPCs

## Monitoring and Alerts

### CloudWatch Integration
```yaml
# Our docker-compose.yml already includes:
logging:
  driver: awslogs
  options:
    awslogs-group: "${EB_ENV_NAME:-env}-backend"
```

### Slack Notifications
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Health Check Monitoring
```bash
# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "EB-HealthCheck-Failed" \
  --alarm-description "EB health check failures" \
  --metric-name ApplicationRequestsTotal \
  --namespace AWS/ElasticBeanstalk \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold
```

## Troubleshooting

### Common Pipeline Issues

#### 1. Build Failures
```bash
# Check build logs
eb logs

# Local testing
docker-compose up --build
```

#### 2. ECR Push Failures
```bash
# Verify ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Check repository exists
aws ecr describe-repositories --repository-names iemanager/backend
```

#### 3. Deployment Timeouts
```bash
# Increase timeout
eb deploy production --timeout 30

# Check instance health
eb health
eb ssh
```

### Pipeline Debugging
```yaml
# Add debug steps to pipeline
- name: Debug environment
  run: |
    echo "Current directory: $(pwd)"
    echo "Files: $(ls -la)"
    echo "Docker images: $(docker images)"
    echo "AWS CLI version: $(aws --version)"
```

## Cost Optimization

### 1. Build Optimization
- ✅ Use Docker layer caching
- ✅ Optimize .dockerignore files
- ✅ Use multi-stage builds (already implemented)

### 2. ECR Cost Management
```bash
# Set lifecycle policies to clean old images
aws ecr put-lifecycle-policy \
  --repository-name iemanager/backend \
  --lifecycle-policy-text file://ecr-lifecycle-policy.json
```

### 3. EB Instance Management
```yaml
# Auto-scaling based on schedule
aws:autoscaling:scheduledaction:
  StartTime: "2023-01-01T06:00:00Z"
  EndTime: "2023-01-01T18:00:00Z"
  MinSize: 2
  MaxSize: 4
```

## Next Steps

1. **Choose your deployment strategy** (Direct vs ECR)
2. **Set up secrets** in your CI/CD platform
3. **Configure environments** (staging/production)
4. **Test the pipeline** with a small change
5. **Set up monitoring** and alerts
6. **Document your team's workflow**

## Support

For issues with the CI/CD pipeline:
1. Check the troubleshooting section above
2. Review AWS EB logs: `eb logs`
3. Check CI/CD platform logs (GitHub Actions, GitLab CI)
4. Verify environment variables and secrets

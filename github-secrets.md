# GitHub Secrets Configuration

This file lists all the GitHub secrets required for automated deployment to AWS Elastic Beanstalk.

## Required GitHub Secrets

Add these secrets to your GitHub repository under Settings > Secrets and variables > Actions:

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_ACCOUNT_ID`: Your AWS account ID (12-digit number, e.g., 123456789012)

### Django Configuration
- `DJANGO_ALLOWED_HOSTS`: Comma-separated list of allowed hosts (e.g., `your-env.elasticbeanstalk.com,yourdomain.com,localhost,127.0.0.1`)
- `DJANGO_SECRET_KEY`: Django secret key for production (generate a secure random string)

### Database Configuration
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host (RDS endpoint, e.g., `your-database.rds.amazonaws.com`)
- `DB_PORT`: Database port (usually `5432` for PostgreSQL, `3306` for MySQL)

## Example Values

```
AWS_ACCOUNT_ID=123456789012
DJANGO_ALLOWED_HOSTS=my-app.elasticbeanstalk.com,myapp.com,localhost,127.0.0.1
DJANGO_SECRET_KEY=your-super-secret-django-key-here
DB_NAME=ieuniversity_prod
DB_USER=dbadmin
DB_PASSWORD=your-secure-db-password
DB_HOST=ieuniversity.cluster-xyz.eu-north-1.rds.amazonaws.com
DB_PORT=5432
```

## Setting Up Secrets

1. Go to your GitHub repository
2. Click on Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with the exact name listed above
5. Save each secret

## Deployment Process

The GitHub Actions workflow will:
1. Build and push Docker images to ECR
2. Substitute environment variables in docker-compose.yml
3. Deploy to Elastic Beanstalk
4. Configure environment variables via AWS CLI
5. Set up health check endpoint

No manual EB console configuration is required!

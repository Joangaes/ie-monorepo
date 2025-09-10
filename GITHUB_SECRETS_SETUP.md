# GitHub Secrets Setup for Elastic Beanstalk Deployment

This document explains how to configure GitHub Secrets for your Elastic Beanstalk deployment.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### Database Configuration (Required)
- `DB_HOST` - Your RDS PostgreSQL endpoint (e.g., `mydb.xxxxx.eu-north-1.rds.amazonaws.com`)
- `DB_NAME` - Database name (e.g., `ie_professors_db`)
- `DB_USER` - Database username (e.g., `postgres`)
- `DB_PASSWORD` - Database password
- `DB_PORT` - Database port (usually `5432`)

### Django Configuration (Currently Hardcoded)
The following are currently hardcoded in `.ebextensions/03_django_env.config` and don't need to be set as secrets:
- ✅ `DJANGO_SETTINGS_MODULE` - Set to: `ie_professor_management.settings`
- ✅ `SECRET_KEY` - Temporary development key (change later for production)
- ✅ `ALLOWED_HOSTS` - Set to `*` (change later for production)
- ✅ `DEBUG` - Set to `false`

### AWS Configuration (Already Required)
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value as specified above

## Example Values

```bash
# Database (Replace with your actual RDS values)
DB_HOST=mypostgres.c123456.eu-north-1.rds.amazonaws.com
DB_NAME=ie_professors_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_PORT=5432

# Django (Currently hardcoded - no secrets needed)
# DJANGO_SETTINGS_MODULE=ie_professor_management.settings  # ✅ Hardcoded
# SECRET_KEY=django-insecure-temp-key...                   # ⚠️  Temporary key
# ALLOWED_HOSTS=*                                          # ⚠️  Change later
# DEBUG=false                                              # ✅ Hardcoded
```

## Security Notes

- ✅ **DO NOT** commit secrets to your repository
- ✅ **DO** use GitHub Secrets for all sensitive configuration
- ✅ **DO** generate a strong, unique SECRET_KEY for Django
- ✅ **DO** use specific hostnames in ALLOWED_HOSTS for production
- ✅ **DO** set DEBUG=false for production

## How It Works

1. When you push to the `main` branch, GitHub Actions runs
2. The workflow uses `eb setenv` to set environment variables from GitHub Secrets
3. These environment variables are then available to your Django application in the container
4. Your Django settings file reads these environment variables using `os.getenv()`

## Testing Database Fallback

If you want to test the deployment without a database first:
- Leave `DB_HOST` empty or don't set it as a secret
- The application will fall back to SQLite for initial testing
- Once confirmed working, add your RDS database secrets

## Troubleshooting

If deployment fails:
1. Check that all required secrets are set in GitHub
2. Verify the secret names match exactly (case-sensitive)
3. Check the GitHub Actions logs for any `eb setenv` errors
4. Use `eb logs` to check the application logs in Elastic Beanstalk

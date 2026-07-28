# Deployment Guide

## Environment Strategy

Use separate environments for development, staging, and production.

- Development: local machine or sandbox
- Staging: pre-production mirror of production
- Production: customer-facing environment

## Frontend Deployment

### Option 1: Firebase Hosting

Recommended for fast static hosting and CDN support.

```bash
firebase login
firebase init hosting
firebase deploy
```

### Option 2: Cloudflare Pages

Good option for edge delivery and simple static build pipelines.

## Backend Deployment

### Option 1: Google Cloud Run

Suitable for containerized NestJS deployments with autoscaling.

Recommended steps:

1. Containerize the NestJS application.
2. Build and push the image to Google Container Registry or Artifact Registry.
3. Deploy to Cloud Run.
4. Configure environment variables and secrets.

### Option 2: Railway

Simpler deployment flow for smaller teams.

## Database Deployment

### Option 1: Supabase PostgreSQL

Best for managed PostgreSQL with easy dashboard administration.

### Option 2: Neon PostgreSQL

Great for serverless and branch-based development workflows.

## CI/CD Pipeline

A recommended pipeline is:

```text
GitHub -> GitHub Actions -> Build -> Test -> Deploy to Cloud Run / Railway -> Deploy frontend to Firebase or Cloudflare Pages
```

## Required Environment Variables

Ensure all production secrets are stored securely in CI/CD secrets or cloud secret management.

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RAZORPAY_KEY=
RAZORPAY_SECRET=
SMTP_USER=
SMTP_PASS=
FIREBASE_CONFIG=
CLOUDINARY_URL=
```

## Security Checklist

- Enable HTTPS only
- Use strong JWT secrets
- Restrict database access by IP or service account
- Rotate OAuth and payment credentials regularly
- Store secrets in a secure manager, not in source control

## Monitoring and Logging

- Centralize logs for backend services
- Track failed payments and booking errors
- Monitor API latency and error rates
- Configure alerts for deployment failures

## Containerization and Operational Readiness

A production-ready deployment should include:

- Dockerfiles for frontend and backend services
- Health check endpoints such as `/health`
- Environment-specific configs for development, staging, and production
- Database migration automation in CI/CD pipelines
- Backup and restore procedures for PostgreSQL

## Recommended Production Checklist

- Verify HTTPS is enforced
- Ensure API secrets are stored in managed secret storage
- Configure rate limiting and request throttling
- Set up automated backups for the database
- Enable observability with logs, metrics, and alerts
- Test rollback and incident recovery procedures

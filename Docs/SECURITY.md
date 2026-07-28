# Security Documentation

## Security Principles

The platform should follow secure-by-default development practices, including:

- Authentication with JWT access and refresh tokens
- Role-based access control for admins, customers, and helpers
- Input validation and DTO-based request enforcement
- Secure password hashing using bcrypt or Argon2
- HTTPS enforcement in production
- Secret management through environment variables or a cloud secret store

## Authentication and Authorization

- Require authentication for protected routes
- Use guards and role-based permissions for admin and helper operations
- Rotate refresh tokens and invalidate them on logout
- Prevent access token reuse after logout or compromise

## Data Protection

- Encrypt sensitive fields where appropriate
- Avoid storing plain-text passwords or payment details
- Restrict database access and use least-privilege credentials
- Apply audit logging for important actions

## Third-Party Security

- Validate OAuth tokens from Google before trusting identity claims
- Store provider credentials securely and never commit them to source control
- Review payment integration webhooks and verify signatures

## Recommended Security Checklist

- Enable rate limiting
- Enable CSRF protection where applicable
- Validate uploaded document types and sizes
- Configure content security policies on the frontend
- Monitor suspicious authentication events

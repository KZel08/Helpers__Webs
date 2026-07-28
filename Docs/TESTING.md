# Testing Strategy

## Testing Objectives

The platform should be tested at three levels:

- Unit tests for business logic and helpers
- Integration tests for database and API behavior
- End-to-end tests for critical user flows

## Recommended Test Types

### Unit Tests

Use unit tests for:

- Auth service logic
- Booking validation logic
- Payment status handling
- Notification formatting
- Role and permission checks

### Integration Tests

Use integration tests for:

- API endpoint behavior
- Prisma database interactions
- Authentication flow with protected routes
- Payment callback handling

### End-to-End Tests

Cover major workflows such as:

- Register -> login -> browse services -> create booking
- Helper onboarding and document upload
- Payment success and failure flows
- Admin moderation operations

## Suggested Tooling

- Jest for backend unit and integration tests
- Supertest for API testing
- Playwright for frontend end-to-end testing
- Prisma test database or isolated staging environment

## Testing Checklist

- All critical flows should have automated coverage
- Tests should run in CI/CD before deployment
- Failed payments and auth edge cases should be explicitly tested
- Broken access control should be detected by integration tests

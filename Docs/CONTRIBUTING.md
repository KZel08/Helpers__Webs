# Contributing Guide

## Coding Standards

- Use TypeScript for all application code.
- Follow consistent naming conventions.
- Keep functions small and focused.
- Prefer clear, descriptive variable and function names.
- Add comments only where necessary for complex logic.
- Use DTOs and validation pipes for request payloads.

## Branch Naming

Use descriptive branch names:

```text
feature/auth-module
feature/helper-profile
fix/payment-verification
chore/update-docs
```

## Commit Guidelines

Use concise commit messages that explain the intent.

Examples:

```text
feat: add user registration flow
fix: resolve payment verification bug
docs: add API and deployment documentation
```

## Pull Request Process

1. Create a feature branch from the latest main branch.
2. Make your changes and add related tests where possible.
3. Update documentation if behavior changes.
4. Open a pull request with a clear title and summary.
5. Wait for review and address feedback.

## Review Checklist

- Code is readable and maintainable
- APIs follow agreed conventions
- Security concerns are addressed
- Documentation is updated
- Tests or validation steps are included

## Local Development Expectations

- Keep your environment variables in a local `.env` file.
- Do not commit secrets or private credentials.
- Run linting and tests before submitting changes.

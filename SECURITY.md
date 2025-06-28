# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Features

### Authentication & Authorization
- **Session-based authentication** with secure session management
- **bcrypt password hashing** with 12 rounds for strong protection
- **UUID primary keys** to prevent user ID enumeration
- **Role-based access control** with admin permissions
- **Password requirements** (minimum 8 characters with special character)

### Input Validation & Sanitization
- **Zod schema validation** for all API inputs
- **SQL injection prevention** through parameterized queries (Drizzle ORM)
- **XSS prevention** through input sanitization
- **CSRF protection** via session-based authentication

### Infrastructure Security
- **Non-root container user** in Docker images
- **Security contexts** in Kubernetes deployments
- **Environment variable management** for sensitive configuration
- **Health checks** without exposing sensitive information

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow responsible disclosure:

### 🚨 DO NOT Create Public Issues

**Please do not report security vulnerabilities through public GitHub issues.**

### ✅ How to Report

1. **Email us directly** at: `security@example.com`
2. **Include the following information:**
   - Type of issue (e.g., SQL injection, XSS, authentication bypass)
   - Full paths of source file(s) related to the issue
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Any special configuration required to reproduce the issue
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### 📋 What to Expect

- **Initial Response:** We will acknowledge receipt within 48 hours
- **Assessment:** We will assess the vulnerability within 7 days
- **Updates:** We will keep you informed of our progress
- **Resolution:** We aim to resolve critical issues within 30 days
- **Credit:** With your permission, we will credit you in our security advisories

### 🏆 Responsible Disclosure Guidelines

- **Allow reasonable time** for us to investigate and mitigate the issue
- **Do not exploit** the vulnerability beyond what is necessary to demonstrate it
- **Do not access, modify, or delete** data belonging to others
- **Do not perform actions** that could harm the availability of our services
- **Do not reveal the vulnerability** to others until we have addressed it

## Security Best Practices for Contributors

### Code Security
- **Never commit secrets** or credentials to the repository
- **Use environment variables** for all configuration
- **Validate all inputs** using Zod schemas
- **Use parameterized queries** to prevent SQL injection
- **Sanitize user content** before rendering
- **Implement proper error handling** without exposing system details

### Authentication
```typescript
// ✅ Good: Proper password validation
const password = registerSchema.parse(req.body).password;
const hashedPassword = await hashPassword(password);

// ❌ Bad: Storing plain text passwords
const password = req.body.password; // Never store plain text!
```

### Database Queries
```typescript
// ✅ Good: Parameterized query with Drizzle ORM
const user = await db.select()
  .from(users)
  .where(eq(users.email, email));

// ❌ Bad: String concatenation (SQL injection risk)
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### Error Handling
```typescript
// ✅ Good: Generic error message
catch (error) {
  console.error('Database error:', error); // Log details server-side
  res.status(500).json({ 
    error: "Internal server error",
    code: "INTERNAL_ERROR" 
  });
}

// ❌ Bad: Exposing system details
catch (error) {
  res.status(500).json({ error: error.message }); // Don't expose details!
}
```

## Security Checklist for Pull Requests

### Authentication & Authorization
- [ ] All protected routes use `isAuthenticated` middleware
- [ ] Admin routes use proper permission checks
- [ ] Passwords are hashed using bcrypt
- [ ] Session management is implemented correctly
- [ ] No authentication bypass vulnerabilities

### Input Validation
- [ ] All inputs are validated using Zod schemas
- [ ] File uploads (if any) are properly validated
- [ ] SQL queries use parameterized statements
- [ ] No reflected user input without sanitization
- [ ] Proper content type validation

### Error Handling
- [ ] Errors don't expose system information
- [ ] Consistent error response format
- [ ] Appropriate HTTP status codes
- [ ] Error logging without sensitive data
- [ ] No stack traces in production responses

### Infrastructure
- [ ] Environment variables used for secrets
- [ ] No hardcoded credentials or API keys
- [ ] Proper Docker security practices
- [ ] Kubernetes security contexts configured
- [ ] Health endpoints don't expose sensitive data

## Common Vulnerabilities to Avoid

### 1. SQL Injection
```typescript
// ❌ Vulnerable
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Safe
const user = await db.select()
  .from(users)
  .where(eq(users.id, userId));
```

### 2. Cross-Site Scripting (XSS)
```typescript
// ❌ Vulnerable
const message = `<div>${userInput}</div>`;

// ✅ Safe
const message = sanitizeHtml(userInput);
```

### 3. Authentication Bypass
```typescript
// ❌ Vulnerable
if (req.headers.authorization) {
  // Assume user is authenticated
}

// ✅ Safe
const user = await validateSession(req.session.id);
if (!user) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

### 4. Information Disclosure
```typescript
// ❌ Vulnerable
res.status(500).json({ error: error.stack });

// ✅ Safe
console.error('Internal error:', error);
res.status(500).json({ error: "Internal server error" });
```

### 5. Insecure Dependencies
```bash
# Regularly audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## Security Testing

### Automated Security Testing
```bash
# Dependency vulnerability scanning
npm audit

# Static code analysis (if configured)
npm run lint:security

# Container security scanning
docker scan wolves-pet-store:latest
```

### Manual Security Testing
- **Authentication testing** - Verify all auth flows
- **Authorization testing** - Check role-based access
- **Input validation testing** - Test with malicious inputs
- **Session management testing** - Verify session security
- **Error handling testing** - Ensure no information leakage

## Security Resources

### References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency vulnerability scanning
- [Snyk](https://snyk.io/) - Security vulnerability scanning
- [ESLint Security Plugin](https://github.com/nodesecurity/eslint-plugin-security) - Static security analysis
- [OWASP ZAP](https://www.zaproxy.org/) - Web application security testing

## Contact

For security-related questions or concerns, please contact:
- **Security Team:** security@example.com
- **General Questions:** Use GitHub Discussions

Thank you for helping keep Wolves Pet Store secure!
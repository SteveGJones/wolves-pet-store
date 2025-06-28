# Security Configuration Guide

This document outlines the security measures implemented in the Wolves Pet Store application and provides guidance for secure production deployment.

## Security Overview

The application implements multiple layers of security:

- **Authentication**: Session-based with bcrypt password hashing
- **Authorization**: Role-based access control
- **Network Security**: Kubernetes network policies
- **Container Security**: Non-root containers with security contexts
- **Database Security**: Encrypted connections and secure credentials
- **Session Security**: Secure session management
- **Input Validation**: Comprehensive input validation with Zod

## Critical Security Configuration

### 1. Secrets Management

**⚠️ IMPORTANT**: Before deploying to production, you MUST update the following secrets:

#### Application Secrets

```bash
# Generate a strong session secret
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo -n "$SESSION_SECRET" | base64

# Update k8s/app-secrets.yaml with the base64 encoded value
```

#### Database Secrets

```bash
# Generate a strong PostgreSQL password
PG_PASSWORD=$(openssl rand -base64 24)

# Use the provided script to update secrets
./utils/generate-postgres-secret.sh
```

### 2. Environment Configuration

Update the following production settings in `k8s/app-configmap.yaml`:

```yaml
# Session configuration
SESSION_SECURE: "true"          # Requires HTTPS
CORS_ORIGIN: "https://your-domain.com"  # Replace with actual domain

# Security features
ADMIN_REGISTRATION_ENABLED: "false"     # Disable admin self-registration
RATE_LIMIT_WINDOW: "900000"            # 15 minutes
RATE_LIMIT_MAX: "50"                   # Stricter rate limiting
```

### 3. HTTPS Configuration

**Production deployments MUST use HTTPS**:

- Configure ingress with TLS certificates
- Update `SESSION_SECURE` to `"true"`
- Update `CORS_ORIGIN` to your actual domain with HTTPS

Example ingress configuration:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: petstore-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: petstore-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: petstore-app
            port:
              number: 3000
```

## Authentication Security

### Password Requirements

- Minimum 8 characters
- Must contain at least one special character
- bcrypt hashing with 12 rounds
- UUID primary keys for non-predictable user IDs

### Session Management

- PostgreSQL-backed session storage
- HTTP-only cookies (XSS protection)
- SameSite=strict (CSRF protection)
- Secure flag for HTTPS
- 24-hour session expiration

### Admin Access

- Admin flag in user table
- Separate admin-only routes (`/api/admin/*`)
- Admin registration disabled by default
- Manual admin user creation via script

## Network Security

### Kubernetes Network Policies

The application includes comprehensive network policies:

```yaml
# Default deny all traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

# Allow specific communication paths
- App pods can communicate with database
- Database only accepts connections from app pods
- Ingress only allows HTTP/HTTPS traffic
```

### Container Security

- Non-root user (UID 1001)
- Read-only root filesystem
- No privileged containers
- Security context enforced
- Minimal attack surface

## Input Validation

### Server-Side Validation

All inputs validated using Zod schemas:

```typescript
// Example validation schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[!@#$%^&*]/),
  displayName: z.string().min(1).max(100)
});
```

### SQL Injection Prevention

- Parameterized queries only
- Drizzle ORM prevents SQL injection
- No dynamic SQL construction

### XSS Prevention

- Input sanitization
- HTTP-only cookies
- Content-Type headers
- CSP headers (recommended)

## Database Security

### Connection Security

- Encrypted connections (TLS)
- Connection pooling with limits
- Timeout configurations
- Credential rotation capability

### Access Control

- Database user with minimal privileges
- No superuser access from application
- Regular credential rotation
- Backup encryption (production)

## Monitoring and Logging

### Security Logging

- Authentication attempts
- Failed login attempts
- Admin actions
- Database connection errors
- Rate limiting triggers

### Health Monitoring

- Application health checks
- Database connectivity monitoring
- Resource usage monitoring
- Alert configuration (production)

## Security Checklist for Production

### Pre-Deployment

- [ ] Generated strong session secret
- [ ] Generated strong database password
- [ ] Updated CORS origins to actual domain
- [ ] Enabled HTTPS with valid certificates
- [ ] Set `SESSION_SECURE: "true"`
- [ ] Disabled admin self-registration
- [ ] Configured rate limiting
- [ ] Reviewed network policies
- [ ] Set up monitoring and alerting

### Post-Deployment

- [ ] Created initial admin user
- [ ] Tested authentication flows
- [ ] Verified HTTPS redirects
- [ ] Tested rate limiting
- [ ] Verified session security
- [ ] Tested database connectivity
- [ ] Verified backup procedures
- [ ] Set up log monitoring

## Security Best Practices

### Development

1. **Never commit secrets**: Use placeholder values in version control
2. **Use environment variables**: Keep secrets out of code
3. **Regular updates**: Keep dependencies updated
4. **Code reviews**: Security-focused code reviews
5. **Testing**: Include security testing in CI/CD

### Production

1. **Credential rotation**: Regular password/secret rotation
2. **Monitoring**: Comprehensive security monitoring
3. **Backups**: Encrypted backups with secure storage
4. **Updates**: Regular security updates
5. **Incident response**: Security incident procedures

### Kubernetes

1. **RBAC**: Role-based access control
2. **Network policies**: Restrict pod communication
3. **Pod security**: Security contexts and policies
4. **Secrets management**: External secret management
5. **Resource limits**: CPU and memory limits

## Common Security Vulnerabilities to Avoid

### Application Level

- **Weak passwords**: Enforce strong password requirements
- **Session fixation**: Generate new session IDs on login
- **CSRF attacks**: Use SameSite cookies and CSRF tokens
- **XSS attacks**: Sanitize inputs and use CSP headers
- **SQL injection**: Use parameterized queries only

### Infrastructure Level

- **Exposed secrets**: Use Kubernetes secrets properly
- **Weak TLS**: Use strong TLS configurations
- **Open ports**: Minimize exposed ports
- **Privileged containers**: Use non-root users
- **Unrestricted network**: Implement network policies

## Security Contact

For security issues:
1. Follow responsible disclosure practices
2. Report via security@your-domain.com (if applicable)
3. Include detailed reproduction steps
4. Allow reasonable time for response

## Compliance Considerations

### Data Protection

- **Personal data**: Minimal collection and processing
- **GDPR compliance**: User consent and data rights
- **Data retention**: Automatic cleanup policies
- **Encryption**: Data at rest and in transit

### Audit Requirements

- **Access logging**: Comprehensive audit trails
- **Change tracking**: Database change logs
- **Compliance reporting**: Regular security assessments
- **Documentation**: Security policy documentation

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security Documentation](https://www.postgresql.org/docs/current/security.html)
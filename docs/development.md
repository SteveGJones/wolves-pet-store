# Development Guide

This guide covers local development setup, best practices, and development workflows for the Wolves Pet Store application.

## Getting Started

### Prerequisites

**Required Software**:
- **Node.js**: Version 20 or higher
- **npm**: Latest version (comes with Node.js)
- **Docker**: For containerization and local Kubernetes
- **Kubernetes**: minikube, kind, or Docker Desktop Kubernetes
- **kubectl**: Kubernetes command-line tool

**Recommended Tools**:
- **Skaffold**: For Kubernetes development workflow
- **Visual Studio Code**: With recommended extensions
- **Git**: For version control

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd wolves-pet-store
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start with Kubernetes (Recommended)**:
   ```bash
   skaffold dev --port-forward
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Health check: http://localhost:3000/api/health

## Development Workflows

### Kubernetes Development (Recommended)

This is the preferred development method as it matches the production environment.

```bash
# Start complete development stack
skaffold dev --port-forward

# The application will be available at:
# - Frontend: http://localhost:3000
# - Database: localhost:5432 (via port-forward)

# Hot reload is enabled for both frontend and backend
# Changes to source files trigger automatic rebuilds
```

**Benefits**:
- Matches production environment exactly
- Automatic database migration and seeding
- Network policies and security contexts tested
- Multi-container orchestration

### Local Development (Alternative)

For faster iteration during development:

```bash
# Start database in Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl port-forward -n petstore service/postgres 5432:5432 &

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/petstore"
export SESSION_SECRET="dev-secret-key"
export NODE_ENV="development"

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## Project Structure

```
wolves-pet-store/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/       # Authentication components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── pages/          # Route-based pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and config
│   └── index.html          # Main HTML template
├── server/                 # Express.js backend
│   ├── auth.ts            # Authentication system
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── __tests__/         # Backend tests
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts          # Database schema & validation
├── k8s/                   # Kubernetes manifests
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── plan/                  # Sprint planning docs
```

## Development Commands

### Core Commands

```bash
# Development server (local)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run check

# Run tests
npm test
npm run test:watch
npm run test:unit
npm run test:integration
```

### Database Commands

```bash
# Run migrations
npm run migrate

# Seed with sample data
npm run seed

# Create admin user
npm run create-admin -- --email admin@example.com

# Database operations via kubectl (when using K8s)
kubectl exec -it statefulset/postgres -n petstore -- psql -U postgres -d petstore
```

### Kubernetes Commands

```bash
# Development environment
skaffold dev --port-forward

# Production deployment
skaffold run -p prod

# Clean up resources
skaffold delete

# Manual deployments
kubectl apply -f k8s/
kubectl delete -f k8s/
```

## Code Style and Standards

### TypeScript Configuration

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Code Style

- **ESLint**: Enforces code quality and consistency
- **Prettier**: Automatic code formatting
- **Path Aliases**: Use `@/*` for client imports, `@shared/*` for shared code

### Recommended VSCode Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "GoogleCloudTools.cloudcode"
  ]
}
```

## Authentication System

### Overview

The application uses session-based authentication with:
- bcrypt password hashing (12 rounds)
- PostgreSQL session storage
- UUID primary keys for users
- Role-based access control (admin flag)

### Testing Authentication

```bash
# Create test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Check session
curl -X GET http://localhost:3000/api/auth/user \
  -H "Cookie: connect.sid=<session-id>"
```

### Admin User Creation

```bash
# Interactive mode (prompts for password)
npm run create-admin -- --email admin@company.com

# Command line mode
npm run create-admin -- --email admin@company.com --password "SecurePass123!" --display-name "Admin"

# In Kubernetes
kubectl exec deployment/petstore-app -n petstore -- \
  node dist/scripts/create-admin.js --email admin@example.com
```

## Database Development

### Schema Management

The database schema is defined in `shared/schema.ts` using Drizzle ORM:

```typescript
// Example table definition
export const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  categoryId: integer('category_id').references(() => petCategories.id).notNull(),
  // ... other fields
});
```

### Migration Workflow

1. **Update schema** in `shared/schema.ts`
2. **Test locally**:
   ```bash
   npm run migrate
   npm run seed  # optional: refresh sample data
   ```
3. **Test in Kubernetes**:
   ```bash
   skaffold delete
   skaffold dev --port-forward
   ```

### Sample Data

The application includes comprehensive sample data:
- 6 pet categories (Dogs, Cats, Birds, Small Animals, Reptiles, Fish)
- 35+ diverse pets with detailed information
- Various pet statuses (available, pending, adopted)

```bash
# Seed database with sample data
npm run seed

# Or via Kubernetes (automatic during deployment)
kubectl logs job/db-migration -n petstore
```

## Frontend Development

### Technology Stack

- **React 18**: Latest React with concurrent features
- **TypeScript**: Strict type checking
- **Vite**: Fast build tool with HMR
- **Wouter**: Lightweight routing (4KB vs 45KB for React Router)
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **React Query**: Server state management

### Component Development

```bash
# Component structure
src/components/
├── auth/               # Authentication components
│   ├── login-form.tsx
│   ├── register-form.tsx
│   └── protected-route.tsx
├── ui/                 # shadcn/ui components
└── [feature]/          # Feature-specific components
```

### State Management

```typescript
// Using React Query for server state
import { useQuery, useMutation } from '@tanstack/react-query';

// Custom hook example
export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () => fetch('/api/pets').then(res => res.json())
  });
}

// Authentication state
import { useAuth } from '@/hooks/useAuth';
const { user, isAuthenticated, logout } = useAuth();
```

### Styling Guidelines

```typescript
// Use Tailwind classes with consistent patterns
<Button className="bg-wolves-gold text-wolves-black hover:bg-yellow-400">
  Submit
</Button>

// Use shadcn/ui components for consistency
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

## Backend Development

### API Design

The backend follows RESTful conventions:

```typescript
// Route structure
/api/auth/*           # Authentication endpoints
/api/pets/*           # Pet management
/api/admin/*          # Admin-only endpoints
/api/health           # Health check
```

### Error Handling

```typescript
// Consistent error responses
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "status": 404
}

// Validation errors
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Middleware

```typescript
// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Admin middleware
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getUserById(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

## Testing

### Testing Strategy

- **Unit Tests (70%)**: Business logic, utilities, components
- **Integration Tests (20%)**: API endpoints, database operations
- **E2E Tests (10%)**: Critical user journeys

### Running Tests

```bash
# All tests
npm test

# Unit tests only (fast)
npm run test:unit

# Integration tests (requires database)
npm run test:integration

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Examples

```typescript
// Unit test example
import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/lib/authUtils';

describe('validateEmail', () => {
  it('should validate correct email format', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});

// Integration test example
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Auth API', () => {
  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        displayName: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

## Environment Configuration

### Development Environment

```bash
# .env.development (not committed)
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore
SESSION_SECRET=dev-secret-change-in-production
NODE_ENV=development
PORT=3000
```

### Kubernetes Environment

Configuration is managed through ConfigMaps and Secrets:

```yaml
# ConfigMap for non-sensitive config
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  PORT: "3000"

# Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
data:
  SESSION_SECRET: <base64-encoded-secret>
```

## Debugging

### Local Debugging

```bash
# Enable debug logging
DEBUG=app:* npm run dev

# Node.js debugging
node --inspect server/index.ts

# Database debugging
psql postgresql://postgres:password@localhost:5432/petstore
```

### Kubernetes Debugging

```bash
# Check pod status
kubectl get pods -n petstore
kubectl describe pod <pod-name> -n petstore

# View logs
kubectl logs deployment/petstore-app -n petstore -f
kubectl logs statefulset/postgres -n petstore -f

# Debug inside container
kubectl exec -it deployment/petstore-app -n petstore -- /bin/sh

# Port forward for database access
kubectl port-forward -n petstore service/postgres 5432:5432
```

## Performance Optimization

### Frontend Optimization

- **Code Splitting**: Vite automatically splits code
- **Tree Shaking**: Unused code is eliminated
- **Asset Optimization**: Images and fonts optimized
- **Bundle Analysis**: Use `npm run build` and analyze output

### Backend Optimization

- **Database Indexing**: Proper indexes on frequently queried columns
- **Connection Pooling**: PostgreSQL connection pool configured
- **Caching**: React Query provides client-side caching
- **Compression**: gzip compression enabled

### Kubernetes Optimization

- **Resource Limits**: CPU and memory limits set
- **Horizontal Pod Autoscaler**: Automatic scaling based on load
- **Persistent Volumes**: Database persistence
- **Health Checks**: Proper liveness and readiness probes

## Contributing

### Development Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop and test**:
   ```bash
   npm run dev  # or skaffold dev
   npm test
   npm run check
   ```

3. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Create pull request** following the template in `CONTRIBUTING.md`

### Code Review Checklist

- [ ] TypeScript compilation passes (`npm run check`)
- [ ] All tests pass (`npm test`)
- [ ] Code follows style guidelines
- [ ] Changes are documented
- [ ] Database migrations are included if needed
- [ ] Security considerations addressed

For detailed contribution guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Additional Resources

- [Deployment Guide](./deployment.md) - Production deployment instructions
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions
- [API Documentation](../API.md) - Complete API reference
- [Architecture Documentation](../README.md) - System architecture overview
- [Sprint Planning](../plan/) - Development planning documents
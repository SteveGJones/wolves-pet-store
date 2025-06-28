# Testing Standards and Practices

**Date:** 2025-06-28  
**Author:** Claude  
**Purpose:** Define comprehensive testing standards for both developers across the full stack

## 1. Overview

This document establishes testing standards and practices for the Wolves Pet Store project, ensuring comprehensive coverage across backend APIs, frontend components, infrastructure, and end-to-end workflows. Both developers must follow these standards to maintain code quality and deployment reliability.

## 2. Testing Philosophy

### **Core Principles:**
- ✅ **Test Pyramid**: Unit tests (70%), Integration tests (20%), E2E tests (10%)
- ✅ **Fail Fast**: Tests should catch issues before deployment
- ✅ **Coverage Goals**: Minimum 80% code coverage for critical paths
- ✅ **Automation**: All tests must be runnable via CI/CD
- ✅ **Documentation**: Tests serve as living documentation

### **Testing Scope by Developer:**
- **Dev A (Application):** Unit tests, API integration tests, auth flow tests, frontend component tests
- **Dev B (Infrastructure):** Container tests, K8s deployment tests, infrastructure validation tests

## 3. Technology Stack for Testing

### **Backend Testing (Dev A)**
```json
{
  "vitest": "^1.0.0",           // Fast unit test runner
  "supertest": "^6.3.3",       // HTTP assertion library
  "@testcontainers/postgresql": "^10.0.0", // Database testing
  "jest-mock": "^29.7.0",      // Mocking utilities
  "msw": "^2.0.0"              // API mocking for frontend
}
```

### **Frontend Testing (Dev A)**
```json
{
  "@testing-library/react": "^14.0.0",     // React component testing
  "@testing-library/jest-dom": "^6.0.0",   // DOM assertions
  "@testing-library/user-event": "^14.0.0", // User interaction simulation
  "jsdom": "^23.0.0"                       // DOM environment for tests
}
```

### **Infrastructure Testing (Dev B)**
```json
{
  "docker": "CLI",              // Container testing
  "kubectl": "CLI",             // K8s validation
  "helm": "CLI",                // Chart testing (if used)
  "conftest": "CLI",            // Policy testing
  "kubeval": "CLI"              // K8s manifest validation
}
```

## 4. Backend Testing Standards (Dev A)

### **4.1 Unit Tests**

#### **File Structure:**
```
server/
├── auth.ts
├── auth.test.ts          # Unit tests for auth module
├── db.ts
├── db.test.ts           # Unit tests for database utilities
├── routes.ts
├── routes.test.ts       # Unit tests for route handlers
└── __tests__/
    ├── fixtures/         # Test data and fixtures
    ├── helpers/          # Test utilities
    └── setup.ts         # Test environment setup
```

#### **Authentication Module Tests:**
```typescript
// server/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, validatePassword, validatePasswordRequirements } from './auth';

describe('Authentication Module', () => {
  describe('Password Hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'TestPass123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('should validate correct passwords', async () => {
      const password = 'TestPass123!';
      const hash = await hashPassword(password);
      const isValid = await validatePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'TestPass123!';
      const wrongPassword = 'WrongPass123!';
      const hash = await hashPassword(password);
      const isValid = await validatePassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Password Requirements', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'Test@123',
        'MyStr0ng#Pass'
      ];
      
      validPasswords.forEach(password => {
        expect(validatePasswordRequirements(password)).toBe(true);
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        'short',           // Too short
        'NoSpecialChar1',  // No special character
        'nouppercas!',     // No uppercase
        'NOLOWERCASE!',    // No lowercase
        'NoNumbers!'       // No numbers
      ];
      
      invalidPasswords.forEach(password => {
        expect(validatePasswordRequirements(password)).toBe(false);
      });
    });
  });
});
```

#### **Database Tests with Testcontainers:**
```typescript
// server/db.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

describe('Database Operations', () => {
  let container: PostgreSqlContainer;
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();
    
    pool = new Pool({
      connectionString: container.getConnectionUri(),
    });
    
    db = drizzle(pool, { schema });
    
    // Run migrations
    await runMigrations(db);
  });

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    // Clean database between tests
    await db.delete(schema.users);
  });

  describe('User Operations', () => {
    it('should create a user with UUID', async () => {
      const userData = {
        email: 'test@example.com',
        password: await hashPassword('TestPass123!'),
        displayName: 'Test User'
      };

      const [user] = await db.insert(schema.users).values(userData).returning();

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
      expect(user.isAdmin).toBe(false);
    });
  });
});
```

### **4.2 API Integration Tests**

#### **Authentication API Tests:**
```typescript
// server/routes.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { setupTestDatabase, cleanupTestDatabase } from './__tests__/helpers/database';

describe('Authentication API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupUsers();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        displayName: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.displayName).toBe('Test User');
      expect(response.body.user.password).toBeUndefined(); // Should not return password
    });

    it('should reject weak passwords', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Password does not meet requirements');
      expect(response.body.code).toBe('WEAK_PASSWORD');
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        displayName: 'Test User'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('An account with this email already exists');
      expect(response.body.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
          displayName: 'Test User'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      
      // Should set session cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Authentication Flow', () => {
    it('should maintain session across requests', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
          displayName: 'Test User'
        });

      // Login and capture session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!'
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // Access protected route with session
      const userResponse = await request(app)
        .get('/api/auth/user')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(userResponse.body.user.email).toBe('test@example.com');

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Verify session is cleared
      await request(app)
        .get('/api/auth/user')
        .set('Cookie', sessionCookie)
        .expect(401);
    });
  });
});
```

## 5. Frontend Testing Standards (Dev A)

### **5.1 Component Tests**

#### **File Structure:**
```
client/src/
├── components/
│   ├── LoginForm.tsx
│   ├── LoginForm.test.tsx
│   ├── RegisterForm.tsx
│   ├── RegisterForm.test.tsx
│   └── __tests__/
│       ├── fixtures/
│       └── setup.ts
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.tsx
└── test-utils.tsx       # Testing utilities and providers
```

#### **Login Form Component Tests:**
```typescript
// client/src/components/LoginForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { renderWithProviders } from '../test-utils';

// Mock the auth hook
vi.mock('../hooks/useAuth');

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null
    });
  });

  it('should render login form fields', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should submit valid credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPass123!'
      });
    });
  });

  it('should display error messages', () => {
    (useAuth as vi.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid email or password'
    });
    
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('should disable form during loading', () => {
    (useAuth as vi.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null
    });
    
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
```

#### **useAuth Hook Tests:**
```typescript
// client/src/hooks/useAuth.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { server } from '../__tests__/mocks/server';

// Setup MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  it('should initialize as not authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle successful login', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await result.current.login({
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });
});
```

### **5.2 MSW API Mocking**

```typescript
// client/src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    
    if (email === 'test@example.com' && password === 'TestPass123!') {
      return HttpResponse.json({
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          displayName: 'Test User',
          isAdmin: false
        }
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json();
    
    return HttpResponse.json({
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        displayName: userData.displayName,
        isAdmin: false
      }
    }, { status: 201 });
  }),

  http.get('/api/auth/user', () => {
    return HttpResponse.json({
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        displayName: 'Test User',
        isAdmin: false
      }
    });
  })
];
```

## 6. Infrastructure Testing Standards (Dev B)

### **6.1 Container Testing**

#### **Dockerfile Testing:**
```bash
#!/bin/bash
# scripts/test-docker.sh

set -e

echo "Testing Docker build..."

# Build the image
docker build -t petstore-test .

# Test basic functionality
echo "Testing container startup..."
CONTAINER_ID=$(docker run -d -p 3001:5000 \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e SESSION_SECRET="test-secret" \
  -e NODE_ENV="production" \
  petstore-test)

# Wait for container to be ready
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
curl -f http://localhost:3001/api/health || {
  echo "Health check failed"
  docker logs $CONTAINER_ID
  docker stop $CONTAINER_ID
  exit 1
}

# Test that static files are served
echo "Testing static file serving..."
curl -f http://localhost:3001/ | grep -q "<!DOCTYPE html>" || {
  echo "Static files not served correctly"
  docker logs $CONTAINER_ID
  docker stop $CONTAINER_ID
  exit 1
}

# Cleanup
docker stop $CONTAINER_ID
docker rmi petstore-test

echo "Docker tests passed!"
```

#### **Container Security Testing:**
```bash
#!/bin/bash
# scripts/test-docker-security.sh

set -e

echo "Testing container security..."

# Build image
docker build -t petstore-security-test .

# Test non-root user
echo "Testing non-root user..."
USER_ID=$(docker run --rm petstore-security-test id -u)
if [ "$USER_ID" = "0" ]; then
  echo "ERROR: Container running as root"
  exit 1
fi

# Test filesystem permissions
echo "Testing filesystem permissions..."
docker run --rm petstore-security-test ls -la /app | grep "appuser nodejs" || {
  echo "ERROR: Incorrect file ownership"
  exit 1
}

# Test that we can't write to system directories
echo "Testing filesystem restrictions..."
docker run --rm petstore-security-test sh -c "touch /etc/test 2>/dev/null && echo 'FAIL' || echo 'PASS'" | grep "PASS" || {
  echo "ERROR: Can write to system directories"
  exit 1
}

# Cleanup
docker rmi petstore-security-test

echo "Container security tests passed!"
```

### **6.2 Kubernetes Manifest Testing**

#### **Manifest Validation:**
```bash
#!/bin/bash
# scripts/test-k8s-manifests.sh

set -e

echo "Testing Kubernetes manifests..."

# Validate all manifests
echo "Validating manifest syntax..."
for manifest in k8s/*.yaml; do
  echo "Validating $manifest..."
  kubectl --dry-run=client apply -f "$manifest" || {
    echo "ERROR: Invalid manifest $manifest"
    exit 1
  }
done

# Test with kubeval for additional validation
if command -v kubeval &> /dev/null; then
  echo "Running kubeval validation..."
  kubeval k8s/*.yaml || {
    echo "ERROR: kubeval validation failed"
    exit 1
  }
fi

# Test resource requirements
echo "Testing resource requirements..."
grep -q "requests:" k8s/deployment.yaml || {
  echo "ERROR: No resource requests defined"
  exit 1
}

grep -q "limits:" k8s/deployment.yaml || {
  echo "ERROR: No resource limits defined"
  exit 1
}

# Test security contexts
echo "Testing security contexts..."
grep -q "runAsNonRoot: true" k8s/deployment.yaml || {
  echo "ERROR: Not configured to run as non-root"
  exit 1
}

echo "Kubernetes manifest tests passed!"
```

#### **Deployment Testing:**
```bash
#!/bin/bash
# scripts/test-k8s-deployment.sh

set -e

NAMESPACE="petstore-test"

echo "Testing Kubernetes deployment..."

# Create test namespace
kubectl create namespace $NAMESPACE || true

# Apply manifests
echo "Deploying to test namespace..."
for manifest in k8s/*.yaml; do
  kubectl apply -f "$manifest" -n $NAMESPACE
done

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s

# Wait for application to be ready
echo "Waiting for application..."
kubectl wait --for=condition=ready pod -l app=petstore -n $NAMESPACE --timeout=300s

# Test health endpoint via port-forward
echo "Testing health endpoint..."
kubectl port-forward -n $NAMESPACE svc/petstore-service 3002:80 &
PORT_FORWARD_PID=$!
sleep 5

curl -f http://localhost:3002/api/health || {
  echo "ERROR: Health check failed"
  kill $PORT_FORWARD_PID || true
  kubectl delete namespace $NAMESPACE
  exit 1
}

kill $PORT_FORWARD_PID || true

# Test database connectivity
echo "Testing database connectivity..."
kubectl exec -n $NAMESPACE deployment/petstore-app -- npm run db:push || {
  echo "ERROR: Database migration failed"
  kubectl delete namespace $NAMESPACE
  exit 1
}

# Cleanup
kubectl delete namespace $NAMESPACE

echo "Kubernetes deployment tests passed!"
```

### **6.3 Skaffold Testing**

```bash
#!/bin/bash
# scripts/test-skaffold.sh

set -e

echo "Testing Skaffold configuration..."

# Validate skaffold.yaml
skaffold config list || {
  echo "ERROR: Invalid skaffold.yaml"
  exit 1
}

# Test development profile
echo "Testing development profile..."
timeout 300 skaffold dev --profile dev --port-forward=false &
SKAFFOLD_PID=$!

# Wait for deployment
sleep 60

# Check if pods are running
kubectl get pods -l app=petstore || {
  echo "ERROR: Pods not running"
  kill $SKAFFOLD_PID || true
  exit 1
}

# Cleanup
kill $SKAFFOLD_PID || true
skaffold delete

echo "Skaffold tests passed!"
```

## 7. End-to-End Testing Standards (Both Developers)

### **7.1 E2E Test Setup**

```typescript
// e2e/auth-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto('/');
  });

  test('user can register and login', async ({ page }) => {
    // Navigate to register
    await page.click('text=Register');
    
    // Fill registration form
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'TestPass123!');
    await page.fill('[data-testid=displayName]', 'Test User');
    
    // Submit registration
    await page.click('[data-testid=register-submit]');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    
    // Logout
    await page.click('[data-testid=logout]');
    
    // Login with same credentials
    await page.click('text=Login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'TestPass123!');
    await page.click('[data-testid=login-submit]');
    
    // Should be logged in
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('admin can access admin dashboard', async ({ page }) => {
    // Login as admin (created via script)
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'admin@admin.com');
    await page.fill('[data-testid=password]', 'admin-password');
    await page.click('[data-testid=login-submit]');
    
    // Navigate to admin dashboard
    await page.goto('/admin');
    
    // Should have access
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });
});
```

### **7.2 Offline Development Testing**

```bash
#!/bin/bash
# scripts/test-offline-development.sh

set -e

echo "Testing offline development capability..."

# Start with clean environment
minikube delete || true
minikube start

# Disconnect from internet (platform-specific)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sudo route add -net 0.0.0.0/1 127.0.0.1
  sudo route add -net 128.0.0.0/1 127.0.0.1
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  sudo iptables -A OUTPUT -j DROP
fi

# Test that skaffold dev works offline
echo "Testing Skaffold in offline mode..."
timeout 300 skaffold dev --port-forward=false &
SKAFFOLD_PID=$!

sleep 120

# Test application functionality
kubectl port-forward svc/petstore-service 3003:80 &
PORT_FORWARD_PID=$!
sleep 10

# Test basic functionality
curl -f http://localhost:3003/api/health || {
  echo "ERROR: Application not working offline"
  FAILED=1
}

# Test database operations
kubectl exec deployment/petstore-app -- npm run create-admin -- --email offline@test.com --password OfflineTest123! || {
  echo "ERROR: Database operations not working offline"
  FAILED=1
}

# Cleanup
kill $PORT_FORWARD_PID $SKAFFOLD_PID || true
skaffold delete

# Restore internet connection
if [[ "$OSTYPE" == "darwin"* ]]; then
  sudo route delete -net 0.0.0.0/1
  sudo route delete -net 128.0.0.0/1
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  sudo iptables -D OUTPUT -j DROP
fi

if [ "${FAILED:-0}" = "1" ]; then
  echo "Offline development test failed!"
  exit 1
fi

echo "Offline development test passed!"
```

## 8. Test Configuration and Scripts

### **8.1 Package.json Test Scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest run src",
    "test:integration": "vitest run __tests__/integration",
    "test:e2e": "playwright test",
    "test:docker": "./scripts/test-docker.sh",
    "test:k8s": "./scripts/test-k8s-manifests.sh",
    "test:k8s-deploy": "./scripts/test-k8s-deployment.sh",
    "test:skaffold": "./scripts/test-skaffold.sh",
    "test:offline": "./scripts/test-offline-development.sh",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:docker && npm run test:k8s",
    "test:ci": "npm run test:coverage && npm run test:e2e"
  }
}
```

### **8.2 Vitest Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
```

## 9. CI/CD Integration

### **9.1 GitHub Actions Workflow**

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

  docker-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/test-docker.sh

  k8s-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v3
      - run: ./scripts/test-k8s-manifests.sh

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 10. Quality Gates and Coverage Requirements

### **10.1 Coverage Thresholds**
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user journeys covered
- **Infrastructure Tests**: All manifests validated

### **10.2 Definition of Done for Testing**
- [ ] All unit tests pass with >= 80% coverage
- [ ] All integration tests pass
- [ ] Docker build and security tests pass
- [ ] Kubernetes manifests validate and deploy successfully
- [ ] E2E tests pass for critical user flows
- [ ] Offline development test passes
- [ ] All tests run in CI/CD pipeline

### **10.3 Test Review Checklist**
- [ ] Tests are isolated and don't depend on external services
- [ ] Test data is properly cleaned up
- [ ] Error cases are tested, not just happy paths
- [ ] Tests are readable and well-documented
- [ ] Mock data represents realistic scenarios
- [ ] Performance tests included for critical paths

This comprehensive testing strategy ensures both developers maintain high quality standards while building a robust, reliable application that functions correctly in all environments, including offline development scenarios.
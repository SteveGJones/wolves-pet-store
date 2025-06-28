# Kubernetes-Native Testing Guide

This document explains how to run tests against the Kubernetes-hosted database, aligning with our K8s-first development approach.

## Testing Strategy

### Unit Tests (Fast, Isolated)
- Run against mocked dependencies
- No database connection required
- Focus on business logic and utilities

### Integration Tests (Against K8s Database)
- Run against actual PostgreSQL in Kubernetes
- Test real database operations
- Validate schema and data integrity

## Running Tests

### Unit Tests
```bash
# Run all unit tests (excluding integration tests)
npm run test:unit

# Watch mode for development
npm run test:watch
```

### Integration Tests
```bash
# 1. Ensure K8s database is running
skaffold dev --port-forward

# 2. In another terminal, run integration tests
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore npm run test:integration
```

## Setting Up Integration Testing

### Prerequisites
1. **Kubernetes cluster** running (minikube, kind, or cloud)
2. **Skaffold** installed and configured
3. **PostgreSQL** deployed in Kubernetes

### Step-by-Step Setup

#### 1. Start the Kubernetes Environment
```bash
# Start the complete development environment
skaffold dev --port-forward

# This will:
# - Deploy PostgreSQL to Kubernetes
# - Set up port forwarding for local access
# - Keep the environment running
```

#### 2. Verify Database Access
```bash
# Test connection to K8s database
psql postgresql://postgres:password@localhost:5432/petstore -c "SELECT 1;"
```

#### 3. Run Database Migrations
```bash
# Ensure schema is up to date
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore npm run db:push
```

#### 4. Run Integration Tests
```bash
# Run all integration tests
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore npm run test:integration

# Or with a single command
npm run test:integration
```

## Test Structure

### Unit Tests Location
```
server/
├── auth.test.ts              # Authentication utilities
├── routes.test.ts            # API endpoint logic (mocked DB)
└── storage.test.ts           # Database operations (mocked)
```

### Integration Tests Location
```
server/__tests__/integration/
├── database.test.ts          # K8s database connectivity
├── auth-integration.test.ts  # Authentication with real DB
└── api-integration.test.ts   # Full API flow tests
```

## Integration Test Examples

### Database Connectivity Test
```typescript
it('should connect to K8s PostgreSQL database', async () => {
  const result = await pool.query('SELECT 1 as test');
  expect(result.rows[0].test).toBe(1);
});
```

### Authentication Integration Test
```typescript
it('should create and authenticate user in K8s database', async () => {
  // Create user
  const user = await createUser({
    email: 'test-k8s@example.com',
    password: 'TestPass123!',
    displayName: 'Test User'
  });

  // Verify authentication
  const authUser = await authenticateUser('test-k8s@example.com', 'TestPass123!');
  expect(authUser).toBeDefined();
  expect(authUser.email).toBe('test-k8s@example.com');
});
```

### Schema Validation Test
```typescript
it('should verify all required tables exist', async () => {
  const tablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);

  const tables = tablesResult.rows.map(row => row.table_name);
  expect(tables).toContain('users');
  expect(tables).toContain('sessions');
  expect(tables).toContain('pets');
});
```

## Environment Variables

### Unit Tests
```bash
# Automatically set by test setup
NODE_ENV=test
SESSION_SECRET=test-secret
DATABASE_URL=postgresql://test:test@localhost:5432/test  # Mock URL
```

### Integration Tests
```bash
# Required for integration tests
VITEST_INTEGRATION=true
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore
NODE_ENV=test
SESSION_SECRET=test-secret
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

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
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: petstore
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
      - run: npm run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/petstore
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/petstore
```

## Development Workflow

### Daily Development
```bash
# 1. Start K8s environment (once per day)
skaffold dev --port-forward

# 2. Run unit tests frequently during development
npm run test:unit

# 3. Run integration tests before commits
npm run test:integration
```

### Before Pull Requests
```bash
# Run all tests
npm run test:unit
npm run test:integration

# Verify build
npm run build

# Check types
npm run check
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running in K8s
kubectl get pods -l app=postgres

# Check if port forwarding is working
kubectl port-forward svc/postgres 5432:5432

# Test direct connection
psql postgresql://postgres:password@localhost:5432/petstore -c "SELECT version();"
```

### Schema Issues
```bash
# Reset and recreate schema
kubectl delete job db-migration || true
kubectl apply -f k8s/db-migration-job.yaml

# Or push schema directly
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore npm run db:push
```

### Test Data Cleanup
Integration tests automatically clean up test data, but if needed:

```sql
-- Clean up test users
DELETE FROM users WHERE email LIKE 'test-k8s-%';

-- Reset sequences if needed
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
```

## Benefits of K8s-Native Testing

### ✅ Advantages
- **Real Environment**: Tests run against actual K8s database
- **Consistent**: Same database engine and version as production
- **Network**: Tests network connectivity and service discovery
- **Schema**: Validates migrations and schema changes
- **Performance**: Real database performance characteristics

### 🔧 Considerations
- **Setup**: Requires K8s environment to be running
- **Speed**: Slower than mocked tests (but more realistic)
- **Isolation**: Tests must clean up after themselves
- **Dependencies**: Requires stable K8s database connection

## Best Practices

### Test Data Management
- Use unique identifiers (timestamps, UUIDs) for test data
- Clean up test data in `beforeEach` or `afterEach` hooks
- Use test-specific prefixes (e.g., `test-k8s-` for emails)

### Test Isolation
- Each test should be independent and not rely on other tests
- Use transactions for tests that need rollback capability
- Clean up any created data before test completion

### Performance
- Keep integration tests focused and fast
- Use unit tests for complex business logic
- Integration tests for database schema and connectivity only

This K8s-native testing approach ensures our tests run in an environment as close to production as possible while maintaining the fast feedback loop needed for development.
import { beforeAll, afterAll } from 'vitest';

export let testConnectionString: string;

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-secret';
  
  // For unit tests, use a mock database URL
  if (!process.env.VITEST_INTEGRATION) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  } else {
    // For integration tests, expect K8s database to be available
    // This should be set by the developer when running integration tests
    // Example: kubectl port-forward svc/postgres 5432:5432
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  Integration tests require DATABASE_URL to be set');
      console.warn('   Run: kubectl port-forward svc/postgres 5432:5432');
      console.warn('   Then: DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore npm run test:integration');
      process.exit(1);
    }
    testConnectionString = process.env.DATABASE_URL;
  }
});

afterAll(async () => {
  // No cleanup needed for K8s-based testing
  // The database will be managed by Kubernetes
});
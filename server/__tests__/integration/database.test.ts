import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import { createUser, findUserByEmail } from '../../auth';
import { sql, eq } from 'drizzle-orm';

describe('K8s Database Integration Tests', () => {
  let pool: Pool;

  beforeAll(async () => {
    // Only run if VITEST_INTEGRATION is set
    if (!process.env.VITEST_INTEGRATION) {
      return;
    }

    // Use the existing K8s database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  beforeEach(async () => {
    if (!process.env.VITEST_INTEGRATION) {
      return;
    }
    
    // Clean up test data before each test
    await db.delete(users).where(sql`email LIKE 'test-k8s-%'`);
  });

  it('should connect to K8s PostgreSQL database', async () => {
    if (!process.env.VITEST_INTEGRATION) {
      console.log('Skipping integration test - set VITEST_INTEGRATION=true and DATABASE_URL to run');
      return;
    }

    const result = await pool.query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
  });

  it('should perform user operations against K8s database', async () => {
    if (!process.env.VITEST_INTEGRATION) {
      console.log('Skipping integration test - set VITEST_INTEGRATION=true and DATABASE_URL to run');
      return;
    }

    const testEmail = `test-k8s-${Date.now()}@example.com`;
    
    // Test user creation
    const userData = {
      email: testEmail,
      password: 'K8sTestPass123!',
      displayName: 'K8s Test User'
    };

    const user = await createUser(userData);
    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.displayName).toBe('K8s Test User');

    // Test user lookup
    const foundUser = await findUserByEmail(testEmail);
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(testEmail);

    // Cleanup
    await db.delete(users).where(sql`email = ${testEmail}`);
  });

  it('should verify database schema exists', async () => {
    if (!process.env.VITEST_INTEGRATION) {
      console.log('Skipping integration test - set VITEST_INTEGRATION=true and DATABASE_URL to run');
      return;
    }

    // Check that required tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'pets', 'pet_categories', 'inquiries', 'wishlists')
    `);

    const tableNames = tablesResult.rows.map(row => row.table_name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('pets');
    expect(tableNames).toContain('pet_categories');
  });
});
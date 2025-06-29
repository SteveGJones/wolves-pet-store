import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup() {
  console.log('🎭 Global setup: Preparing test environment');
  
  // Set up test database connection
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/petstore_test';
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Ensure database exists
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');
    
    // Run migrations - skip for now since we don't have a migrate function export
    console.log('📝 Skipping migrations - using existing database schema');
    // TODO: Implement proper migration running
    // const { migrate } = await import('../../scripts/migrate.js');
    // await migrate();
    
    // Seed test data
    console.log('🌱 Seeding test data...');
    await seedTestData(pool);
    console.log('✅ Test data seeded');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
  
  // Store test context
  process.env.TEST_START_TIME = Date.now().toString();
  process.env.TEST_RUN_ID = `test-run-${Date.now()}`;
  
  console.log('✅ Global setup completed');
}

async function seedTestData(pool: Pool) {
  // Clear existing test data
  await pool.query(`
    DELETE FROM inquiries WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-%');
    DELETE FROM wishlists WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-%');
    DELETE FROM sessions WHERE sess::jsonb->>'userId' IN (SELECT id::text FROM users WHERE email LIKE 'test-%');
    DELETE FROM users WHERE email LIKE 'test-%';
  `);
  
  // Create test users
  await pool.query(`
    INSERT INTO users (id, email, password_hash, display_name, is_admin, created_at)
    VALUES 
      (gen_random_uuid(), 'test-user@example.com', '$2b$12$LQgVNBeNtWLdABPKronmR.XFmDmvWrP3nclD7zLXGKTSdb/W0UYeC', 'Test User', false, NOW()),
      (gen_random_uuid(), 'test-admin@example.com', '$2b$12$LQgVNBeNtWLdABPKronmR.XFmDmvWrP3nclD7zLXGKTSdb/W0UYeC', 'Test Admin', true, NOW())
  `);
  // Password for both users is: TestPass123!
  
  console.log('Test users created');
}

export default globalSetup;
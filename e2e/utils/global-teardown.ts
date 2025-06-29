import { Pool } from 'pg';

async function globalTeardown() {
  console.log('🧹 Global teardown: Cleaning up test environment');
  
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/petstore_test';
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Clean up test data
    await pool.query(`
      DELETE FROM inquiries WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-%');
      DELETE FROM wishlists WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-%');
      DELETE FROM sessions WHERE sess::jsonb->>'userId' IN (SELECT id::text FROM users WHERE email LIKE 'test-%');
      DELETE FROM users WHERE email LIKE 'test-%';
    `);
    
    console.log('✅ Test data cleaned up');
    
    // Log test run summary
    const startTime = parseInt(process.env.TEST_START_TIME || '0');
    const duration = Date.now() - startTime;
    console.log(`\n📊 Test run ${process.env.TEST_RUN_ID} completed in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  } finally {
    await pool.end();
  }
}

export default globalTeardown;
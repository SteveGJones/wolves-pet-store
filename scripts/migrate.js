import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

console.log('Connecting to database...');
const pool = new Pool({ connectionString: DATABASE_URL });

async function migrate() {
  try {
    console.log('Running database migrations...');
    
    // Create tables based on the exact Drizzle schema
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Sessions table for session storage
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

      -- Users table (updated for UUID and bcrypt authentication)
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        display_name VARCHAR,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Pet categories
      CREATE TABLE IF NOT EXISTS pet_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Pets table
      CREATE TABLE IF NOT EXISTS pets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category_id INTEGER NOT NULL REFERENCES pet_categories(id),
        breed VARCHAR(100),
        age VARCHAR(50),
        size VARCHAR(20),
        gender VARCHAR(10),
        color VARCHAR(50),
        description TEXT,
        temperament TEXT,
        medical_history TEXT,
        adoption_fee DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'available',
        is_neutered BOOLEAN DEFAULT FALSE,
        is_vaccinated BOOLEAN DEFAULT FALSE,
        image_urls TEXT[],
        tags TEXT[],
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_adopted TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Pet supplies/products
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        image_urls TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Customer inquiries
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        pet_id INTEGER REFERENCES pets(id),
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(200) NOT NULL,
        customer_phone VARCHAR(20),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Wishlist/favorites (note: table name is wishlists, not wishlist)
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        pet_id INTEGER NOT NULL REFERENCES pets(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, pet_id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_pets_category ON pets(category_id);
      CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
      CREATE INDEX IF NOT EXISTS idx_inquiries_pet ON inquiries(pet_id);
      CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
    `);

    console.log('✅ Database migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate().catch(console.error);
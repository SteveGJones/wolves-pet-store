#!/usr/bin/env tsx

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
    
    // Create tables based on the schema
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        "isAdmin" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pet_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        breed VARCHAR(100) NOT NULL,
        age VARCHAR(20) NOT NULL,
        size VARCHAR(20) NOT NULL,
        color VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        personality TEXT NOT NULL,
        "imageUrl" VARCHAR(500),
        status VARCHAR(20) DEFAULT 'available',
        "categoryId" INTEGER REFERENCES pet_categories(id),
        "adoptionFee" DECIMAL(10,2) DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        "imageUrl" VARCHAR(500),
        "inStock" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        "petId" INTEGER REFERENCES pets(id),
        "customerName" VARCHAR(255) NOT NULL,
        "customerEmail" VARCHAR(255) NOT NULL,
        "customerPhone" VARCHAR(50),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        "userId" UUID REFERENCES users(id),
        "petId" INTEGER REFERENCES pets(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "petId")
      );

      CREATE INDEX IF NOT EXISTS idx_pets_category ON pets("categoryId");
      CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
      CREATE INDEX IF NOT EXISTS idx_inquiries_pet ON inquiries("petId");
      CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist("userId");
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
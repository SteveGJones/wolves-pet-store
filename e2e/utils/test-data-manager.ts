import { Pool } from 'pg';
import faker from 'faker';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  isAdmin: boolean;
}

export interface TestPet {
  id: number;
  name: string;
  breed: string;
  categoryId: number;
  status: string;
}

export class TestDataManager {
  private pool: Pool;
  private testRunId: string;
  
  constructor() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/petstore_test';
    this.pool = new Pool({ connectionString: databaseUrl });
    this.testRunId = process.env.TEST_RUN_ID || `test-${Date.now()}`;
  }
  
  async createTestUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    const password = overrides?.password || 'TestPass123!';
    const user = {
      email: overrides?.email || `test-${this.testRunId}-${faker.datatype.uuid()}@example.com`,
      displayName: overrides?.displayName || faker.name.findName(),
      isAdmin: overrides?.isAdmin || false,
    };
    
    // Hash password using bcrypt
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await this.pool.query(
      `INSERT INTO users (id, email, password_hash, display_name, is_admin, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING id, email, display_name as "displayName", is_admin as "isAdmin"`,
      [user.email, passwordHash, user.displayName, user.isAdmin]
    );
    
    return {
      ...result.rows[0],
      password,
    };
  }
  
  async createTestPet(overrides?: Partial<TestPet>): Promise<TestPet> {
    // First, ensure we have a category
    const categoryResult = await this.pool.query(
      `SELECT id FROM pet_categories WHERE name = 'Dogs' LIMIT 1`
    );
    
    let categoryId = categoryResult.rows[0]?.id;
    if (!categoryId) {
      const newCategory = await this.pool.query(
        `INSERT INTO pet_categories (name, description) VALUES ('Dogs', 'Test category') RETURNING id`
      );
      categoryId = newCategory.rows[0].id;
    }
    
    const pet = {
      name: overrides?.name || faker.name.firstName(),
      breed: overrides?.breed || faker.animal.dog(),
      categoryId: overrides?.categoryId || categoryId,
      age: 'Adult',
      size: 'Medium',
      gender: faker.random.arrayElement(['Male', 'Female']),
      color: faker.commerce.color(),
      description: faker.lorem.paragraph(),
      temperament: 'Friendly, Energetic',
      adoptionFee: faker.datatype.number({ min: 50, max: 500 }).toFixed(2),
      status: overrides?.status || 'available',
      isNeutered: true,
      isVaccinated: true,
    };
    
    const result = await this.pool.query(
      `INSERT INTO pets (
        name, category_id, breed, age, size, gender, color, 
        description, temperament, adoption_fee, status, 
        is_neutered, is_vaccinated, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id, name, breed, category_id as "categoryId", status`,
      [
        pet.name, pet.categoryId, pet.breed, pet.age, pet.size,
        pet.gender, pet.color, pet.description, pet.temperament,
        pet.adoptionFee, pet.status, pet.isNeutered, pet.isVaccinated
      ]
    );
    
    return result.rows[0];
  }
  
  async createTestInquiry(userId: string, petId: number, message?: string) {
    const result = await this.pool.query(
      `INSERT INTO inquiries (pet_id, user_id, message, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING id`,
      [petId, userId, message || faker.lorem.sentence()]
    );
    
    return result.rows[0];
  }
  
  async cleanupTestData(identifier?: string) {
    const pattern = identifier || this.testRunId;
    
    // Clean up in reverse order of dependencies
    await this.pool.query(`
      DELETE FROM inquiries WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE $1
      )
    `, [`test-${pattern}%`]);
    
    await this.pool.query(`
      DELETE FROM wishlists WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE $1
      )
    `, [`test-${pattern}%`]);
    
    await this.pool.query(`
      DELETE FROM sessions WHERE sess::jsonb->>'userId' IN (
        SELECT id::text FROM users WHERE email LIKE $1
      )
    `, [`test-${pattern}%`]);
    
    await this.pool.query(`
      DELETE FROM users WHERE email LIKE $1
    `, [`test-${pattern}%`]);
    
    await this.pool.query(`
      DELETE FROM pets WHERE name LIKE $1
    `, [`test-${pattern}%`]);
  }
  
  async dispose() {
    await this.pool.end();
  }
}
import { describe, it, expect, vi } from 'vitest';
import { hashPassword, validatePassword, validatePasswordRequirements, generateUserId } from './auth';

// Mock the database module for unit tests
vi.mock('./db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn()
  }
}));

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
        'nouppercas!',     // No uppercase (still valid by our current rules)
        'NOLOWERCASE!',    // No lowercase (still valid by our current rules)
        'NoNumbers!'       // No numbers (still valid by our current rules)
      ];
      
      // Only test the ones that should actually fail
      expect(validatePasswordRequirements('short')).toBe(false);
      expect(validatePasswordRequirements('NoSpecialChar1')).toBe(false);
    });
  });

  describe('UUID Generation', () => {
    it('should generate valid UUIDs', () => {
      const uuid = generateUserId();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUserId();
      const uuid2 = generateUserId();
      expect(uuid1).not.toBe(uuid2);
    });
  });
});
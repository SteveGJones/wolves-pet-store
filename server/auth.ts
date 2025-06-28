import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Session management interfaces
export interface SessionUser {
  userId: string;
  email: string;
  isAdmin: boolean;
  displayName?: string;
}

// Temporary stub for auth system - will be properly implemented
export async function setupAuth(app: any) {
  // Placeholder - will implement session middleware
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ 
      error: "Not authenticated", 
      code: "NOT_AUTHENTICATED" 
    });
  }
  
  // Attach user info to request
  req.user = req.session.user;
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ 
      error: "Admin access required", 
      code: "ADMIN_REQUIRED" 
    });
  }
  next();
}

// Password validation
export function validatePasswordRequirements(password: string): boolean {
  return password.length >= 8 && /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Password verification
export async function validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate UUID for users
export function generateUserId(): string {
  return uuidv4();
}

// Session management
export function createUserSession(user: any): SessionUser {
  return {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin || false,
    displayName: user.displayName
  };
}

// Database user operations
export async function createUser(userData: {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}): Promise<any> {
  const hashedPassword = await hashPassword(userData.password);
  
  const [user] = await db.insert(users).values({
    id: generateUserId(),
    email: userData.email,
    password: hashedPassword,
    displayName: userData.displayName,
    firstName: userData.firstName,
    lastName: userData.lastName,
  }).returning({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    firstName: users.firstName,
    lastName: users.lastName,
    isAdmin: users.isAdmin,
    createdAt: users.createdAt
  });
  
  return user;
}

export async function findUserByEmail(email: string): Promise<any> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<any> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  
  const isValid = await validatePassword(password, user.password);
  if (!isValid) return null;
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Input validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 
    "Password must contain at least one special character"),
  displayName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});
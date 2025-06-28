#!/usr/bin/env tsx

import { Command } from 'commander';
import * as readline from 'readline';

const program = new Command();

interface CreateAdminOptions {
  email: string;
  password?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function promptForPassword(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter admin password (input hidden): ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function createAdminUser(options: CreateAdminOptions): Promise<void> {
  try {
    // Import dependencies after command parsing
    const { createUser, findUserByEmail, validatePasswordRequirements } = await import('../server/auth');
    const { db } = await import('../server/db');
    const { users } = await import('../shared/schema');
    const { eq } = await import('drizzle-orm');

    // Validate email
    if (!validateEmail(options.email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    // Get password (prompt if not provided)
    let password = options.password;
    if (!password) {
      password = await promptForPassword();
    }

    // Validate password
    if (!validatePasswordRequirements(password)) {
      console.error('❌ Password must be at least 8 characters with at least one special character');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(options.email);
    if (existingUser) {
      console.error('❌ User with this email already exists');
      process.exit(1);
    }

    // Create admin user
    const userData = {
      email: options.email,
      password: password,
      displayName: options.displayName || 'Administrator',
      firstName: options.firstName,
      lastName: options.lastName
    };

    const user = await createUser(userData);

    // Make user admin
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, user.id));

    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   User ID: ${user.id}`);

  } catch (error: any) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  }
}

program
  .name('create-admin')
  .description('Create an administrator user')
  .requiredOption('-e, --email <email>', 'Admin email address')
  .option('-p, --password <password>', 'Admin password (will prompt if not provided)')
  .option('-d, --display-name <name>', 'Display name for admin user')
  .option('-f, --first-name <name>', 'First name')
  .option('-l, --last-name <name>', 'Last name')
  .action(createAdminUser);

program.parse();
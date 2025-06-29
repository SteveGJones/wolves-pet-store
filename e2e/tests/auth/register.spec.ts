import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { HomePage } from '../../pages/home.page';
import { TestDataManager } from '../../utils/test-data-manager';
import faker from 'faker';

test.describe('User Registration', () => {
  let authPage: AuthPage;
  let homePage: HomePage;
  let testDataManager: TestDataManager;
  
  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    homePage = new HomePage(page);
    testDataManager = new TestDataManager();
    
    await authPage.goto();
  });
  
  test.afterEach(async () => {
    await testDataManager.dispose();
  });
  
  test('should successfully register with valid data', async ({ page }) => {
    // Arrange
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'ValidPass123!',
      displayName: faker.name.findName()
    };
    
    // Act
    await authPage.register(testUser.email, testUser.password, testUser.displayName);
    
    // Assert
    await authPage.expectSuccessfulAuth();
    await expect(page).toHaveURL('/');
    
    // Verify user is logged in
    const userMenu = page.getByRole('button', { name: /user menu/i });
    await expect(userMenu).toBeVisible();
    await userMenu.click();
    await expect(page.getByText(testUser.displayName)).toBeVisible();
  });
  
  test('should show validation errors for invalid email', async ({ page }) => {
    // Arrange
    const invalidEmails = [
      'notanemail',
      'missing@',
      '@missing.com',
      'spaces in@email.com'
    ];
    
    await authPage.switchToSignUp();
    
    for (const email of invalidEmails) {
      // Act
      await authPage.emailInput.fill(email);
      await authPage.passwordInput.click(); // Trigger validation
      
      // Assert
      await authPage.expectFieldError('email', 'Invalid email');
      await authPage.expectSubmitDisabled();
      
      // Clean up
      await authPage.emailInput.clear();
    }
  });
  
  test('should validate password requirements in real-time', async ({ page }) => {
    await authPage.switchToSignUp();
    
    // Test weak password
    await authPage.passwordInput.fill('weak');
    await authPage.expectPasswordStrength('weak');
    await authPage.expectPasswordRequirement('At least 8 characters', false);
    await authPage.expectPasswordRequirement('One special character', false);
    await authPage.expectSubmitDisabled();
    
    // Test medium password
    await authPage.passwordInput.fill('medium123');
    await authPage.expectPasswordStrength('medium');
    await authPage.expectPasswordRequirement('At least 8 characters', true);
    await authPage.expectPasswordRequirement('One special character', false);
    await authPage.expectSubmitDisabled();
    
    // Test strong password
    await authPage.passwordInput.fill('Strong123!');
    await authPage.expectPasswordStrength('strong');
    await authPage.expectPasswordRequirement('At least 8 characters', true);
    await authPage.expectPasswordRequirement('One special character', true);
    
    // Fill other fields to enable submit
    await authPage.emailInput.fill('test@example.com');
    await authPage.displayNameInput.fill('Test User');
    await authPage.expectSubmitEnabled();
  });
  
  test('should prevent registration with existing email', async ({ page }) => {
    // Create existing user
    const existingUser = await testDataManager.createTestUser({
      email: 'existing@example.com'
    });
    
    // Try to register with same email
    await authPage.register(
      existingUser.email,
      'NewPass123!',
      'New User'
    );
    
    // Assert
    await authPage.expectError('Email already exists');
    await expect(page).toHaveURL('/auth');
  });
  
  test('should maintain form data after validation error', async ({ page }) => {
    const testData = {
      email: 'test@example.com',
      password: 'weak', // Invalid password
      displayName: 'Test User'
    };
    
    // Fill form with invalid data
    await authPage.fillRegistrationForm(testData);
    await authPage.submitButton.click();
    
    // Verify error is shown
    await authPage.expectFieldError('password', 'Password must be at least 8 characters');
    
    // Verify form data is preserved
    await expect(authPage.emailInput).toHaveValue(testData.email);
    await expect(authPage.passwordInput).toHaveValue(testData.password);
    await expect(authPage.displayNameInput).toHaveValue(testData.displayName);
  });
  
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Intercept API calls and simulate network error
    await context.route('**/api/auth/register', route => {
      route.abort('failed');
    });
    
    // Try to register
    await authPage.register(
      'test@example.com',
      'ValidPass123!',
      'Test User'
    );
    
    // Verify error handling
    await authPage.expectError('Network error. Please try again.');
    await expect(page).toHaveURL('/auth');
  });
  
  test('should handle server errors gracefully', async ({ page, context }) => {
    // Intercept API calls and return 500 error
    await context.route('**/api/auth/register', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to register
    await authPage.register(
      'test@example.com',
      'ValidPass123!',
      'Test User'
    );
    
    // Verify error handling
    await authPage.expectError('Something went wrong. Please try again later.');
    await expect(page).toHaveURL('/auth');
  });
  
  test('should be accessible', async ({ page }) => {
    const { injectAxe, checkA11y } = await import('@axe-core/playwright');
    
    await authPage.switchToSignUp();
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('should work with keyboard navigation', async ({ page }) => {
    await authPage.switchToSignUp();
    
    // Tab through form fields
    await page.keyboard.press('Tab'); // Focus email
    await page.keyboard.type('test@example.com');
    
    await page.keyboard.press('Tab'); // Focus password
    await page.keyboard.type('ValidPass123!');
    
    await page.keyboard.press('Tab'); // Focus display name
    await page.keyboard.type('Test User');
    
    await page.keyboard.press('Tab'); // Focus submit button
    await page.keyboard.press('Enter'); // Submit form
    
    // Verify successful registration
    await authPage.expectSuccessfulAuth();
  });
  
  test('should show password when toggle is clicked', async ({ page }) => {
    await authPage.switchToSignUp();
    
    // Type password
    await authPage.passwordInput.fill('MyPassword123!');
    
    // Verify password is hidden
    await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
    
    // Click show password toggle
    const toggleButton = page.getByRole('button', { name: /show password/i });
    await toggleButton.click();
    
    // Verify password is visible
    await expect(authPage.passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleButton.click();
    await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
  });
});
import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { HomePage } from '../../pages/home.page';
import { TestDataManager } from '../../utils/test-data-manager';

test.describe('User Login', () => {
  let authPage: AuthPage;
  let homePage: HomePage;
  let testDataManager: TestDataManager;
  let testUser: any;
  
  test.beforeAll(async () => {
    // Create a test user for all login tests
    testDataManager = new TestDataManager();
    testUser = await testDataManager.createTestUser({
      email: 'test-login@example.com',
      password: 'TestPass123!',
      displayName: 'Login Test User'
    });
  });
  
  test.afterAll(async () => {
    await testDataManager.cleanupTestData();
    await testDataManager.dispose();
  });
  
  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    homePage = new HomePage(page);
    await authPage.goto();
  });
  
  test('should successfully login with valid credentials', async ({ page }) => {
    // Act
    await authPage.login(testUser.email, testUser.password);
    
    // Assert
    await authPage.expectSuccessfulAuth();
    await expect(page).toHaveURL('/');
    
    // Verify user info is displayed
    const userMenu = page.getByRole('button', { name: /user menu/i });
    await userMenu.click();
    await expect(page.getByText(testUser.displayName)).toBeVisible();
  });
  
  test('should show error for invalid password', async ({ page }) => {
    // Act
    await authPage.login(testUser.email, 'WrongPassword123!');
    
    // Assert
    await authPage.expectError('Invalid email or password');
    await expect(page).toHaveURL('/auth');
  });
  
  test('should show error for non-existent email', async ({ page }) => {
    // Act
    await authPage.login('nonexistent@example.com', 'AnyPass123!');
    
    // Assert
    await authPage.expectError('Invalid email or password');
    await expect(page).toHaveURL('/auth');
  });
  
  test('should redirect to requested page after login', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/admin');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL('/auth?redirect=/admin');
    
    // Login
    await authPage.login(testUser.email, testUser.password);
    
    // Should be redirected back to admin (or home if not admin)
    await expect(page).toHaveURL(/\/(admin|$)/);
  });
  
  test('should handle session expiration', async ({ page, context }) => {
    // Login first
    await authPage.login(testUser.email, testUser.password);
    await authPage.expectSuccessfulAuth();
    
    // Clear cookies to simulate session expiration
    await context.clearCookies();
    
    // Try to access protected content
    await page.goto('/');
    await page.reload();
    
    // Should show logged out state
    await authPage.expectLoggedOut();
  });
  
  test('should prevent multiple failed login attempts', async ({ page }) => {
    // Try to login multiple times with wrong password
    for (let i = 0; i < 3; i++) {
      await authPage.login(testUser.email, 'WrongPassword123!');
      await page.waitForTimeout(100); // Small delay between attempts
    }
    
    // After 3 attempts, should see rate limit message
    await authPage.expectError(/Too many attempts|Please try again later/);
  });
  
  test('should maintain email after failed login attempt', async ({ page }) => {
    const email = testUser.email;
    
    // Try to login with wrong password
    await authPage.login(email, 'WrongPassword123!');
    
    // Email should still be in the field
    await expect(authPage.emailInput).toHaveValue(email);
    
    // Password should be cleared
    await expect(authPage.passwordInput).toHaveValue('');
  });
  
  test('should work with Enter key submission', async ({ page }) => {
    await authPage.switchToSignIn();
    
    // Fill credentials
    await authPage.emailInput.fill(testUser.email);
    await authPage.passwordInput.fill(testUser.password);
    
    // Press Enter instead of clicking submit
    await authPage.passwordInput.press('Enter');
    
    // Should successfully login
    await authPage.expectSuccessfulAuth();
  });
  
  test('should show loading state during login', async ({ page }) => {
    // Slow down the API response
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Start login
    const loginPromise = authPage.login(testUser.email, testUser.password);
    
    // Submit button should show loading state
    await expect(authPage.submitButton).toContainText(/Signing in|Loading/);
    await expect(authPage.submitButton).toBeDisabled();
    
    // Wait for login to complete
    await loginPromise;
  });
  
  test('should handle network timeouts', async ({ page, context }) => {
    // Set up route to timeout
    await context.route('**/api/auth/login', async route => {
      // Don't respond, causing a timeout
      await new Promise(() => {}); // Never resolves
    });
    
    // Set shorter timeout for the test
    page.setDefaultTimeout(5000);
    
    // Try to login
    await authPage.login(testUser.email, testUser.password);
    
    // Should show timeout error
    await authPage.expectError(/Request timed out|Network error/);
  });
  
  test('should be accessible', async ({ page }) => {
    const { injectAxe, checkA11y } = await import('@axe-core/playwright');
    
    await authPage.switchToSignIn();
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await authPage.login(testUser.email, testUser.password);
    await authPage.expectSuccessfulAuth();
    
    // Logout
    await authPage.logout();
    
    // Verify logged out state
    await authPage.expectLoggedOut();
    await expect(page).toHaveURL('/');
    
    // Try to access protected route
    await page.goto('/admin');
    await expect(page).toHaveURL('/auth?redirect=/admin');
  });
});
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { PetDetailsPage } from '../../pages/pet-details.page';
import { AuthPage } from '../../pages/auth.page';
import { TestDataManager } from '../../utils/test-data-manager';

test.describe('Pet Adoption Inquiry', () => {
  let homePage: HomePage;
  let petDetailsPage: PetDetailsPage;
  let authPage: AuthPage;
  let testDataManager: TestDataManager;
  let testUser: any;
  let testPet: any;
  
  test.beforeAll(async () => {
    testDataManager = new TestDataManager();
    
    // Create test user and pet
    testUser = await testDataManager.createTestUser({
      email: 'test-inquirer@example.com',
      password: 'TestPass123!',
      displayName: 'Test Inquirer'
    });
    
    testPet = await testDataManager.createTestPet({
      name: 'Test Inquiry Pet',
      breed: 'Friendly Breed',
      status: 'available'
    });
  });
  
  test.afterAll(async () => {
    await testDataManager.cleanupTestData();
    await testDataManager.dispose();
  });
  
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    petDetailsPage = new PetDetailsPage(page);
    authPage = new AuthPage(page);
  });
  
  test('should require login to submit inquiry', async ({ page }) => {
    // Navigate to pet details as guest
    await petDetailsPage.goto(testPet.id);
    
    // Try to inquire
    await petDetailsPage.expectRequiresLogin();
    
    // Should be redirected to auth with return URL
    await expect(page).toHaveURL(/\/auth\?redirect=.*pets/);
  });
  
  test('should successfully submit inquiry when logged in', async ({ page }) => {
    // Login first
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    
    // Navigate to pet details
    await petDetailsPage.goto(testPet.id);
    
    // Submit inquiry
    const inquiryMessage = 'I am very interested in adopting this wonderful pet!';
    await petDetailsPage.submitInquiry(inquiryMessage);
    
    // Verify success
    await petDetailsPage.expectInquirySubmitted();
  });
  
  test('should prevent duplicate inquiries', async ({ page }) => {
    // Login
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    
    // Navigate to pet and submit first inquiry
    await petDetailsPage.goto(testPet.id);
    await petDetailsPage.submitInquiry('First inquiry');
    await petDetailsPage.expectInquirySubmitted();
    
    // Refresh page and try to inquire again
    await page.reload();
    
    // Button should be disabled
    await expect(petDetailsPage.inquireButton).toBeDisabled();
    await expect(petDetailsPage.inquireButton).toContainText(/Already Submitted|Inquiry Sent/);
  });
  
  test('should validate inquiry message', async ({ page }) => {
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(testPet.id);
    
    // Open inquiry form
    await petDetailsPage.openInquiryForm();
    
    // Try to submit empty message
    await petDetailsPage.submitInquiryButton.click();
    
    // Should show validation error
    await petDetailsPage.expectFieldError('Message', 'Message is required');
  });
  
  test('should pre-fill contact information for logged in user', async ({ page }) => {
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(testPet.id);
    
    // Open inquiry form
    await petDetailsPage.openInquiryForm();
    
    // Contact info should be pre-filled
    const emailField = page.getByLabel('Email');
    const nameField = page.getByLabel('Name');
    
    await expect(emailField).toHaveValue(testUser.email);
    await expect(nameField).toHaveValue(testUser.displayName);
    
    // Fields should be readonly
    await expect(emailField).toBeDisabled();
    await expect(nameField).toBeDisabled();
  });
  
  test('should handle inquiry for unavailable pets', async ({ page }) => {
    // Create adopted pet
    const adoptedPet = await testDataManager.createTestPet({
      name: 'Adopted Pet',
      status: 'adopted'
    });
    
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(adoptedPet.id);
    
    // Inquiry button should be disabled
    await petDetailsPage.expectNotAvailable();
  });
  
  test('should show inquiry confirmation details', async ({ page }) => {
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(testPet.id);
    
    const inquiryMessage = 'Detailed inquiry about adoption process and requirements.';
    await petDetailsPage.submitInquiry(inquiryMessage);
    
    // Should show confirmation with details
    await petDetailsPage.expectToast('Inquiry submitted successfully');
    
    // Should show inquiry reference or confirmation number
    const confirmation = page.getByText(/Reference|Confirmation/);
    await expect(confirmation).toBeVisible();
  });
  
  test('should handle server errors gracefully', async ({ page, context }) => {
    // Mock server error
    await context.route('**/api/inquiries', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(testPet.id);
    
    await petDetailsPage.submitInquiry('Test message');
    
    // Should show error message
    await petDetailsPage.expectToast(/Error.*try again/);
  });
  
  test('should handle network timeouts', async ({ page, context }) => {
    // Mock slow network
    await context.route('**/api/inquiries', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000)); // Longer than timeout
      await route.continue();
    });
    
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(testPet.id);
    
    await petDetailsPage.submitInquiry('Test message');
    
    // Should show timeout message
    await petDetailsPage.expectToast(/timeout|network error/i);
  });
  
  test('should be accessible', async ({ page }) => {
    const { injectAxe, checkA11y } = await import('@axe-core/playwright');
    
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(testPet.id);
    await petDetailsPage.openInquiryForm();
    
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('should work with keyboard navigation', async ({ page }) => {
    await authPage.goto();
    await authPage.login(testUser.email, testUser.password);
    await petDetailsPage.goto(testPet.id);
    
    // Tab to inquiry button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Find the inquiry button and press Enter
    const inquireButton = petDetailsPage.inquireButton;
    await inquireButton.focus();
    await page.keyboard.press('Enter');
    
    // Form should open
    await expect(petDetailsPage.inquiryForm).toBeVisible();
    
    // Tab to message field and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard navigation inquiry');
    
    // Tab to submit and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should submit successfully
    await petDetailsPage.expectInquirySubmitted();
  });
});
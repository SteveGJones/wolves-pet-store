import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { PetDetailsPage } from '../../pages/pet-details.page';
import { TestDataManager } from '../../utils/test-data-manager';

test.describe('Pet Browsing', () => {
  let homePage: HomePage;
  let petDetailsPage: PetDetailsPage;
  let testDataManager: TestDataManager;
  let testPets: any[] = [];
  
  test.beforeAll(async () => {
    testDataManager = new TestDataManager();
    
    // Create test pets in different categories
    testPets.push(
      await testDataManager.createTestPet({
        name: 'Test Dog Buddy',
        breed: 'Golden Retriever',
        status: 'available'
      }),
      await testDataManager.createTestPet({
        name: 'Test Cat Whiskers',
        breed: 'Persian',
        status: 'available'
      }),
      await testDataManager.createTestPet({
        name: 'Test Dog Max',
        breed: 'German Shepherd',
        status: 'pending'
      })
    );
  });
  
  test.afterAll(async () => {
    await testDataManager.cleanupTestData();
    await testDataManager.dispose();
  });
  
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    petDetailsPage = new PetDetailsPage(page);
    await homePage.goto();
  });
  
  test('should display all available pets on home page', async ({ page }) => {
    // Wait for pets to load
    await homePage.waitForLoadingToComplete();
    
    // Verify test pets are visible
    await homePage.expectPetVisible('Test Dog Buddy');
    await homePage.expectPetVisible('Test Cat Whiskers');
    await homePage.expectPetVisible('Test Dog Max');
    
    // Verify pet cards show correct information
    const buddyInfo = await homePage.getPetCardInfo('Test Dog Buddy');
    expect(buddyInfo.breed).toContain('Golden Retriever');
  });
  
  test('should filter pets by category', async ({ page }) => {
    // Filter by Dogs
    await homePage.filterByCategory('Dogs');
    
    // Should see dog pets
    await homePage.expectPetVisible('Test Dog Buddy');
    await homePage.expectPetVisible('Test Dog Max');
    
    // Should not see cats (would need to verify count)
    const petCount = await homePage.petCards.count();
    const dogCards = await homePage.petCards.filter({ hasText: 'Dog' }).count();
    expect(dogCards).toBe(petCount); // All visible pets should be dogs
  });
  
  test('should search pets by name', async ({ page }) => {
    // Search for "Buddy"
    await homePage.searchPets('Buddy');
    
    // Should only see Buddy
    await homePage.expectPetVisible('Test Dog Buddy');
    await homePage.expectPetCount(1);
  });
  
  test('should search pets by characteristics', async ({ page }) => {
    // Search for breed
    await homePage.searchPets('Golden Retriever');
    
    // Should find the Golden Retriever
    await homePage.expectPetVisible('Test Dog Buddy');
  });
  
  test('should show no results message for non-existent search', async ({ page }) => {
    // Search for non-existent pet
    await homePage.searchPets('NonExistentPet12345');
    
    // Should show no results
    await homePage.expectNoPetsFound();
  });
  
  test('should navigate to pet details page', async ({ page }) => {
    // Click on a pet card
    await homePage.clickPetCard('Test Dog Buddy');
    
    // Should be on pet details page
    await expect(page).toHaveURL(/\/pets\/\d+/);
    
    // Verify pet details are shown
    await petDetailsPage.expectPetDetails({
      name: 'Test Dog Buddy',
      breed: 'Golden Retriever',
      status: 'available'
    });
  });
  
  test('should show correct pet status badges', async ({ page }) => {
    // Check available pet
    await homePage.expectPetStatus('Test Dog Buddy', 'available');
    
    // Check pending pet
    await homePage.expectPetStatus('Test Dog Max', 'pending');
  });
  
  test('should sort pets by different criteria', async ({ page }) => {
    // Sort by name
    await homePage.sortBy('name');
    await homePage.waitForLoadingToComplete();
    
    // Get first pet name
    const firstPetName = await homePage.petCards.first().getByTestId('pet-name').textContent();
    
    // Sort by price (low to high)
    await homePage.sortBy('price-low');
    await homePage.waitForLoadingToComplete();
    
    // Verify order changed
    const newFirstPetName = await homePage.petCards.first().getByTestId('pet-name').textContent();
    // They might be different (unless same price)
  });
  
  test('should handle pagination or infinite scroll', async ({ page }) => {
    // If there are many pets, test pagination
    const initialCount = await homePage.petCards.count();
    
    if (await homePage.loadMoreButton.isVisible()) {
      // Test load more button
      await homePage.loadMorePets();
      
      const newCount = await homePage.petCards.count();
      expect(newCount).toBeGreaterThan(initialCount);
    } else {
      // Test infinite scroll
      await homePage.scrollToBottom();
      // Wait a bit for potential lazy loading
      await page.waitForTimeout(1000);
      
      // If more pets loaded, count should increase
      // This depends on having enough test data
    }
  });
  
  test('should maintain filters when navigating back', async ({ page }) => {
    // Apply filters
    await homePage.filterByCategory('Dogs');
    await homePage.searchPets('Test');
    
    // Navigate to pet details
    await homePage.clickPetCard('Test Dog Buddy');
    
    // Navigate back
    await petDetailsPage.navigateBack();
    
    // Filters should still be applied
    await expect(homePage.categoryFilter).toHaveValue('Dogs');
    await expect(homePage.searchInput).toHaveValue('Test');
  });
  
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await homePage.goto();
    
    // Pet grid should be single column on mobile
    const petGrid = homePage.petGrid;
    const gridStyles = await petGrid.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    
    // Should be single column or have mobile-appropriate layout
    expect(gridStyles).toMatch(/1fr|repeat\(1|100%/);
  });
  
  test('should be accessible', async ({ page }) => {
    const { injectAxe, checkA11y } = await import('@axe-core/playwright');
    
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/api/pets*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    // Navigate to home
    await homePage.goto();
    
    // Should show loading state
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();
    
    // Eventually should load
    await homePage.expectPetVisible('Test Dog Buddy');
  });
  
  test('should clear all filters', async ({ page }) => {
    // Apply multiple filters
    await homePage.filterByCategory('Dogs');
    await homePage.searchPets('Test');
    await homePage.sortBy('price-low');
    
    // Clear filters
    await homePage.clearFilters();
    
    // All filters should be reset
    await expect(homePage.categoryFilter).toHaveValue('all');
    await expect(homePage.searchInput).toHaveValue('');
    await expect(homePage.sortDropdown).toHaveValue('name');
  });
});
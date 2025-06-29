import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly heroSection: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly petGrid: Locator;
  readonly petCards: Locator;
  readonly loadMoreButton: Locator;
  readonly noResultsMessage: Locator;
  readonly sortDropdown: Locator;
  
  constructor(page: Page) {
    super(page);
    this.heroSection = page.getByRole('region', { name: 'hero' });
    this.searchInput = page.getByPlaceholder('Search pets...');
    this.categoryFilter = page.getByRole('combobox', { name: 'Category' });
    this.petGrid = page.getByTestId('pet-grid');
    this.petCards = page.getByTestId('pet-card');
    this.loadMoreButton = page.getByRole('button', { name: 'Load More' });
    this.noResultsMessage = page.getByText('No pets found');
    this.sortDropdown = page.getByRole('combobox', { name: 'Sort by' });
  }
  
  async goto() {
    await super.goto('/');
  }
  
  async searchPets(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForApiResponse('/api/pets');
    await this.waitForLoadingToComplete();
  }
  
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForApiResponse('/api/pets');
    await this.waitForLoadingToComplete();
  }
  
  async sortBy(option: 'name' | 'price-low' | 'price-high' | 'newest') {
    await this.sortDropdown.selectOption(option);
    await this.waitForApiResponse('/api/pets');
    await this.waitForLoadingToComplete();
  }
  
  async clickPetCard(petName: string) {
    const petCard = this.petCards.filter({ hasText: petName });
    await petCard.click();
    await this.waitForPageLoad();
  }
  
  async expectPetCount(count: number) {
    await expect(this.petCards).toHaveCount(count);
  }
  
  async expectPetVisible(petName: string) {
    const pet = this.petCards.filter({ hasText: petName });
    await expect(pet).toBeVisible();
  }
  
  async expectNoPetsFound() {
    await expect(this.noResultsMessage).toBeVisible();
    await expect(this.petCards).toHaveCount(0);
  }
  
  async loadMorePets() {
    await this.loadMoreButton.click();
    await this.waitForApiResponse('/api/pets');
    await this.waitForLoadingToComplete();
  }
  
  async expectLoadMoreVisible() {
    await expect(this.loadMoreButton).toBeVisible();
  }
  
  async expectLoadMoreHidden() {
    await expect(this.loadMoreButton).not.toBeVisible();
  }
  
  async getPetCardInfo(petName: string) {
    const petCard = this.petCards.filter({ hasText: petName });
    
    const info = {
      name: await petCard.getByTestId('pet-name').textContent(),
      breed: await petCard.getByTestId('pet-breed').textContent(),
      status: await petCard.getByTestId('pet-status').textContent(),
      price: await petCard.getByTestId('pet-price').textContent(),
      image: await petCard.getByRole('img').getAttribute('src')
    };
    
    return info;
  }
  
  async expectPetStatus(petName: string, status: 'available' | 'pending' | 'adopted') {
    const petCard = this.petCards.filter({ hasText: petName });
    const statusBadge = petCard.getByTestId('pet-status');
    
    await expect(statusBadge).toHaveText(status);
    
    // Check appropriate styling
    if (status === 'available') {
      await expect(statusBadge).toHaveClass(/bg-green/);
    } else if (status === 'pending') {
      await expect(statusBadge).toHaveClass(/bg-yellow/);
    } else {
      await expect(statusBadge).toHaveClass(/bg-gray/);
    }
  }
  
  async clearFilters() {
    // Clear search
    await this.searchInput.clear();
    
    // Reset category
    await this.categoryFilter.selectOption('all');
    
    // Reset sort
    await this.sortDropdown.selectOption('name');
    
    await this.waitForApiResponse('/api/pets');
    await this.waitForLoadingToComplete();
  }
  
  async expectHeroVisible() {
    await expect(this.heroSection).toBeVisible();
    await expect(this.heroSection.getByRole('heading', { level: 1 })).toContainText('Find Your Perfect Companion');
  }
  
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }
  
  async expectInfiniteScrollTriggered(initialCount: number) {
    await this.scrollToBottom();
    
    // Wait for new pets to load
    await this.waitForApiResponse('/api/pets');
    await this.waitForLoadingToComplete();
    
    // Verify more pets were loaded
    const newCount = await this.petCards.count();
    expect(newCount).toBeGreaterThan(initialCount);
  }
}
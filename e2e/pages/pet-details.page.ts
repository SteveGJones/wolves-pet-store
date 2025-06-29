import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class PetDetailsPage extends BasePage {
  readonly petName: Locator;
  readonly petBreed: Locator;
  readonly petAge: Locator;
  readonly petGender: Locator;
  readonly petSize: Locator;
  readonly petDescription: Locator;
  readonly petTemperament: Locator;
  readonly adoptionFee: Locator;
  readonly statusBadge: Locator;
  readonly mainImage: Locator;
  readonly imageThumbnails: Locator;
  readonly inquireButton: Locator;
  readonly addToWishlistButton: Locator;
  readonly medicalInfo: Locator;
  readonly inquiryForm: Locator;
  readonly messageTextarea: Locator;
  readonly submitInquiryButton: Locator;
  readonly backButton: Locator;
  
  constructor(page: Page) {
    super(page);
    this.petName = page.getByRole('heading', { level: 1 });
    this.petBreed = page.getByTestId('pet-breed');
    this.petAge = page.getByTestId('pet-age');
    this.petGender = page.getByTestId('pet-gender');
    this.petSize = page.getByTestId('pet-size');
    this.petDescription = page.getByTestId('pet-description');
    this.petTemperament = page.getByTestId('pet-temperament');
    this.adoptionFee = page.getByTestId('adoption-fee');
    this.statusBadge = page.getByTestId('pet-status');
    this.mainImage = page.getByTestId('main-pet-image');
    this.imageThumbnails = page.getByTestId('image-thumbnail');
    this.inquireButton = page.getByRole('button', { name: /Inquire About Adoption/i });
    this.addToWishlistButton = page.getByRole('button', { name: /Add to Wishlist/i });
    this.medicalInfo = page.getByTestId('medical-info');
    this.inquiryForm = page.getByTestId('inquiry-form');
    this.messageTextarea = page.getByLabel('Message');
    this.submitInquiryButton = page.getByRole('button', { name: /Submit Inquiry/i });
    this.backButton = page.getByRole('link', { name: /Back to Pets/i });
  }
  
  async goto(petId: number) {
    await super.goto(`/pets/${petId}`);
  }
  
  async expectPetDetails(expected: {
    name: string;
    breed?: string;
    status?: 'available' | 'pending' | 'adopted';
  }) {
    await expect(this.petName).toContainText(expected.name);
    
    if (expected.breed) {
      await expect(this.petBreed).toContainText(expected.breed);
    }
    
    if (expected.status) {
      await expect(this.statusBadge).toHaveText(expected.status);
    }
  }
  
  async selectThumbnail(index: number) {
    const thumbnail = this.imageThumbnails.nth(index);
    await thumbnail.click();
    
    // Wait for main image to update
    await this.page.waitForTimeout(300);
  }
  
  async expectMainImageSrc(src: string | RegExp) {
    await expect(this.mainImage).toHaveAttribute('src', src);
  }
  
  async openInquiryForm() {
    await this.inquireButton.click();
    await expect(this.inquiryForm).toBeVisible();
  }
  
  async submitInquiry(message: string) {
    await this.openInquiryForm();
    await this.messageTextarea.fill(message);
    await this.submitInquiryButton.click();
    
    // Wait for API response
    await this.waitForApiResponse('/api/inquiries');
  }
  
  async expectInquirySubmitted() {
    await this.expectToast('Inquiry submitted successfully');
    
    // Button should now be disabled or show different text
    await expect(this.inquireButton).toContainText(/Inquiry Submitted/i);
    await expect(this.inquireButton).toBeDisabled();
  }
  
  async addToWishlist() {
    await this.addToWishlistButton.click();
    await this.waitForApiResponse('/api/wishlists');
  }
  
  async expectInWishlist() {
    await expect(this.addToWishlistButton).toContainText(/Remove from Wishlist/i);
  }
  
  async expectNotAvailable() {
    await expect(this.statusBadge).not.toHaveText('available');
    await expect(this.inquireButton).toBeDisabled();
  }
  
  async expectMedicalInfo(info: {
    neutered?: boolean;
    vaccinated?: boolean;
  }) {
    if (info.neutered !== undefined) {
      const neuteredText = info.neutered ? 'Neutered/Spayed' : 'Not neutered';
      await expect(this.medicalInfo).toContainText(neuteredText);
    }
    
    if (info.vaccinated !== undefined) {
      const vaccinatedText = info.vaccinated ? 'Vaccinated' : 'Not vaccinated';
      await expect(this.medicalInfo).toContainText(vaccinatedText);
    }
  }
  
  async navigateBack() {
    await this.backButton.click();
    await this.waitForPageLoad();
  }
  
  async expectRequiresLogin() {
    await this.inquireButton.click();
    
    // Should redirect to auth page
    await expect(this.page).toHaveURL(/\/auth\?redirect=/);
  }
  
  async shareViaButton(platform: 'facebook' | 'twitter' | 'email') {
    const shareButton = this.page.getByRole('button', { name: new RegExp(`Share.*${platform}`, 'i') });
    
    // Most share buttons open new windows/tabs
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      shareButton.click()
    ]);
    
    // Verify the share URL contains expected domain
    if (platform === 'facebook') {
      await expect(newPage).toHaveURL(/facebook\.com/);
    } else if (platform === 'twitter') {
      await expect(newPage).toHaveURL(/twitter\.com|x\.com/);
    }
    
    await newPage.close();
  }
  
  async expectImageGallery(imageCount: number) {
    await expect(this.imageThumbnails).toHaveCount(imageCount);
    
    // Test keyboard navigation
    await this.mainImage.focus();
    await this.page.keyboard.press('ArrowRight');
    
    // Verify image changed
    const initialSrc = await this.mainImage.getAttribute('src');
    await this.page.keyboard.press('ArrowRight');
    const newSrc = await this.mainImage.getAttribute('src');
    
    expect(initialSrc).not.toBe(newSrc);
  }
}
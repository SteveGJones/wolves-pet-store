import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminPage extends BasePage {
  readonly dashboardHeading: Locator;
  readonly petsTab: Locator;
  readonly inquiriesTab: Locator;
  readonly usersTab: Locator;
  readonly addPetButton: Locator;
  readonly petTable: Locator;
  readonly inquiryTable: Locator;
  readonly petForm: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly exportButton: Locator;
  
  constructor(page: Page) {
    super(page);
    this.dashboardHeading = page.getByRole('heading', { name: /Admin Dashboard/i });
    this.petsTab = page.getByRole('tab', { name: 'Pets' });
    this.inquiriesTab = page.getByRole('tab', { name: 'Inquiries' });
    this.usersTab = page.getByRole('tab', { name: 'Users' });
    this.addPetButton = page.getByRole('button', { name: 'Add Pet' });
    this.petTable = page.getByTestId('pets-table');
    this.inquiryTable = page.getByTestId('inquiries-table');
    this.petForm = page.getByTestId('pet-form');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.deleteButton = page.getByRole('button', { name: 'Delete' });
    this.confirmDeleteButton = page.getByRole('button', { name: 'Confirm Delete' });
    this.searchInput = page.getByPlaceholder('Search...');
    this.statusFilter = page.getByRole('combobox', { name: 'Status' });
    this.exportButton = page.getByRole('button', { name: 'Export' });
  }
  
  async goto() {
    await super.goto('/admin');
  }
  
  async expectAdminDashboard() {
    await expect(this.dashboardHeading).toBeVisible();
    await expect(this.petsTab).toBeVisible();
    await expect(this.inquiriesTab).toBeVisible();
  }
  
  async expectAccessDenied() {
    await expect(this.page.getByText(/Access denied|Unauthorized/i)).toBeVisible();
  }
  
  async switchToPetsTab() {
    await this.petsTab.click();
    await expect(this.petTable).toBeVisible();
  }
  
  async switchToInquiriesTab() {
    await this.inquiriesTab.click();
    await expect(this.inquiryTable).toBeVisible();
  }
  
  async switchToUsersTab() {
    await this.usersTab.click();
    await expect(this.page.getByTestId('users-table')).toBeVisible();
  }
  
  async addNewPet(petData: {
    name: string;
    breed: string;
    age: string;
    size: string;
    gender: string;
    color: string;
    description: string;
    temperament: string;
    adoptionFee: string;
    category: string;
  }) {
    await this.switchToPetsTab();
    await this.addPetButton.click();
    
    await expect(this.petForm).toBeVisible();
    
    // Fill form fields
    await this.page.getByLabel('Name').fill(petData.name);
    await this.page.getByLabel('Breed').fill(petData.breed);
    await this.page.getByLabel('Age').selectOption(petData.age);
    await this.page.getByLabel('Size').selectOption(petData.size);
    await this.page.getByLabel('Gender').selectOption(petData.gender);
    await this.page.getByLabel('Color').fill(petData.color);
    await this.page.getByLabel('Description').fill(petData.description);
    await this.page.getByLabel('Temperament').fill(petData.temperament);
    await this.page.getByLabel('Adoption Fee').fill(petData.adoptionFee);
    await this.page.getByLabel('Category').selectOption(petData.category);
    
    await this.saveButton.click();
    
    // Wait for save completion
    await this.waitForApiResponse('/api/admin/pets');
  }
  
  async editPet(petName: string, updates: Record<string, string>) {
    await this.switchToPetsTab();
    
    // Find pet row and click edit
    const petRow = this.petTable.getByRole('row').filter({ hasText: petName });
    const editButton = petRow.getByRole('button', { name: 'Edit' });
    await editButton.click();
    
    await expect(this.petForm).toBeVisible();
    
    // Update fields
    for (const [field, value] of Object.entries(updates)) {
      const input = this.page.getByLabel(field);
      await input.clear();
      await input.fill(value);
    }
    
    await this.saveButton.click();
    await this.waitForApiResponse('/api/admin/pets');
  }
  
  async deletePet(petName: string) {
    await this.switchToPetsTab();
    
    const petRow = this.petTable.getByRole('row').filter({ hasText: petName });
    const deleteButton = petRow.getByRole('button', { name: 'Delete' });
    await deleteButton.click();
    
    // Confirm deletion
    await expect(this.confirmDeleteButton).toBeVisible();
    await this.confirmDeleteButton.click();
    
    await this.waitForApiResponse('/api/admin/pets');
  }
  
  async updatePetStatus(petName: string, status: 'available' | 'pending' | 'adopted') {
    await this.switchToPetsTab();
    
    const petRow = this.petTable.getByRole('row').filter({ hasText: petName });
    const statusDropdown = petRow.getByRole('combobox', { name: 'Status' });
    await statusDropdown.selectOption(status);
    
    // Auto-save or click save button
    await this.waitForApiResponse('/api/admin/pets');
  }
  
  async searchPets(query: string) {
    await this.switchToPetsTab();
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    
    await this.waitForApiResponse('/api/admin/pets');
  }
  
  async filterPetsByStatus(status: string) {
    await this.switchToPetsTab();
    await this.statusFilter.selectOption(status);
    
    await this.waitForApiResponse('/api/admin/pets');
  }
  
  async expectPetInTable(petName: string) {
    await this.switchToPetsTab();
    const petRow = this.petTable.getByRole('row').filter({ hasText: petName });
    await expect(petRow).toBeVisible();
  }
  
  async expectPetNotInTable(petName: string) {
    await this.switchToPetsTab();
    const petRow = this.petTable.getByRole('row').filter({ hasText: petName });
    await expect(petRow).not.toBeVisible();
  }
  
  async updateInquiryStatus(inquiryId: string, status: 'pending' | 'contacted' | 'approved' | 'rejected') {
    await this.switchToInquiriesTab();
    
    const inquiryRow = this.inquiryTable.getByTestId(`inquiry-${inquiryId}`);
    const statusDropdown = inquiryRow.getByRole('combobox', { name: 'Status' });
    await statusDropdown.selectOption(status);
    
    await this.waitForApiResponse('/api/admin/inquiries');
  }
  
  async addNoteToInquiry(inquiryId: string, note: string) {
    await this.switchToInquiriesTab();
    
    const inquiryRow = this.inquiryTable.getByTestId(`inquiry-${inquiryId}`);
    const addNoteButton = inquiryRow.getByRole('button', { name: 'Add Note' });
    await addNoteButton.click();
    
    const noteTextarea = this.page.getByLabel('Note');
    await noteTextarea.fill(note);
    
    const saveNoteButton = this.page.getByRole('button', { name: 'Save Note' });
    await saveNoteButton.click();
    
    await this.waitForApiResponse('/api/admin/inquiries');
  }
  
  async expectInquiryDetails(inquiryId: string, expected: {
    petName?: string;
    userEmail?: string;
    status?: string;
    message?: string;
  }) {
    await this.switchToInquiriesTab();
    
    const inquiryRow = this.inquiryTable.getByTestId(`inquiry-${inquiryId}`);
    
    if (expected.petName) {
      await expect(inquiryRow).toContainText(expected.petName);
    }
    
    if (expected.userEmail) {
      await expect(inquiryRow).toContainText(expected.userEmail);
    }
    
    if (expected.status) {
      const statusBadge = inquiryRow.getByTestId('inquiry-status');
      await expect(statusBadge).toHaveText(expected.status);
    }
    
    if (expected.message) {
      // Click to expand details
      const expandButton = inquiryRow.getByRole('button', { name: 'View Details' });
      await expandButton.click();
      await expect(this.page.getByText(expected.message)).toBeVisible();
    }
  }
  
  async exportData(type: 'pets' | 'inquiries' | 'users') {
    if (type === 'pets') {
      await this.switchToPetsTab();
    } else if (type === 'inquiries') {
      await this.switchToInquiriesTab();
    } else {
      await this.switchToUsersTab();
    }
    
    // Start download
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportButton.click()
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(new RegExp(`${type}.*\\.csv`));
    return download;
  }
  
  async uploadPetImages(petName: string, imagePaths: string[]) {
    await this.switchToPetsTab();
    
    const petRow = this.petTable.getByRole('row').filter({ hasText: petName });
    const editButton = petRow.getByRole('button', { name: 'Edit' });
    await editButton.click();
    
    const imageUpload = this.page.getByLabel('Images');
    await imageUpload.setInputFiles(imagePaths);
    
    await this.saveButton.click();
    await this.waitForApiResponse('/api/admin/pets');
  }
  
  async expectValidationError(field: string, message: string) {
    const fieldError = this.page.getByLabel(field).locator('..').getByText(message);
    await expect(fieldError).toBeVisible();
  }
  
  async expectTotalCounts(expected: {
    pets?: number;
    inquiries?: number;
    users?: number;
  }) {
    // Check dashboard summary cards
    if (expected.pets !== undefined) {
      const petsCount = this.page.getByTestId('total-pets-count');
      await expect(petsCount).toContainText(expected.pets.toString());
    }
    
    if (expected.inquiries !== undefined) {
      const inquiriesCount = this.page.getByTestId('total-inquiries-count');
      await expect(inquiriesCount).toContainText(expected.inquiries.toString());
    }
    
    if (expected.users !== undefined) {
      const usersCount = this.page.getByTestId('total-users-count');
      await expect(usersCount).toContainText(expected.users.toString());
    }
  }
}
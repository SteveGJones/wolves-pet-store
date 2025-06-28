import {
  users,
  petCategories,
  pets,
  products,
  inquiries,
  wishlists,
  type User,
  type UpsertUser,
  type PetCategory,
  type InsertPetCategory,
  type Pet,
  type InsertPet,
  type Product,
  type InsertProduct,
  type Inquiry,
  type InsertInquiry,
  type Wishlist,
  type InsertWishlist,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Pet category operations
  getPetCategories(): Promise<PetCategory[]>;
  createPetCategory(category: InsertPetCategory): Promise<PetCategory>;

  // Pet operations
  getPets(filters?: {
    categoryId?: number;
    age?: string;
    size?: string;
    status?: string;
    search?: string;
  }): Promise<Pet[]>;
  getPet(id: number): Promise<Pet | undefined>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet>;
  deletePet(id: number): Promise<void>;
  getPetsWithCategory(): Promise<(Pet & { category: PetCategory })[]>;

  // Product operations
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Inquiry operations
  getInquiries(): Promise<(Inquiry & { pet?: Pet })[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, updates: Partial<Inquiry>): Promise<Inquiry>;

  // Wishlist operations
  getUserWishlist(userId: string): Promise<(Wishlist & { pet: Pet })[]>;
  addToWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, petId: number): Promise<void>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalPets: number;
    adoptedThisMonth: number;
    pendingInquiries: number;
    revenueThisMonth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Pet category operations
  async getPetCategories(): Promise<PetCategory[]> {
    return await db.select().from(petCategories).orderBy(petCategories.name);
  }

  async createPetCategory(category: InsertPetCategory): Promise<PetCategory> {
    const [newCategory] = await db
      .insert(petCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Pet operations
  async getPets(filters: {
    categoryId?: number;
    age?: string;
    size?: string;
    status?: string;
    search?: string;
  } = {}): Promise<Pet[]> {
    let query = db.select().from(pets);

    const conditions = [];

    if (filters.categoryId) {
      conditions.push(eq(pets.categoryId, filters.categoryId));
    }

    if (filters.age) {
      conditions.push(eq(pets.age, filters.age));
    }

    if (filters.size) {
      conditions.push(eq(pets.size, filters.size));
    }

    if (filters.status) {
      conditions.push(eq(pets.status, filters.status));
    }

    if (filters.search) {
      conditions.push(
        sql`(${pets.name} ILIKE ${`%${filters.search}%`} OR ${pets.breed} ILIKE ${`%${filters.search}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(pets.dateAdded));
  }

  async getPet(id: number): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet;
  }

  async createPet(pet: InsertPet): Promise<Pet> {
    const [newPet] = await db.insert(pets).values(pet).returning();
    return newPet;
  }

  async updatePet(id: number, petUpdates: Partial<InsertPet>): Promise<Pet> {
    const [updatedPet] = await db
      .update(pets)
      .set({ ...petUpdates, updatedAt: new Date() })
      .where(eq(pets.id, id))
      .returning();
    return updatedPet;
  }

  async deletePet(id: number): Promise<void> {
    await db.delete(pets).where(eq(pets.id, id));
  }

  async getPetsWithCategory(): Promise<(Pet & { category: PetCategory })[]> {
    return await db
      .select({
        id: pets.id,
        name: pets.name,
        categoryId: pets.categoryId,
        breed: pets.breed,
        age: pets.age,
        size: pets.size,
        gender: pets.gender,
        color: pets.color,
        description: pets.description,
        temperament: pets.temperament,
        medicalHistory: pets.medicalHistory,
        adoptionFee: pets.adoptionFee,
        status: pets.status,
        isNeutered: pets.isNeutered,
        isVaccinated: pets.isVaccinated,
        imageUrls: pets.imageUrls,
        tags: pets.tags,
        dateAdded: pets.dateAdded,
        dateAdopted: pets.dateAdopted,
        createdAt: pets.createdAt,
        updatedAt: pets.updatedAt,
        category: {
          id: petCategories.id,
          name: petCategories.name,
          description: petCategories.description,
          createdAt: petCategories.createdAt,
        },
      })
      .from(pets)
      .leftJoin(petCategories, eq(pets.categoryId, petCategories.id))
      .orderBy(desc(pets.dateAdded));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.name);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Inquiry operations
  async getInquiries(): Promise<(Inquiry & { pet?: Pet })[]> {
    return await db
      .select({
        id: inquiries.id,
        petId: inquiries.petId,
        customerName: inquiries.customerName,
        customerEmail: inquiries.customerEmail,
        customerPhone: inquiries.customerPhone,
        message: inquiries.message,
        status: inquiries.status,
        adminNotes: inquiries.adminNotes,
        createdAt: inquiries.createdAt,
        updatedAt: inquiries.updatedAt,
        pet: {
          id: pets.id,
          name: pets.name,
          breed: pets.breed,
        },
      })
      .from(inquiries)
      .leftJoin(pets, eq(inquiries.petId, pets.id))
      .orderBy(desc(inquiries.createdAt));
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiry(id: number, updates: Partial<Inquiry>): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }

  // Wishlist operations
  async getUserWishlist(userId: string): Promise<(Wishlist & { pet: Pet })[]> {
    return await db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        petId: wishlists.petId,
        createdAt: wishlists.createdAt,
        pet: {
          id: pets.id,
          name: pets.name,
          categoryId: pets.categoryId,
          breed: pets.breed,
          age: pets.age,
          size: pets.size,
          gender: pets.gender,
          color: pets.color,
          description: pets.description,
          temperament: pets.temperament,
          medicalHistory: pets.medicalHistory,
          adoptionFee: pets.adoptionFee,
          status: pets.status,
          isNeutered: pets.isNeutered,
          isVaccinated: pets.isVaccinated,
          imageUrls: pets.imageUrls,
          tags: pets.tags,
          dateAdded: pets.dateAdded,
          dateAdopted: pets.dateAdopted,
          createdAt: pets.createdAt,
          updatedAt: pets.updatedAt,
        },
      })
      .from(wishlists)
      .leftJoin(pets, eq(wishlists.petId, pets.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));
  }

  async addToWishlist(wishlist: InsertWishlist): Promise<Wishlist> {
    const [newWishlist] = await db
      .insert(wishlists)
      .values(wishlist)
      .returning();
    return newWishlist;
  }

  async removeFromWishlist(userId: string, petId: number): Promise<void> {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.petId, petId)));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalPets: number;
    adoptedThisMonth: number;
    pendingInquiries: number;
    revenueThisMonth: number;
  }> {
    const [totalPetsResult] = await db
      .select({ count: count() })
      .from(pets);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [adoptedThisMonthResult] = await db
      .select({ count: count() })
      .from(pets)
      .where(
        and(
          eq(pets.status, "adopted"),
          sql`${pets.dateAdopted} >= ${startOfMonth}`
        )
      );

    const [pendingInquiriesResult] = await db
      .select({ count: count() })
      .from(inquiries)
      .where(eq(inquiries.status, "pending"));

    // Calculate revenue from adopted pets this month
    const [revenueResult] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${pets.adoptionFee}), 0)`,
      })
      .from(pets)
      .where(
        and(
          eq(pets.status, "adopted"),
          sql`${pets.dateAdopted} >= ${startOfMonth}`
        )
      );

    return {
      totalPets: totalPetsResult.count,
      adoptedThisMonth: adoptedThisMonthResult.count,
      pendingInquiries: pendingInquiriesResult.count,
      revenueThisMonth: Number(revenueResult.revenue) || 0,
    };
  }
}

export const storage = new DatabaseStorage();

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (updated for UUID and bcrypt authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // bcrypt hash
  displayName: varchar("display_name"), // User's preferred name
  firstName: varchar("first_name"), // Optional
  lastName: varchar("last_name"), // Optional
  profileImageUrl: varchar("profile_image_url"), // Optional
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pet categories
export const petCategories = pgTable("pet_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pets table
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  categoryId: integer("category_id").notNull(),
  breed: varchar("breed", { length: 100 }),
  age: varchar("age", { length: 50 }),
  size: varchar("size", { length: 20 }),
  gender: varchar("gender", { length: 10 }),
  color: varchar("color", { length: 50 }),
  description: text("description"),
  temperament: text("temperament"),
  medicalHistory: text("medical_history"),
  adoptionFee: decimal("adoption_fee", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).default("available"), // available, pending, adopted
  isNeutered: boolean("is_neutered").default(false),
  isVaccinated: boolean("is_vaccinated").default(false),
  imageUrls: text("image_urls").array(),
  tags: text("tags").array(),
  dateAdded: timestamp("date_added").defaultNow(),
  dateAdopted: timestamp("date_adopted"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pet supplies/products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").default(0),
  imageUrls: text("image_urls").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id"),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, replied, closed
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wishlist/favorites
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  petId: integer("pet_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const petCategoriesRelations = relations(petCategories, ({ many }) => ({
  pets: many(pets),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  category: one(petCategories, {
    fields: [pets.categoryId],
    references: [petCategories.id],
  }),
  inquiries: many(inquiries),
  wishlists: many(wishlists),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  pet: one(pets, {
    fields: [inquiries.petId],
    references: [pets.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  pet: one(pets, {
    fields: [wishlists.petId],
    references: [pets.id],
  }),
}));

// Create insert schemas
export const insertPetCategorySchema = createInsertSchema(petCategories).omit({
  id: true,
  createdAt: true,
});

export const insertPetSchema = createInsertSchema(pets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  adminNotes: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});

// Update Zod validation schemas for new auth system
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Add registration schema with password validation
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(8).regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 
    "Password must contain at least one special character")
});

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type PetCategory = typeof petCategories.$inferSelect;
export type InsertPetCategory = z.infer<typeof insertPetCategorySchema>;
export type Pet = typeof pets.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

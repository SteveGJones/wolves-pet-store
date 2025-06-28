import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerSchema, loginSchema, createUser, findUserByEmail, authenticateUser, createUserSession } from "./auth";
import {
  insertPetSchema,
  insertInquirySchema,
  insertWishlistSchema,
  insertPetCategorySchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for K8s probes
  app.get('/api/health', async (req, res) => {
    try {
      // Check database connectivity
      const dbHealthy = await checkDatabaseHealth();
      
      const health = {
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy'
        }
      };

      res.status(dbHealthy ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        uptime: process.uptime()
      });
    }
  });

  // Database health check function
  async function checkDatabaseHealth(): Promise<boolean> {
    try {
      const { db } = await import('./db');
      // Simple query to check database connectivity
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Auth middleware
  await setupAuth(app);

  // New Authentication Endpoints
  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await findUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({
          error: "An account with this email already exists",
          code: "EMAIL_EXISTS"
        });
      }
      
      // Create user
      const user = await createUser(validatedData);
      
      // Create session
      req.session.user = createUserSession(user);
      
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          code: "VALIDATION_ERROR",
          details: error.errors
        });
      }
      
      console.error('Registration error:', error);
      res.status(500).json({
        error: "Registration failed",
        code: "REGISTRATION_ERROR"
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      // Validate input
      const { email, password } = loginSchema.parse(req.body);
      
      // Authenticate user
      const user = await authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS"
        });
      }
      
      // Create session
      req.session.user = createUserSession(user);
      
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS"
        });
      }
      
      console.error('Login error:', error);
      res.status(500).json({
        error: "Login failed",
        code: "LOGIN_ERROR"
      });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          error: "Logout failed",
          code: "LOGOUT_ERROR"
        });
      }
      
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    res.json({ user: req.user });
  });


  // Pet categories
  app.get("/api/pet-categories", async (req, res) => {
    try {
      const categories = await storage.getPetCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching pet categories:", error);
      res.status(500).json({ message: "Failed to fetch pet categories" });
    }
  });

  app.post("/api/pet-categories", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertPetCategorySchema.parse(req.body);
      const category = await storage.createPetCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating pet category:", error);
      res.status(500).json({ message: "Failed to create pet category" });
    }
  });

  // Pets
  app.get("/api/pets", async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
        age: req.query.age as string,
        size: req.query.size as string,
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const pets = await storage.getPets(filters);
      res.json(pets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      res.status(500).json({ message: "Failed to fetch pets" });
    }
  });

  app.get("/api/pets/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const pet = await storage.getPet(id);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      res.json(pet);
    } catch (error) {
      console.error("Error fetching pet:", error);
      res.status(500).json({ message: "Failed to fetch pet" });
    }
  });

  app.post("/api/pets", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(validatedData);
      res.status(201).json(pet);
    } catch (error) {
      console.error("Error creating pet:", error);
      res.status(500).json({ message: "Failed to create pet" });
    }
  });

  app.put("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = Number(req.params.id);
      const validatedData = insertPetSchema.partial().parse(req.body);
      const pet = await storage.updatePet(id, validatedData);
      res.json(pet);
    } catch (error) {
      console.error("Error updating pet:", error);
      res.status(500).json({ message: "Failed to update pet" });
    }
  });

  app.delete("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = Number(req.params.id);
      await storage.deletePet(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pet:", error);
      res.status(500).json({ message: "Failed to delete pet" });
    }
  });

  // Admin route for pets with categories
  app.get("/api/admin/pets", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pets = await storage.getPetsWithCategory();
      res.json(pets);
    } catch (error) {
      console.error("Error fetching pets with categories:", error);
      res.status(500).json({ message: "Failed to fetch pets" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Inquiries
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.get("/api/admin/inquiries", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.put("/api/admin/inquiries/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = Number(req.params.id);
      const updates = req.body;
      const inquiry = await storage.updateInquiry(id, updates);
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  // Wishlist
  app.get("/api/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const wishlist = await storage.getUserWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { petId } = req.body;
      
      const validatedData = insertWishlistSchema.parse({
        userId,
        petId: Number(petId),
      });
      
      const wishlistItem = await storage.addToWishlist(validatedData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:petId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const petId = Number(req.params.petId);
      
      await storage.removeFromWishlist(userId, petId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Dashboard stats
  app.get("/api/admin/dashboard-stats", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

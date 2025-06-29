import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerRoutes } from './routes';
import { z } from 'zod';

// Create explicit mock objects
const mockStorage = {
  getPetCategories: vi.fn(),
  createPetCategory: vi.fn(),
  getPets: vi.fn(),
  getPet: vi.fn(),
  createPet: vi.fn(),
  updatePet: vi.fn(),
  deletePet: vi.fn(),
  getPetsWithCategory: vi.fn(),
  getProducts: vi.fn(),
  createInquiry: vi.fn(),
  getInquiries: vi.fn(),
  updateInquiry: vi.fn(),
  getUserWishlist: vi.fn(),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
  getDashboardStats: vi.fn(),
};

const mockDestroySession = vi.fn((cb) => cb(null));

const mockSetupAuth = vi.fn((app) => {
  app.use((req: any, res: any, next: any) => {
    req.isAuthenticated = () => true;
    req.user = { userId: 'test-user-id', isAdmin: true };
    req.session = {
      user: undefined,
      destroy: mockDestroySession,
    };
    next();
  });
});

const mockIsAuthenticated = vi.fn((req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

const mockAuth = {
  setupAuth: mockSetupAuth,
  isAuthenticated: mockIsAuthenticated,
  registerSchema: { parse: vi.fn() },
  loginSchema: { parse: vi.fn() },
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  authenticateUser: vi.fn(),
  createUserSession: vi.fn(),
};

const mockDb = {
  execute: vi.fn(),
};

describe('API Routes', () => {
  let app: express.Express;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set up default mock behaviors
    mockAuth.registerSchema.parse.mockImplementation((data) => data);
    mockAuth.loginSchema.parse.mockImplementation((data) => data);
    mockSetupAuth.mockImplementation((app) => {
      app.use((req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { userId: 'test-user-id', isAdmin: true };
        req.session = {
          user: undefined,
          destroy: mockDestroySession,
        };
        next();
      });
    });
    mockIsAuthenticated.mockImplementation((req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      next();
    });
    
    // Register routes with explicit dependencies
    server = await registerRoutes(app, {
      storage: mockStorage,
      auth: mockAuth,
      db: mockDb
    });
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('GET /api/health', () => {
    it('should return 200 OK and healthy status when database is healthy', async () => {
      mockDb.execute.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/health');

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('healthy');
      expect(res.body.checks.database).toEqual('healthy');
    });

    it('should return 503 Service Unavailable and unhealthy status when database is unhealthy', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app).get('/api/health');

      expect(res.statusCode).toEqual(503);
      expect(res.body.status).toEqual('degraded');
      expect(res.body.checks.database).toEqual('unhealthy');
      expect(res.body.error).toBeUndefined();
    });
  });

  describe('POST /api/auth/register', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'Password123!',
      displayName: 'Test User',
    };
    const mockCreatedUser = {
      id: 'user-123',
      email: mockUserData.email,
      displayName: mockUserData.displayName,
    };
    const mockSessionUser = {
      id: 'session-123',
      email: mockUserData.email,
    };

    beforeEach(() => {
      mockAuth.registerSchema.parse.mockReturnValue(mockUserData);
      mockAuth.findUserByEmail.mockResolvedValue(null);
      mockAuth.createUser.mockResolvedValue(mockCreatedUser);
      mockAuth.createUserSession.mockReturnValue(mockSessionUser);
    });

    it('should register a new user and return 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUserData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.user).toEqual(mockCreatedUser);
      expect(mockAuth.registerSchema.parse).toHaveBeenCalledWith(mockUserData);
      expect(mockAuth.findUserByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(mockAuth.createUser).toHaveBeenCalledWith(mockUserData);
      expect(mockAuth.createUserSession).toHaveBeenCalledWith(mockCreatedUser);
    });

    it('should return 409 if user already exists', async () => {
      mockAuth.findUserByEmail.mockResolvedValueOnce(mockCreatedUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUserData);

      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toEqual('An account with this email already exists');
      expect(res.body.code).toEqual('EMAIL_EXISTS');
    });

    it('should return 400 if input data is invalid', async () => {
      mockAuth.registerSchema.parse.mockImplementation(() => {
        throw new z.ZodError([{
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        }]);
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 123, password: 'Password123!', displayName: 'Test User' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Invalid input data');
      expect(res.body.code).toEqual('VALIDATION_ERROR');
      expect(res.body.details).toBeDefined();
    });

    it('should return 500 for other registration errors', async () => {
      mockAuth.createUser.mockRejectedValueOnce(new Error('Database write error'));

      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUserData);

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Registration failed');
      expect(res.body.code).toEqual('REGISTRATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'Password123!',
    };
    const mockUser = {
      id: 'user-123',
      email: mockLoginData.email,
      displayName: 'Test User',
    };
    const mockSessionUser = {
      id: 'session-123',
      email: mockLoginData.email,
    };

    beforeEach(() => {
      mockAuth.loginSchema.parse.mockReturnValue(mockLoginData);
      mockAuth.authenticateUser.mockResolvedValue(mockUser);
      mockAuth.createUserSession.mockReturnValue(mockSessionUser);
    });

    it('should log in a user and return 200', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(mockLoginData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(mockUser);
      expect(mockAuth.loginSchema.parse).toHaveBeenCalledWith(mockLoginData);
      expect(mockAuth.authenticateUser).toHaveBeenCalledWith(mockLoginData.email, mockLoginData.password);
      expect(mockAuth.createUserSession).toHaveBeenCalledWith(mockUser);
    });

    it('should return 401 for incorrect credentials', async () => {
      mockAuth.authenticateUser.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send(mockLoginData);

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid email or password');
      expect(res.body.code).toEqual('INVALID_CREDENTIALS');
    });

    it('should return 400 if input data is invalid', async () => {
      mockAuth.loginSchema.parse.mockImplementation(() => {
        throw new z.ZodError([{
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        }]);
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 123, password: 'Password123!' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Email and password are required');
      expect(res.body.code).toEqual('MISSING_CREDENTIALS');
    });

    it('should return 500 for other login errors', async () => {
      mockAuth.authenticateUser.mockRejectedValueOnce(new Error('Authentication failed'));

      const res = await request(app)
        .post('/api/auth/login')
        .send(mockLoginData);

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Login failed');
      expect(res.body.code).toEqual('LOGIN_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should log out a user and return 200', async () => {
      mockDestroySession.mockClear(); // Clear mock before test

      const res = await request(app).post('/api/auth/logout');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toEqual(true);
      expect(res.body.message).toEqual('Logged out successfully');
      expect(mockDestroySession).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if logout fails', async () => {
      mockDestroySession.mockImplementationOnce((cb) => cb(new Error('Session destroy failed')));

      const res = await request(app).post('/api/auth/logout');

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Logout failed');
      expect(res.body.code).toEqual('LOGOUT_ERROR');
    });
  });

  describe('GET /api/auth/user', () => {
    it('should return current user data when authenticated', async () => {
      const res = await request(app).get('/api/auth/user');

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual({ userId: 'test-user-id', isAdmin: true });
    });

    it('should return 401 if not authenticated', async () => {
      // Create new app with different auth setup
      const testApp = express();
      testApp.use(express.json());
      
      const testAuthMock = {
        ...mockAuth,
        setupAuth: vi.fn((app) => {
          app.use((req: any, res: any, next: any) => {
            req.isAuthenticated = () => false;
            req.user = null;
            req.session = { destroy: mockDestroySession };
            next();
          });
        }),
        isAuthenticated: vi.fn((req, res, next) => {
          if (!req.isAuthenticated()) {
            return res.status(401).json({ message: 'Unauthorized' });
          }
          next();
        })
      };
      
      await registerRoutes(testApp, {
        storage: mockStorage,
        auth: testAuthMock,
        db: mockDb
      });

      const res = await request(testApp).get('/api/auth/user');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Unauthorized');
    });
  });

  describe('Pet Categories API', () => {
    const mockCategories = [
      { id: 1, name: 'Dogs' },
      { id: 2, name: 'Cats' },
    ];

    describe('GET /api/pet-categories', () => {
      it('should return all pet categories', async () => {
        mockStorage.getPetCategories.mockResolvedValue(mockCategories);

        const res = await request(app).get('/api/pet-categories');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockCategories);
        expect(mockStorage.getPetCategories).toHaveBeenCalledTimes(1);
      });

      it('should return 500 if fetching categories fails', async () => {
        mockStorage.getPetCategories.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/api/pet-categories');

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to fetch pet categories');
      });
    });

    describe('POST /api/pet-categories', () => {
      const newCategory = { name: 'Birds' };
      const createdCategory = { id: 3, name: 'Birds' };

      beforeEach(() => {
        mockStorage.createPetCategory.mockResolvedValue(createdCategory);
      });

      it('should create a new pet category if user is admin', async () => {
        const res = await request(app)
          .post('/api/pet-categories')
          .send(newCategory);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(createdCategory);
        expect(mockStorage.createPetCategory).toHaveBeenCalledWith(newCategory);
      });

      it('should return 403 if user is not admin', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => true;
              req.user = { userId: 'test-user-id', isAdmin: false };
              req.session = { destroy: mockDestroySession };
              next();
            });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp)
          .post('/api/pet-categories')
          .send(newCategory);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toEqual('Admin access required');
      });

      it('should return 401 if not authenticated', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => false;
              req.user = null;
              req.session = { destroy: mockDestroySession };
              next();
            });
          }),
          isAuthenticated: vi.fn((req, res, next) => {
            res.status(401).json({ message: 'Unauthorized' });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp)
          .post('/api/pet-categories')
          .send(newCategory);

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Unauthorized');
      });

      it('should return 500 if creating category fails', async () => {
        mockStorage.createPetCategory.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
          .post('/api/pet-categories')
          .send(newCategory);

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to create pet category');
      });
    });
  });

  describe('Pets API', () => {
    const mockPets = [
      { id: 1, name: 'Buddy', categoryId: 1 },
      { id: 2, name: 'Lucy', categoryId: 2 },
    ];
    const mockPet = { id: 1, name: 'Buddy', categoryId: 1 };
    const newPet = { name: 'Max', categoryId: 1 };
    const createdPet = { id: 3, name: 'Max', categoryId: 1 };
    const updatedPet = { id: 1, name: 'Buddy Updated', categoryId: 1 };

    describe('GET /api/pets', () => {
      it('should return all pets', async () => {
        mockStorage.getPets.mockResolvedValue(mockPets);

        const res = await request(app).get('/api/pets');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockPets);
        expect(mockStorage.getPets).toHaveBeenCalledTimes(1);
      });

      it('should return pets filtered by categoryId', async () => {
        mockStorage.getPets.mockResolvedValue([mockPets[0]]);

        const res = await request(app).get('/api/pets?categoryId=1');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([mockPets[0]]);
        expect(mockStorage.getPets).toHaveBeenCalledWith({ categoryId: 1, age: undefined, size: undefined, status: undefined, search: undefined });
      });

      it('should return 500 if fetching pets fails', async () => {
        mockStorage.getPets.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/api/pets');

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to fetch pets');
      });
    });

    describe('GET /api/pets/:id', () => {
      it('should return a single pet by ID', async () => {
        mockStorage.getPet.mockResolvedValue(mockPet);

        const res = await request(app).get('/api/pets/1');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockPet);
        expect(mockStorage.getPet).toHaveBeenCalledWith(1);
      });

      it('should return 404 if pet is not found', async () => {
        mockStorage.getPet.mockResolvedValue(null);

        const res = await request(app).get('/api/pets/999');

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toEqual('Pet not found');
      });

      it('should return 500 if fetching pet fails', async () => {
        mockStorage.getPet.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/api/pets/1');

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to fetch pet');
      });
    });

    describe('POST /api/pets', () => {
      beforeEach(() => {
        mockStorage.createPet.mockResolvedValue(createdPet);
      });

      it('should create a new pet if user is admin', async () => {
        const res = await request(app)
          .post('/api/pets')
          .send(newPet);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(createdPet);
        expect(mockStorage.createPet).toHaveBeenCalledWith(newPet);
      });

      it('should return 403 if user is not admin', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => true;
              req.user = { userId: 'test-user-id', isAdmin: false };
              req.session = { destroy: mockDestroySession };
              next();
            });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp)
          .post('/api/pets')
          .send(newPet);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toEqual('Admin access required');
      });

      it('should return 401 if not authenticated', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => false;
              req.user = null;
              req.session = { destroy: mockDestroySession };
              next();
            });
          }),
          isAuthenticated: vi.fn((req, res, next) => {
            res.status(401).json({ message: 'Unauthorized' });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp)
          .post('/api/pets')
          .send(newPet);

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Unauthorized');
      });

      it('should return 500 if creating pet fails', async () => {
        mockStorage.createPet.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
          .post('/api/pets')
          .send(newPet);

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to create pet');
      });
    });

    describe('PUT /api/pets/:id', () => {
      const updatedData = { name: 'Updated Buddy' };

      beforeEach(() => {
        mockStorage.updatePet.mockResolvedValue(updatedPet);
      });

      it('should update a pet if user is admin', async () => {
        const res = await request(app)
          .put('/api/pets/1')
          .send(updatedData);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(updatedPet);
        expect(mockStorage.updatePet).toHaveBeenCalledWith(1, updatedData);
      });

      it('should return 403 if user is not admin', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => true;
              req.user = { userId: 'test-user-id', isAdmin: false };
              req.session = { destroy: mockDestroySession };
              next();
            });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp)
          .put('/api/pets/1')
          .send(updatedData);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toEqual('Admin access required');
      });

      it('should return 401 if not authenticated', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => false;
              req.user = null;
              req.session = { destroy: mockDestroySession };
              next();
            });
          }),
          isAuthenticated: vi.fn((req, res, next) => {
            res.status(401).json({ message: 'Unauthorized' });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp)
          .put('/api/pets/1')
          .send(updatedData);

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Unauthorized');
      });

      it('should return 500 if updating pet fails', async () => {
        mockStorage.updatePet.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
          .put('/api/pets/1')
          .send(updatedData);

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to update pet');
      });
    });

    describe('DELETE /api/pets/:id', () => {
      beforeEach(() => {
        mockStorage.deletePet.mockResolvedValue(undefined);
      });

      it('should delete a pet if user is admin', async () => {
        const res = await request(app).delete('/api/pets/1');

        expect(res.statusCode).toEqual(204);
        expect(mockStorage.deletePet).toHaveBeenCalledWith(1);
      });

      it('should return 403 if user is not admin', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => true;
              req.user = { userId: 'test-user-id', isAdmin: false };
              req.session = { destroy: mockDestroySession };
              next();
            });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp).delete('/api/pets/1');

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toEqual('Admin access required');
      });

      it('should return 401 if not authenticated', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => false;
              req.user = null;
              req.session = { destroy: mockDestroySession };
              next();
            });
          }),
          isAuthenticated: vi.fn((req, res, next) => {
            res.status(401).json({ message: 'Unauthorized' });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp).delete('/api/pets/1');

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Unauthorized');
      });

      it('should return 500 if deleting pet fails', async () => {
        mockStorage.deletePet.mockRejectedValue(new Error('DB error'));

        const res = await request(app).delete('/api/pets/1');

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to delete pet');
      });
    });

    describe('GET /api/admin/pets', () => {
      it('should return pets with categories if user is admin', async () => {
        const mockPetsWithCategory = [
          { id: 1, name: 'Buddy', category: { id: 1, name: 'Dogs' } },
        ];
        mockStorage.getPetsWithCategory.mockResolvedValue(mockPetsWithCategory);

        const res = await request(app).get('/api/admin/pets');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockPetsWithCategory);
        expect(mockStorage.getPetsWithCategory).toHaveBeenCalledTimes(1);
      });

      it('should return 403 if user is not admin', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => true;
              req.user = { userId: 'test-user-id', isAdmin: false };
              req.session = { destroy: mockDestroySession };
              next();
            });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp).get('/api/admin/pets');

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toEqual('Admin access required');
      });

      it('should return 401 if not authenticated', async () => {
        const testApp = express();
        testApp.use(express.json());
        
        const testAuthMock = {
          ...mockAuth,
          setupAuth: vi.fn((app) => {
            app.use((req: any, res: any, next: any) => {
              req.isAuthenticated = () => false;
              req.user = null;
              req.session = { destroy: mockDestroySession };
              next();
            });
          }),
          isAuthenticated: vi.fn((req, res, next) => {
            res.status(401).json({ message: 'Unauthorized' });
          })
        };
        
        await registerRoutes(testApp, {
          storage: mockStorage,
          auth: testAuthMock,
          db: mockDb
        });

        const res = await request(testApp).get('/api/admin/pets');

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Unauthorized');
      });

      it('should return 500 if fetching pets with categories fails', async () => {
        mockStorage.getPetsWithCategory.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/api/admin/pets');

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('Failed to fetch pets');
      });
    });
  });
});

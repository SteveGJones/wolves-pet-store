# Wolves Pet Store API Documentation

## Overview

The Wolves Pet Store API provides RESTful endpoints for managing pet adoptions, user accounts, and administrative functions. All endpoints use JSON for request and response bodies.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses session-based authentication with cookies. Users must register and login to access protected endpoints.

### Authentication Flow
1. **Register** or **Login** to receive a session cookie
2. **Include session cookie** in subsequent requests
3. **Logout** to invalidate the session

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {} // Optional additional details
}
```

### Common Error Codes
- `NOT_AUTHENTICATED` - User not logged in
- `ADMIN_REQUIRED` - Admin access required
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `EMAIL_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Invalid login credentials

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false,
    "createdAt": "2025-06-28T12:00:00.000Z"
  }
}
```

**Errors:**
- `409` - Email already exists
- `400` - Validation error (weak password, invalid email)

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "John Doe",
    "isAdmin": false
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `400` - Missing email or password

#### Logout User
```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User
```http
GET /api/auth/user
```

**Authorization:** Required (authenticated user)

**Response (200):**
```json
{
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "John Doe",
    "isAdmin": false
  }
}
```

**Errors:**
- `401` - Not authenticated

### Health Check

#### Application Health
```http
GET /api/health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-28T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Pet Categories

#### Get All Categories
```http
GET /api/pet-categories
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Dogs",
    "description": "Domestic dogs of all breeds",
    "createdAt": "2025-06-28T12:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Cats",
    "description": "Domestic cats of all breeds",
    "createdAt": "2025-06-28T12:00:00.000Z"
  }
]
```

#### Create Category
```http
POST /api/pet-categories
```

**Authorization:** Required (admin only)

**Request Body:**
```json
{
  "name": "Birds",
  "description": "Domestic birds and parrots"
}
```

**Response (201):**
```json
{
  "id": 3,
  "name": "Birds",
  "description": "Domestic birds and parrots",
  "createdAt": "2025-06-28T12:00:00.000Z"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Admin access required
- `400` - Validation error

### Pets

#### Get All Pets
```http
GET /api/pets?categoryId=1&age=young&size=medium&status=available&search=golden
```

**Query Parameters:**
- `categoryId` (optional) - Filter by category ID
- `age` (optional) - Filter by age group
- `size` (optional) - Filter by size
- `status` (optional) - Filter by adoption status
- `search` (optional) - Search in name, breed, description

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Buddy",
    "categoryId": 1,
    "breed": "Golden Retriever",
    "age": "2 years",
    "size": "Large",
    "gender": "Male",
    "color": "Golden",
    "description": "Friendly and energetic dog",
    "temperament": "Friendly, Active, Loyal",
    "medicalHistory": "Vaccinated, Neutered",
    "adoptionFee": "250.00",
    "status": "available",
    "isNeutered": true,
    "isVaccinated": true,
    "imageUrls": ["/images/buddy1.jpg", "/images/buddy2.jpg"],
    "tags": ["friendly", "active", "good-with-kids"],
    "dateAdded": "2025-06-28T12:00:00.000Z",
    "createdAt": "2025-06-28T12:00:00.000Z",
    "updatedAt": "2025-06-28T12:00:00.000Z"
  }
]
```

#### Get Pet by ID
```http
GET /api/pets/{id}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Buddy",
  "categoryId": 1,
  "breed": "Golden Retriever",
  "age": "2 years",
  "size": "Large",
  "gender": "Male",
  "color": "Golden",
  "description": "Friendly and energetic dog",
  "temperament": "Friendly, Active, Loyal",
  "medicalHistory": "Vaccinated, Neutered",
  "adoptionFee": "250.00",
  "status": "available",
  "isNeutered": true,
  "isVaccinated": true,
  "imageUrls": ["/images/buddy1.jpg", "/images/buddy2.jpg"],
  "tags": ["friendly", "active", "good-with-kids"],
  "dateAdded": "2025-06-28T12:00:00.000Z",
  "createdAt": "2025-06-28T12:00:00.000Z",
  "updatedAt": "2025-06-28T12:00:00.000Z"
}
```

**Errors:**
- `404` - Pet not found

#### Create Pet
```http
POST /api/pets
```

**Authorization:** Required (admin only)

**Request Body:**
```json
{
  "name": "Luna",
  "categoryId": 2,
  "breed": "Siamese",
  "age": "1 year",
  "size": "Medium",
  "gender": "Female",
  "color": "Cream and Brown",
  "description": "Playful and affectionate cat",
  "temperament": "Playful, Affectionate, Independent",
  "medicalHistory": "Vaccinated, Spayed",
  "adoptionFee": "150.00",
  "isNeutered": true,
  "isVaccinated": true,
  "imageUrls": ["/images/luna1.jpg"],
  "tags": ["playful", "affectionate"]
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "Luna",
  "categoryId": 2,
  "breed": "Siamese",
  "age": "1 year",
  "size": "Medium",
  "gender": "Female",
  "color": "Cream and Brown",
  "description": "Playful and affectionate cat",
  "temperament": "Playful, Affectionate, Independent",
  "medicalHistory": "Vaccinated, Spayed",
  "adoptionFee": "150.00",
  "status": "available",
  "isNeutered": true,
  "isVaccinated": true,
  "imageUrls": ["/images/luna1.jpg"],
  "tags": ["playful", "affectionate"],
  "dateAdded": "2025-06-28T12:00:00.000Z",
  "createdAt": "2025-06-28T12:00:00.000Z",
  "updatedAt": "2025-06-28T12:00:00.000Z"
}
```

#### Update Pet
```http
PUT /api/pets/{id}
```

**Authorization:** Required (admin only)

**Request Body:** (partial update allowed)
```json
{
  "status": "adopted",
  "dateAdopted": "2025-06-28T12:00:00.000Z"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Buddy",
  "status": "adopted",
  "dateAdopted": "2025-06-28T12:00:00.000Z",
  "updatedAt": "2025-06-28T12:00:00.000Z"
}
```

#### Delete Pet
```http
DELETE /api/pets/{id}
```

**Authorization:** Required (admin only)

**Response (204):** No content

### Products

#### Get All Products
```http
GET /api/products
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Premium Dog Food",
    "description": "High-quality nutrition for adult dogs",
    "category": "Food",
    "price": "45.99",
    "stockQuantity": 50,
    "imageUrls": ["/images/dogfood1.jpg"],
    "isActive": true,
    "createdAt": "2025-06-28T12:00:00.000Z",
    "updatedAt": "2025-06-28T12:00:00.000Z"
  }
]
```

### Inquiries

#### Submit Inquiry
```http
POST /api/inquiries
```

**Request Body:**
```json
{
  "petId": 1,
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1-555-0123",
  "message": "I'm interested in adopting Buddy. Can we schedule a meet and greet?"
}
```

**Response (201):**
```json
{
  "id": 1,
  "petId": 1,
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1-555-0123",
  "message": "I'm interested in adopting Buddy. Can we schedule a meet and greet?",
  "status": "pending",
  "createdAt": "2025-06-28T12:00:00.000Z",
  "updatedAt": "2025-06-28T12:00:00.000Z"
}
```

### Wishlist

#### Get User Wishlist
```http
GET /api/wishlist
```

**Authorization:** Required (authenticated user)

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "petId": 1,
    "createdAt": "2025-06-28T12:00:00.000Z",
    "pet": {
      "id": 1,
      "name": "Buddy",
      "breed": "Golden Retriever",
      "imageUrls": ["/images/buddy1.jpg"]
    }
  }
]
```

#### Add to Wishlist
```http
POST /api/wishlist
```

**Authorization:** Required (authenticated user)

**Request Body:**
```json
{
  "petId": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "petId": 1,
  "createdAt": "2025-06-28T12:00:00.000Z"
}
```

#### Remove from Wishlist
```http
DELETE /api/wishlist/{petId}
```

**Authorization:** Required (authenticated user)

**Response (204):** No content

### Admin Endpoints

#### Get All Pets (Admin)
```http
GET /api/admin/pets
```

**Authorization:** Required (admin only)

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Buddy",
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "Dogs"
    },
    "status": "available",
    "dateAdded": "2025-06-28T12:00:00.000Z"
  }
]
```

#### Get All Inquiries (Admin)
```http
GET /api/admin/inquiries
```

**Authorization:** Required (admin only)

**Response (200):**
```json
[
  {
    "id": 1,
    "petId": 1,
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "customerPhone": "+1-555-0123",
    "message": "I'm interested in adopting Buddy.",
    "status": "pending",
    "adminNotes": null,
    "createdAt": "2025-06-28T12:00:00.000Z",
    "pet": {
      "id": 1,
      "name": "Buddy",
      "breed": "Golden Retriever"
    }
  }
]
```

#### Update Inquiry (Admin)
```http
PUT /api/admin/inquiries/{id}
```

**Authorization:** Required (admin only)

**Request Body:**
```json
{
  "status": "replied",
  "adminNotes": "Scheduled meet and greet for Saturday"
}
```

**Response (200):**
```json
{
  "id": 1,
  "status": "replied",
  "adminNotes": "Scheduled meet and greet for Saturday",
  "updatedAt": "2025-06-28T12:00:00.000Z"
}
```

#### Get Dashboard Stats (Admin)
```http
GET /api/admin/dashboard-stats
```

**Authorization:** Required (admin only)

**Response (200):**
```json
{
  "totalPets": 25,
  "availablePets": 18,
  "adoptedPets": 7,
  "pendingInquiries": 5,
  "totalInquiries": 15,
  "recentAdoptions": 3
}
```

## Data Models

### User
```typescript
interface User {
  id: string;              // UUID
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Pet
```typescript
interface Pet {
  id: number;
  name: string;
  categoryId: number;
  breed?: string;
  age?: string;
  size?: string;
  gender?: string;
  color?: string;
  description?: string;
  temperament?: string;
  medicalHistory?: string;
  adoptionFee?: string;
  status: string;          // 'available' | 'pending' | 'adopted'
  isNeutered: boolean;
  isVaccinated: boolean;
  imageUrls?: string[];
  tags?: string[];
  dateAdded: Date;
  dateAdopted?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Inquiry
```typescript
interface Inquiry {
  id: number;
  petId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message: string;
  status: string;          // 'pending' | 'replied' | 'closed'
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing:
- **Authentication endpoints**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin user

## Versioning

The API follows semantic versioning. The current version is `v1.0.0`.

Future versions will maintain backward compatibility where possible. Breaking changes will result in a new major version.

## Testing

Use the following test accounts for development:

**Regular User:**
- Email: `user@example.com`
- Password: `UserPass123!`

**Admin User:**
- Email: `admin@example.com` 
- Password: `AdminPass123!`

Create test users with:
```bash
npm run create-admin -- --email admin@test.com --password "TestPass123!"
```
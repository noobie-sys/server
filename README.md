# Course Recommendation API

A RESTful API for managing courses with authentication, Redis caching, and CSV upload functionality.

## Tech Stack

- **Node.js** + **Express**
- **MongoDB** (Mongoose)
- **Redis** (Upstash/Redis caching)
- **JWT** Authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (via Docker or local installation)
- Redis (Upstash or local installation)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8000
MONGO_URI=mongodb://admin:admin123@localhost:27017/course-recommendation?authSource=admin
UPSTASH_REDIS_URL=redis://default:your-redis-password@your-redis-host:port
JWT_SECRET=your-super-secret
```

**Environment Variables Explained:**

- `PORT` - Server port (default: 8000)
- `MONGO_URI` - MongoDB connection string
- `UPSTASH_REDIS_URL` - Redis connection URL (for caching)
- `JWT_SECRET` - Secret key for signing JWT tokens (use a strong random string in production)


### 4. Run the Server

**Development:**
```bash
npm run dev
```

The server will run on `http://localhost:8000`

## API Endpoints

### Authentication Endpoints

#### 1. Register Admin

**POST** `/api/auth/register`

Create a new admin account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "admin@example.com",
  "passwordHash": "password123"
}
```

**Response (201):**
```json
{
  "message": "Registered successfully!",
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@example.com",
      "name": "John Doe"
    },
    "JSONWebToken": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Validation:**
- All fields (name, email, password) are required
- Password must be at least 8 characters long

---

#### 2. Login

**POST** `/api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Logged In succesfully!",
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@example.com",
      "name": "John Doe"
    },
    "JSONWebToken": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error (401):**
```json
{
  "message": "Invalid Crendtials",
  "data": null
}
```

---

#### 3. Protected Route (Test)

**GET** `/api/auth/protected-route`

Test endpoint to verify JWT token authentication.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response (200):**
```json
{
  "message": "This is protected route by jsonwebtoken",
  "data": {
    "name": "Hello"
  }
}
```

---

### Course Endpoints

All course endpoints require authentication. Include the JWT token in the Authorization header.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

---

#### 4. Get All Courses

**GET** `/api/courses/`

Retrieve all courses with Redis caching.

**Response (200):**
```json
{
  "message": "Courses fetched successfully",
  "data": [{
		"_id": "6905f5a12ac1a9b97ad22cc0",
		"course_id": "C004",
		"title": "Strategic Marketing Management",
		"description": "Focuses on developing strategic marketing plans for competitive markets.",
		"category": "Marketing",
		"instructor": "Prof. David Kim",
		"duration": 12,
		"__v": 0,
		"createdAt": "2025-11-01T11:57:21.321Z",
		"updatedAt": "2025-11-01T11:57:21.321Z"
	}]
}
```

---

#### 5. Get Course by ID

**GET** `/api/courses/:id` ("course_id": "C004")

Retrieve a specific course by ID with Redis caching.

**Response (200):**
```json
{
  "message": "Course fetched successfully",
  "data": {
		"_id": "6905f5a12ac1a9b97ad22cc0",
		"course_id": "C004",
		"title": "Strategic Marketing Management",
		"description": "Focuses on developing strategic marketing plans for competitive markets.",
		"category": "Marketing",
		"instructor": "Prof. David Kim",
		"duration": 12,
		"__v": 0,
		"createdAt": "2025-11-01T11:57:21.321Z",
		"updatedAt": "2025-11-01T11:57:21.321Z"
	}
}
```

**Error (404):**
```json
{
  "message": "Course not found",
  "data": null
}
```

---

#### 6. Upload Courses (CSV)

**POST** `/api/courses/upload`

Upload courses via CSV file.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: CSV file (max 10MB)

**CSV Format:**
```csv
title,description,instructor,duration,price,level,category
Introduction to Node.js,Learn Node.js basics,John Doe,10,99.99,beginner,Web Development
Advanced React,Master React concepts,Jane Smith,15,149.99,advanced,Web Development
```

**Response (201):**
```json
{
  "message": "Courses uploaded successfully",
  "data": {
    "uploaded": 2,
    "failed": 0
  }
}
```

**Error (400):**
```json
{
  "message": "Only CSV files are allowed!"
}
```

---

### Health Check

**GET** `/`

Check if the API is running.

**Response (200):**
```json
{
  "message": "API is running...",
  "data": {
    "PORT": "8000"
  }
}
```
### Token Details

- **Expiration**: 1 hour
- **Payload**: Contains user ID, email, and role
- **Algorithm**: HS256
- **Secret**: Uses `JWT_SECRET` from environment variables

### Example Token Usage

```bash
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
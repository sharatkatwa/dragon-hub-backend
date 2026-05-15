# DragonHub Backend API

DragonHub is a developer social platform API. It supports authentication, developer profiles, project showcases, technical blogs, search/discovery, likes, image uploads, and Swagger documentation.

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT access and refresh tokens
- HTTP-only cookies
- ImageKit for image hosting
- Multer for multipart uploads
- Swagger UI for API documentation

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the server root:

```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

MONGO_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_long_access_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_long_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

Start development server:

```bash
npm run dev
```

Start production server:

```bash
npm start
```

Base URL:

```txt
http://localhost:3000/api
```

Health check:

```txt
GET /api/health
```

## Swagger Docs

Swagger is enabled only when `NODE_ENV !== "production"`.

Open:

```txt
http://localhost:3000/api-docs
```

## Authentication

The API uses:

- `accessToken` cookie for protected requests
- `refreshToken` cookie for refreshing sessions
- Bearer token support for API testing

For frontend requests, enable credentials:

```js
axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});
```

Protected routes also support:

```txt
Authorization: Bearer <accessToken>
```

### Auth Routes

```txt
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/refresh-token
POST  /api/auth/logout
GET   /api/auth/me
PATCH /api/auth/profile
PATCH /api/auth/profile/images
```

Register body:

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

Login body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Profile update body:

```json
{
  "fullName": "John Doe",
  "bio": "Full stack developer",
  "skills": ["React", "Node.js", "MongoDB"],
  "socialLinks": {
    "github": "https://github.com/john",
    "linkedin": "https://linkedin.com/in/john",
    "website": "https://john.dev",
    "twitter": "https://twitter.com/john"
  }
}
```

Profile image upload uses `multipart/form-data`:

```txt
avatar -> File
banner -> File
```

## Projects

Project routes:

```txt
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/user/:userId
PATCH  /api/projects/:id/like
```

Protected:

```txt
POST   /api/projects
PATCH  /api/projects/:id
DELETE /api/projects/:id
PATCH  /api/projects/:id/like
```

Create project with `multipart/form-data`:

```txt
title        DevHub
description  Developer social platform
techStack    React, Node.js, MongoDB
githubUrl    https://github.com/user/devhub
liveUrl      https://devhub.example.com
tags         fullstack, social
image        File
```

Project listing supports query filters:

```txt
GET /api/projects?search=api
GET /api/projects?tech=React,Node.js
GET /api/projects?tag=fullstack
GET /api/projects?sort=latest
GET /api/projects?sort=oldest
GET /api/projects?sort=popular
```

## Blogs

Blog routes:

```txt
GET    /api/blogs
POST   /api/blogs
GET    /api/blogs/slug/:slug
GET    /api/blogs/user/:userId
PATCH  /api/blogs/:id
DELETE /api/blogs/:id
PATCH  /api/blogs/:id/like
```

Protected:

```txt
POST   /api/blogs
PATCH  /api/blogs/:id
DELETE /api/blogs/:id
PATCH  /api/blogs/:id/like
```

Create blog with `multipart/form-data`:

```txt
title       How to Build an Express API
content     # Hello DevHub
excerpt     Short intro
category    backend
tags        node, express, mongodb
coverImage  File
```

The backend stores markdown as plain text in `content`. Render markdown in the frontend.

Blog listing supports query filters:

```txt
GET /api/blogs?search=jwt
GET /api/blogs?tag=node,mongodb
GET /api/blogs?category=backend
GET /api/blogs?sort=latest
GET /api/blogs?sort=oldest
GET /api/blogs?sort=popular
```

## Users

Public user routes:

```txt
GET /api/users
GET /api/users/:id
```

User search supports:

```txt
GET /api/users?search=john
GET /api/users?skill=React,Node.js
GET /api/users?sort=latest
GET /api/users?sort=oldest
```

Public user responses exclude password, email, and refresh token.

## Discover

Discovery route:

```txt
GET /api/discover
```

Optional limit:

```txt
GET /api/discover?limit=6
```

Response includes:

```json
{
  "success": true,
  "latestProjects": [],
  "trendingProjects": [],
  "latestBlogs": [],
  "trendingBlogs": [],
  "topDevelopers": []
}
```

Trending items are sorted by like count.

## Seed Data

Run:

```bash
npm run seed
```

The seed script creates dummy users, projects, blogs, and likes.

Seed user password:

```txt
password123
```

Example seed login:

```txt
email: aarya.seed@devhub.test
password: password123
```

The seed script removes previous seed data before inserting fresh seed records.

## Deployment Notes

For Render:

```txt
Root Directory: server
Build Command: npm install
Start Command: npm start
```

Set these environment variables in Render:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_long_access_secret
REFRESH_TOKEN_SECRET=your_long_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

For cross-domain production cookies, the backend uses:

```txt
SameSite=None
Secure=true
```

Make sure the frontend uses:

```js
withCredentials: true
```

## Response Shape

Successful responses usually look like:

```json
{
  "success": true,
  "message": "Action completed successfully"
}
```

Error responses usually look like:

```json
{
  "success": false,
  "message": "Error message"
}
```

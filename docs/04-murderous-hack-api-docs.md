# 📚 Murderous Hack API Documentation

## 🎯 Overview

The Murderous Hack API provides a comprehensive set of endpoints for building a Hacker News-style platform. The API is built with Hono and features user authentication, posts, comments, and voting functionality.

## 🌐 Interactive Documentation

### Scalar API Reference
- **URL**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **Features**: 
  - Interactive API playground
  - Try endpoints directly in the browser
  - Authentication support
  - Beautiful, modern interface
  - Custom Murderous Hack branding

### OpenAPI Specification
- **URL**: [http://localhost:3000/api-spec.json](http://localhost:3000/api-spec.json)
- **Format**: OpenAPI 3.0.3 JSON specification
- **Use**: Import into Postman, Insomnia, or other API tools

## 🔑 Authentication

The API uses **Better Auth** with session-based authentication via cookies.

### Cookie Details
- **Name**: `better-auth.session_token`
- **Type**: HTTP-only session cookie
- **Scope**: Automatically included in requests from the frontend

### Authentication Flow
1. **Signup**: `POST /api/auth/signup` - Create new account
2. **Login**: `POST /api/auth/login` - Authenticate user
3. **User Info**: `GET /api/user` - Get current user details
4. **Logout**: `GET /api/auth/logout` - End session

## 📋 API Endpoints Overview

### Authentication Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/logout` - Logout current user
- `GET /api/user` - Get current user information

### Posts Endpoints
- `GET /api/posts` - List posts with pagination and filtering
- `POST /api/posts` - Create new post (auth required)
- `GET /api/posts/{id}` - Get specific post
- `POST /api/posts/{id}/upvote` - Toggle upvote on post (auth required)

### Comments Endpoints
- `POST /api/comments/{id}` - Create comment on post (auth required)
- `POST /api/comments/{id}/upvote` - Toggle upvote on comment (auth required)
- `GET /api/comments/{id}/comments` - Get replies to comment

## 🎨 Custom Branding

The API documentation features custom Murderous Hack branding:
- **Primary Color**: `#ff6600` (Murderous Hack orange)
- **Secondary Color**: `#f5f5ed` (light background)
- **Theme**: Purple with custom CSS overrides

## 🚀 Getting Started

### 1. Start the Development Server
```bash
bun run start
```

### 2. Access the Documentation
Open [http://localhost:3000/docs](http://localhost:3000/docs) in your browser

### 3. Try the API
1. Create an account using the signup endpoint
2. Login to get a session cookie
3. Create posts and comments
4. Explore the voting functionality

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "isFormError": false
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "totalPages": 10
  }
}
```

## 🔧 Query Parameters

### Pagination
- `limit` - Items per page (default: 10, max: 100)
- `page` - Page number (default: 1)

### Sorting
- `sortBy` - Sort field: `points` | `recent` (default: `points`)
- `order` - Sort order: `asc` | `desc` (default: `desc`)

### Filtering
- `author` - Filter by username
- `site` - Filter by domain (for URL posts)

## 🛠️ Development Tools

### Import into Postman
1. Copy the OpenAPI spec URL: `http://localhost:3000/api-spec.json`
2. In Postman: Import → Link → Paste URL
3. All endpoints will be imported with proper schemas

### Import into Insomnia
1. File → Import Data → From URL
2. Enter: `http://localhost:3000/api-spec.json`
3. Choose "OpenAPI 3.0" format

## 📝 Notes

- All timestamps are in ISO 8601 format
- User IDs are strings (Better Auth format)
- Post and comment IDs are integers
- Authentication is required for creating content and voting
- The API supports both URL posts and text posts (content)
- Comments support nested threading (via `parentCommentId`)

## 🔗 Related Documentation

- [Development Scripts](./02-murderous-hack-dev-scripts.md)
- [Authentication Migration](./03-murderous-hack-auth-migration.md)
- [Project Overview](./01-murderous-hack-docs.md)

# BookHub - Modern Library Management System

A modern, RESTful API for managing a digital library system built with Node.js, Express, and MongoDB. This project showcases advanced features like role-based access control, real-time book availability tracking, and personalized reading recommendations.

## Key Features

- **Smart Authentication System**
  - JWT-based secure authentication
  - Role-based access (Readers, Authors, Admins)
  - Session management with token expiry

- **Advanced Book Management**
  - Real-time stock tracking
  - Genre-based categorization
  - Smart search with filters
  - Book recommendations based on user history

- **User Profile System**
  - Reading preferences tracking
  - Borrowing history
  - Author portfolio management
  - Customizable notification settings

## Tech Stack

- Backend: Node.js with Express
- Database: MongoDB with Mongoose ODM
- Authentication: JWT (JSON Web Tokens)
- API Testing: Postman
- Security: bcrypt for password hashing

## Setup Instructions

1. **Clone and Install**`

2. **Environment Setup**
   Create a .env file:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/bookhub
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication Routes
```
POST /api/users/signup - Register new user
POST /api/users/login  - User login
POST /api/users/signup - Register as a Author  by sepecfing role author
POST /api/users/login  - Authorlogin
GET  /api/users/profile - Get user profile
PUT  /api/users/update - Update user details
DELETE /api/users/delete/:id - Delete user account
GET /api/users/session/validate - Validate current session token
```

### Book Management
```
GET    /api/books        - List all books or search by title/author/genre
POST   /api/books/create - Add new book (Authors only)
GET    /api/books/author/:id - Get author's books and borrowed status
GET    /api/books/:id    - Get book details
PUT    /api/books/update/:id - Update book (Authors only)
DELETE /api/books/delete/:id - Remove book (Authors only)
```

### Borrowing System
```
POST   /api/reader/books/borrow - Borrow a book
POST   /api/reader/books/return - Return a borrowed book
GET    /api/reader/books/:id - View reader's borrowed books
```

## API Request/Response Examples

### 1. User Signup
```http
POST /api/users/signup
Content-Type: application/json

{
  "name": "Aman Patil",
  "email": "Aman@example.com",
  "password": "test@123",
  "role": "reader"  
}

{
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
        "user": {
            "name": "Aman Patil",
            "email": "aman@example.com",
            "role": "reader",
        }
      }
}
```
### 2. Author Creation 
http://localhost:3000/api/users/signup
{
    "name": "Am Patel",
    "email": "Aman123@gmail.com",
    "password": "Aman@123",
    "role": "author"   
}

{
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..",
    "data": {
        "user": {
            "name": "Am Patel",
            "email": "aman123@gmail.com",
            "role": "author",
            }
      }
}

### 3. Book Creation (Authors)
```http
POST /api/books/create
Authorization: Bearer eyJhbGciOiJI...
Content-Type: application/json

{
    "title": "Motivate Book",
    "genre": "Fiction",
    "stock": 6,
    "description": "Motivation Book"
}

Response:
{
  "status": "success",
  "data": {
    "book": {
      "title": "Motivate Book",
      "genre": "Fiction",
      "stock": 5,
      "author": "author_id"
    }
  }
}
```

### 3. Borrow Book
```http
POST /api/reader/books/borrow
Authorization: Bearer eyJhbGciOiJI...
Content-Type: application/json

{
  "bookId": "book_id"
}

Response:
{
  "status": "success",
  "message": "Book borrowed successfully"
}
```

## Screenshots

### User Interface
![Login Screen](images/Screenshot%20(624).png)
![Dashboard](images/Screenshot%20(625).png)
![Book Management](images/Screenshot%20(626).png)

### Features
![Search Function](images/Screenshot%20(627).png)
![User Profile](images/Screenshot%20(628).png)
![Book Details](images/Screenshot%20(629).png)

### Admin Panel
![Admin Dashboard](images/Screenshot%20(630).png)
![Statistics](images/Screenshot%20(631).png)




## Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter)

Project Link: [https://github.com/swa1245/Bcaken_project](https://github.com/swa1245/Bcaken_project)

---
⭐️ If you found this project helpful, please consider giving it a star!

## Future Enhancements

- [ ] Integration with payment gateway
- [ ] Reading progress tracking
- [ ] Book recommendations using ML

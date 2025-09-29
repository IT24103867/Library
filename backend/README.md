# Library Management System

A comprehensive library management system built with Spring Boot that provides complete functionality for managing books, users, transactions, fines, payments, and notifications.

## Features Implemented

### 📚 Core Library Management
- **Book Management**: CRUD operations for books, authors, publishers, and categories
- **Book Copy Management**: Track individual copies with barcodes, conditions, and locations
- **User Management**: Member registration, authentication, and role-based access control

### 📋 Library Policies
- **Configurable Policies**: Flexible policy management for borrowing rules
- **Policy Settings**:
  - Maximum books per user
  - Borrowing period duration
  - Renewal limits and grace periods
  - Fine rates and maximum amounts
  - Request limits and expiry periods

### 📖 Book Operations
- **Book Issuing**: Check out books to users with due date tracking
- **Book Returns**: Process returns with condition assessment
- **Book Renewals**: Allow users to extend borrowing periods
- **Book Reservations**: Queue system for requested books

### 🔍 Book Request System
- **Request Management**: Users can request unavailable books
- **Queue System**: Fair queuing with position tracking
- **Request Fulfillment**: Automatic notification when books become available
- **Request Expiry**: Automatic cleanup of expired requests

### 💰 Fine Management
- **Automated Fine Calculation**:
  - Overdue fines with grace period support
  - Damaged book fines based on condition
  - Lost book fines with full replacement cost
- **Fine Types**: Overdue, Damaged, Lost, Late Return, Custom
- **Fine Operations**: Payment tracking, partial payments, fine waiving

### 💳 Payment Integration
- **PayHere Sandbox Integration**: Secure online payment processing
- **Payment Methods**: Credit/Debit cards, Digital wallets, Bank transfers, Cash
- **Payment Tracking**: Complete payment history with status tracking
- **Direct Payments**: Staff can record manual payments

### 📧 Notification System
- **Multi-Channel Notifications**: Email, SMS, In-app notifications
- **Automated Notifications**:
  - Book due reminders
  - Overdue notices
  - Fine notifications
  - Request confirmations
  - Payment confirmations
- **Notification Retry**: Automatic retry for failed notifications

### 📊 Activity Logging
- **Comprehensive Logging**: Track all system activities with metadata
- **Activity Types**: User actions, system events, transactions
- **Metadata Storage**: IP addresses, user agents, related entities
- **Audit Trail**: Complete history for compliance and debugging

### 🤖 Automated Tasks
- **Scheduled Operations**:
  - Overdue book processing
  - Due date reminders
  - Request expiry management
  - Fine reminders
  - Payment cleanup
  - Notification retry
  - System maintenance

### ⭐ Book Reviews & Ratings
- **User Reviews**: Allow users to rate and review books they've borrowed
- **Rating System**: 1-5 star rating scale with optional text reviews
- **Review Management**: Users can create, update, and delete their own reviews
- **Rating Statistics**: Calculate average ratings and review distributions
- **Review Display**: View all reviews for a book with pagination

## Technology Stack

- **Backend**: Spring Boot 3.5.5, Java 21
- **Database**: MySQL with JPA/Hibernate
- **Security**: Spring Security with role-based access
- **Scheduling**: Spring Scheduler for automated tasks
- **Email**: Spring Mail with SMTP
- **Payment**: PayHere payment gateway integration
- **Documentation**: Comprehensive API endpoints

## API Endpoints

### Library Policies
- `GET /api/policies/active` - Get active policy
- `GET /api/policies` - List all policies (Admin/Librarian)
- `POST /api/policies` - Create new policy (Admin)
- `PUT /api/policies/{id}` - Update policy (Admin)
- `POST /api/policies/{id}/activate` - Activate policy (Admin)

### Book Requests
- `POST /api/book-requests` - Request a book
- `GET /api/book-requests/my-requests` - Get user's requests
- `GET /api/book-requests/queue/{bookId}` - Get book queue
- `POST /api/book-requests/{id}/cancel` - Cancel request
- `POST /api/book-requests/{id}/fulfill` - Fulfill request (Staff)

### Transactions
- `POST /api/transactions/issue` - Issue book (Staff)
- `POST /api/transactions/return` - Return book (Staff)
- `POST /api/transactions/{id}/renew` - Renew book
- `GET /api/transactions/my-active` - Get active transactions
- `GET /api/transactions/overdue` - Get overdue transactions (Staff)

### Fines
- `GET /api/fines/my-fines` - Get user's fines
- `GET /api/fines/my-unpaid` - Get unpaid fines
- `POST /api/fines/create` - Create custom fine (Staff)
- `POST /api/fines/{id}/pay` - Record fine payment (Staff)
- `POST /api/fines/{id}/waive` - Waive fine (Admin)

### Payments
- `POST /api/payments/initiate` - Initiate PayHere payment
- `POST /api/payments/direct` - Process direct payment (Staff)
- `POST /api/payments/notify` - PayHere webhook
- `GET /api/payments/my-payments` - Get payment history

### Notifications
- `GET /api/notifications/my-notifications` - Get notifications
- `POST /api/notifications/{id}/mark-read` - Mark as read
- `GET /api/notifications/unread-count` - Get unread count

### Book Reviews & Ratings
- `POST /api/book-reviews` - Create a book review
- `PUT /api/book-reviews/{id}` - Update review (own review only)
- `DELETE /api/book-reviews/{id}` - Delete review (own review only)
- `GET /api/book-reviews/{id}` - Get specific review
- `GET /api/book-reviews/book/{bookId}` - Get reviews for a book
- `GET /api/book-reviews/my-reviews` - Get current user's reviews
- `GET /api/book-reviews/my-review/book/{bookId}` - Get user's review for specific book
- `GET /api/book-reviews/book/{bookId}/summary` - Get review summary with statistics
- `GET /api/books/{id}/reviews` - Get book reviews (convenience endpoint)
- `GET /api/books/{id}/reviews/summary` - Get book review summary (convenience endpoint)

## Configuration

### Database Setup
```sql
CREATE DATABASE library_db;
```

### PayHere Configuration
Update `application.properties` with your PayHere credentials:
```properties
payhere.merchant.id=your-merchant-id
payhere.merchant.secret=your-merchant-secret
```

### Email Configuration
Configure SMTP settings in `application.properties`:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

## Data Models

### Core Entities
- **User**: Library members and staff
- **Book**: Book information with metadata
- **BookCopy**: Individual book copies with tracking
- **LibraryPolicy**: Configurable system policies

### Transaction Entities
- **BookTransaction**: Issue/return/renewal records
- **BookRequest**: Book reservation requests
- **Fine**: Fine records with payment tracking
- **Payment**: Payment transactions

### System Entities
- **Notification**: Multi-channel notifications
- **Activity**: Comprehensive audit logging

## Security Features

- **Role-based Access Control**: Member, Librarian, Admin roles
- **API Security**: JWT token-based authentication
- **Data Validation**: Input validation and sanitization
- **Audit Logging**: Complete activity tracking

## Installation & Setup

1. **Clone the repository**
2. **Configure database** in `application.properties`
3. **Set up PayHere credentials** for payment integration
4. **Configure email settings** for notifications
5. **Run the application**: `mvn spring-boot:run`

## Usage Examples

### Issue a Book
```bash
POST /api/transactions/issue
{
  "userId": 1,
  "bookCopyId": 1,
  "notes": "Standard checkout"
}
```

### Request a Book
```bash
POST /api/book-requests
{
  "bookId": 1,
  "notes": "Need for research"
}
```

### Initiate Payment
```bash
POST /api/payments/initiate
{
  "fineId": 1,
  "method": "PAYHERE"
}
```

## Automated Processes

The system includes several automated scheduled tasks:
- **Overdue Processing**: Every hour
- **Due Reminders**: Daily at 9 AM
- **Request Expiry**: Daily at midnight
- **Fine Reminders**: Daily at 10 AM
- **Payment Cleanup**: Every 6 hours
- **Notification Retry**: Every 30 minutes

## Support

For issues and questions, please refer to the API documentation or create an issue in the repository.

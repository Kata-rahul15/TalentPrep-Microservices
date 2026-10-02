# 🔐 TalentPrep Authentication Service

A production-ready Authentication and Authorization service built with **Spring Boot**, **Spring Security**, **JWT**, **Redis**, **OAuth2**, and **MySQL**.

This project demonstrates modern backend authentication practices including JWT-based authentication, Refresh Tokens, Redis-backed OTP management, OAuth2 social login, Role-Based Access Control (RBAC), secure password recovery, and production-oriented REST APIs.

---

# 🚀 Features

## Authentication

- User Registration
- Secure Login
- Secure Logout
- JWT Access Token Authentication
- Refresh Token Authentication
- Stateless Authentication
- Cookie-Based Authentication

---

## Email Verification

- Email OTP Verification
- OTP Expiration using Redis TTL
- Resend Verification OTP
- Prevent Duplicate Verification
- Secure OTP Validation

---

## Password Recovery

- Forgot Password
- Reset Password
- OTP Validation
- Password Encryption using BCrypt

---

## OAuth2 Login

Supports secure social authentication using Spring Security OAuth2.

### Providers

- Google Login
- GitHub Login

Includes

- Custom OAuth2 Success Handler
- Custom OAuth2 Failure Handler
- Automatic User Registration
- Existing User Login

---

## Authorization

Role-Based Access Control (RBAC)

### Roles

- USER
- ADMIN

Permission-based authorization using Spring Security Method Security.

---

## User Features

- Register
- Login
- Logout
- Verify Email
- Resend OTP
- Forgot Password
- Reset Password
- View Profile

---

# 🔒 Security Features

- Spring Security 6
- JWT Authentication
- Refresh Tokens
- BCrypt Password Hashing
- Redis Token Blacklisting
- Redis OTP Storage
- HttpOnly Cookies
- Secure Cookie Configuration
- SameSite Cookie Protection
- Custom JWT Authentication Filter
- Stateless Session Management
- CORS Configuration
- CSRF Disabled for REST APIs
- Global Exception Handling
- Request Validation

---

# 🏗️ Architecture

```
                Client
                   │
                   ▼
           REST Controllers
                   │
                   ▼
            Service Layer
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
      Redis             MySQL Database
   OTP / Blacklist
         ▲
         │
    Spring Security
         │
         ▼
     Custom JWT Filter
```

---

# 🔄 Authentication Flow

```
User Login
      │
      ▼
Validate Credentials
      │
      ▼
Generate Access Token
      │
      ▼
Generate Refresh Token
      │
      ▼
Store Refresh Token
      │
      ▼
Return JWT Cookie
      │
      ▼
Access Protected APIs
      │
      ▼
JWT Filter Validation
      │
      ▼
Authorized
```

---

# 📧 Registration Flow

```
User Registers
       │
       ▼
Validate Request
       │
       ▼
Encrypt Password
       │
       ▼
Store User
       │
       ▼
Generate OTP
       │
       ▼
Store OTP in Redis
       │
       ▼
Send Verification Email
       │
       ▼
Verify OTP
       │
       ▼
Activate Account
```

---

# 🔑 Password Reset Flow

```
Forgot Password
        │
        ▼
Generate OTP
        │
        ▼
Store OTP in Redis
        │
        ▼
Send Email
        │
        ▼
Verify OTP
        │
        ▼
Reset Password
```

---

# 🚪 Logout Flow

```
User Logout
      │
      ▼
Extract JWT
      │
      ▼
Blacklist JWT in Redis
      │
      ▼
Delete Refresh Token
      │
      ▼
Clear Authentication Cookies
```

---

# 📂 Project Structure

```
src
├── Controller
├── DTO
├── Entity
├── Exception
├── OAuth
├── Repository
├── Security
├── Service
├── config
└── resources
    └── templates
        └── email
```

---

# 🛠️ Tech Stack

- Java 17
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- MySQL
- Redis
- JWT (JJWT)
- OAuth2 Client
- Thymeleaf
- Maven
- Lombok
- Jakarta Validation

---

# 📌 REST API

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Register User |
| POST | `/login` | Login |
| POST | `/logout` | Logout |
| POST | `/send-verify-otp` | Verify Email |
| POST | `/resend-otp` | Resend Verification OTP |
| POST | `/send-reset-otp` | Send Password Reset OTP |
| POST | `/forgot-password` | Verify Password Reset OTP |
| POST | `/reset-password` | Reset Password |
| GET | `/profile` | User Profile |

---

# 📧 Email Templates

- Welcome Email
- Account Verification OTP
- Password Reset OTP

Built using Thymeleaf HTML templates.

---

# 🚀 Future Roadmap

- Kafka-based Email Microservice
- API Gateway
- Docker
- Kubernetes
- OpenAPI / Swagger
- Rate Limiting
- Prometheus & Grafana Monitoring
- GitHub Actions CI/CD
- Multi-Factor Authentication (MFA)

---

# 💡 What This Project Demonstrates

- Production-ready Authentication
- Secure REST API Design
- Spring Security
- JWT Authentication
- OAuth2 Social Login
- Redis Integration
- Role-Based Authorization
- Email Verification
- Password Recovery
- Exception Handling
- Layered Architecture
- Clean Code Practices

---

## ⭐ If you found this project helpful, consider giving it a star!

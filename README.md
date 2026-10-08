# ProjectFlow: Academic Project Evaluation System

A comprehensive full-stack Java/React application for digitizing the academic project paper lifecycle, from student submission through mentor review, cluster head approval, and final evaluation.

## Features

- **Role-Based Access Control**: Four distinct roles (Student, Mentor, Cluster Head, Admin)
- **Authentication**: JWT-based secure authentication with BCrypt password hashing.
- **Project Management**: Create, assign, and track academic projects and team members.
- **Workflow Automation**: Automated state transitions and notifications (Draft → Submitted → Reviewed → Approved → Evaluated).
- **File Management**: Secure, local PDF storage for project submissions with automatic versioning.
- **Multi-Level Evaluation**: Distinct scoring systems for Mentor reviews and Final Evaluations.
- **Analytics & Dashboards**: Role-specific dashboards with insights, metrics, and activity tracking.
- **Responsive Modern UI**: Built with React, Tailwind CSS, and shadcn-style components.

## Architecture & Tech Stack

### Backend
- Java 17+
- Spring Boot 3.2.x (Web, Data JPA, Security, Validation)
- MySQL 8.x
- JWT (jjwt 0.12.x)
- Maven / Maven Wrapper

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios, React Hook Form, Zod
- Framer Motion, Lucide React, Recharts

## Setup & Running Locally

### 1. Database Setup
Ensure you have MySQL installed and running on port 3306.
Create the database:
```sql
CREATE DATABASE project_evaluation_db;
```

### 2. Backend Setup
1. Open the `backend/src/main/resources/application.yml` file and configure your database credentials (`DB_USERNAME`, `DB_PASSWORD`) or export them as environment variables.
2. From the `backend` directory, start the Spring Boot application using the Maven Wrapper:
```bash
cd backend
./mvnw spring-boot:run
```
(If you are on Windows, use `.\mvnw.cmd spring-boot:run`)
The backend will run on `http://localhost:8080`.

### 3. Frontend Setup
Make sure you have Node.js and npm installed.
1. From the `frontend` directory, install dependencies:
```bash
cd frontend
npm install
```
2. Start the Vite development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Demo Data & Accounts
When the backend starts for the first time, a `DataSeeder` automatically populates the database with demo users, roles, projects, milestones, notifications, and activity logs.

**Demo Credentials:**
- **Admin**: admin@example.com / Demo@1234
- **Cluster Head**: clusterhead@example.com / Demo@1234
- **Mentor**: mentor@example.com / Demo@1234
- **Student**: student@example.com / Demo@1234

## API Documentation
The API is documented using Swagger / OpenAPI. Once the backend is running, you can access the interactive Swagger UI at:
- `http://localhost:8080/swagger-ui/index.html`
# MINI-PROJECT

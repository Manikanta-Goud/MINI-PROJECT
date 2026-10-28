# ProjectFlow: Academic Project Evaluation System

A comprehensive full-stack Java/React application for digitizing the academic project paper lifecycle, from student submission through mentor review, cluster head approval, and final evaluation.

## Features

- **Role-Based Access Control**: Four distinct roles (Student, Mentor, Cluster Head, Admin)
- **Authentication**: JWT-based secure authentication with BCrypt password hashing.
- **Project Management**: Create, assign, and track academic projects and team members.
- **Workflow Automation**: Server-enforced state transitions (Draft → Submitted → Mentor Review → Revision → Verified → Graded → Closed), notifications, and audit events.
- **File Management**: Secure PDF/Word storage with automatic versioning and database file references. The local profile uses `uploads/`; the production profile points to a persistent mounted storage volume.
- **Cluster Isolation**: Students, mentors, and cluster heads can only access teams and submissions in their assigned scope; administrators retain institution-wide visibility.
- **Multi-Level Evaluation**: Distinct scoring systems for Mentor reviews and Final Evaluations.
- **Analytics & Dashboards**: Role-specific dashboards with insights, metrics, and activity tracking.
- **Responsive Modern UI**: Built with React, Tailwind CSS, and shadcn-style components.

## Architecture & Tech Stack

### Backend
- Java 17+
- Spring Boot 3.2.x (Web, Data JPA, Security, Validation)
- PostgreSQL (Supabase in production)
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

### 1. Database and file storage setup
For local development, the default profile uses an in-memory H2 database. To use the local PostgreSQL service:
```bash
docker compose up -d
```

For Supabase, create a project and copy its PostgreSQL connection details from **Project Settings → Database → Connection string**. Use the **Session pooler** connection string for application deployments. Convert it to a JDBC URL by changing the prefix to `jdbc:postgresql://` and append `?sslmode=require&prepareThreshold=0`. The `prepareThreshold=0` option prevents prepared-statement issues with Supabase's transaction pooler.

Create a local `.env` file from the checked-in template:
```bash
cp .env.example .env
```

Replace the three Supabase placeholders in `.env` with the values from your project. The production profile automatically loads `.env` when started from either the repository root or the `backend` directory. It uses the PostgreSQL driver already included in the backend. `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` remain supported as generic fallbacks for local or self-hosted PostgreSQL. The real `.env` is ignored by Git and must never be committed.

#### Supabase Storage S3 configuration

The production profile stores uploaded PDFs in Supabase Storage through its S3-compatible API:

1. Open **Storage → Configuration → S3** in Supabase and enable the S3 protocol connection.
2. Copy the endpoint and region into `.env`.
3. Select **New access key**, create an access key, and copy the secret immediately.
4. Create a private bucket named `submissions`, or update `SUPABASE_S3_BUCKET` with your bucket name.

Add these values to `.env`:
```env
SUPABASE_S3_ENDPOINT=https://<project-ref>.storage.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=ap-south-1
SUPABASE_S3_ACCESS_KEY=<s3-access-key>
SUPABASE_S3_SECRET_KEY=<s3-secret-key>
SUPABASE_S3_BUCKET=submissions
```

The S3 credentials stay on the backend and must never be sent to the frontend or committed to Git.

### 2. Backend Setup
1. In Supabase, open **Project Settings → Database → Connection string**, select **Session pooler**, and copy the host, port, database, user, and password into `.env`.
2. In the Supabase SQL Editor, no tables need to be created manually: the production profile uses JPA with `ddl-auto: update` and creates/updates the application tables on first startup. For production deployments, replace this with versioned migrations before going live.
3. Start the backend using the Maven Wrapper:
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
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

**Demo Credentials (H2/default profile):**
- **Admin**: admin@college.edu / Admin@1234
- **Cluster Head**: ch1@college.edu / Cluster@1234
- **Mentor**: mentor1@college.edu / Mentor@1234
- **Student**: student1@college.edu / Student@1234

### Workflow API

Submission lifecycle transitions are validated on the server:
```http
POST /api/sections/papers/{paperId}/transition
Content-Type: application/json

{"state":"MENTOR_REVIEW","comment":"Ready for mentor review"}
```
Every accepted transition is recorded in `submission_events` and is visible through `GET /api/sections/papers/{paperId}/events`. Cluster-scoped reads and writes are checked independently of the frontend.

## API Documentation
The API is documented using Swagger / OpenAPI. Once the backend is running, you can access the interactive Swagger UI at:
- `http://localhost:8080/swagger-ui/index.html`
# MINI-PROJECT

# Cinema Nepal

A community-driven hub for Nepali movies — honest reviews and worth-watching polls, not just ratings.

## Features

- Browse movies currently on cinema and by genre
- Community reviews on each movie
- "Worth watching?" polls (worth / not worth)
- Admin login to manage movie listings, with poster uploads stored on S3

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), served via Nginx |
| Backend | Laravel (PHP 8.2) |
| Database | MySQL 8 |
| File storage | Amazon S3 |
| Containerization | Docker, multi-stage builds |
| Hosting | AWS (ECS Fargate, RDS, ALB, ECR, S3, IAM) |

## Entity-relationship diagram

Core tables: `users`, `movies`, `reviews`, and `poll_votes`. Reviews and poll votes can optionally be tied to a logged-in user (nullable `user_id`), so anonymous submissions are also supported.

```mermaid
erDiagram
  USERS ||--o{ REVIEWS : writes
  USERS ||--o{ POLL_VOTES : casts
  MOVIES ||--o{ REVIEWS : receives
  MOVIES ||--o{ POLL_VOTES : receives
  USERS {
    bigint id PK
    string name
    string email
    string password
    string role
    timestamp created_at
  }
  MOVIES {
    bigint id PK
    string title
    string genre
    smallint release_year
    string poster_url
    string trailer_url
    text description
  }
  REVIEWS {
    bigint id PK
    bigint movie_id FK
    bigint user_id FK
    string reviewer_name
    text body
  }
  POLL_VOTES {
    bigint id PK
    bigint movie_id FK
    bigint user_id FK
    enum vote
  }
```

## AWS architecture

The app runs as two independently deployed services on **ECS Fargate**, each behind its own **Application Load Balancer (ALB)**, with a managed **RDS MySQL** database for persistence and **S3** for durable poster storage.

```mermaid
graph TD
  Browser["Browser"] -->|"HTTP :80"| FrontendALB["Frontend ALB"]
  Browser -->|"HTTP :8000"| BackendALB["Backend ALB"]
  FrontendALB --> FrontendTask["Frontend task<br/>Nginx + React"]
  BackendALB --> BackendTask["Backend task<br/>Laravel API"]
  BackendTask --> RDS[("RDS MySQL<br/>nepali_cinema_hub")]
  BackendTask -->|"IAM task role"| S3[("S3 bucket<br/>poster uploads")]
  ECR["ECR"] -.->|"pulls image"| FrontendTask
  ECR -.->|"pulls image"| BackendTask
```

### How it works

- **Browser** loads the React app from the frontend ALB, then calls the backend API directly (client-side) through the backend ALB — the two are separate public entry points rather than one unified domain.
- **Frontend ALB** (port 80) is the entry point for the static site. It forwards traffic to whichever frontend task is currently healthy.
- **Backend ALB** (port 8000) is the entry point for the API. Laravel's built-in server (`php artisan serve`) listens on this port inside the container.
- **ECS Fargate** runs both the frontend and backend as serverless containers — no EC2 instances to patch or manage. Each service scales its task count independently.
- **ECR** (Elastic Container Registry) stores the Docker images built locally and pushed via `docker push`. ECS pulls from here on every deployment.
- **RDS MySQL** is a managed database instance, kept in a private security-group boundary — only the backend task's security group is allowed to reach it on port 3306.
- **S3** stores poster images uploaded through the admin panel. Fargate containers are ephemeral — anything written to a container's local disk is lost the moment that task restarts or redeploys, so uploads are written directly to S3 instead of local storage. The backend task authenticates to S3 using an **IAM task role** (`cinema-nepal-ecs-task-role`), not hardcoded AWS keys, so credentials are short-lived and scoped to just this task.
- **Security groups** enforce the boundaries: the RDS security group only accepts inbound MySQL traffic from the backend ECS security group, not from the public internet.

### Why two load balancers instead of one

The frontend and backend are deployed as fully separate services with independent scaling, deployments, and health checks. Using two ALBs keeps that separation clean, at the cost of running two load balancers instead of one (the main ongoing AWS cost for this project). A single shared ALB with path-based routing (e.g. `/api/*` → backend, `/*` → frontend) is a common way to reduce this cost if needed later.

### Why S3 instead of local disk

Early on, poster uploads were saved to the container's local filesystem and served via a `storage:link` symlink. That worked until the ECS service was scaled down and back up — the new container started fresh with none of the previously uploaded files, since nothing outside of RDS was actually persistent. Moving uploads to S3 fixes this: images now survive deployments, restarts, and scaling events, because they live outside the container entirely.

## Local development

```bash
git clone https://github.com/suvkshyaa/Cinema-Nepal.git
cd Cinema-Nepal
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- MySQL: localhost:3307 (mapped to avoid clashing with local installs)

Locally, poster uploads still use the `public` disk by default. Set `AWS_BUCKET`, `AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` in `.env` if you want to test against S3 locally too.

## Deployment

The production images are built and pushed to ECR manually:

```bash
docker build -t cinema-nepal-backend ./backend
docker tag cinema-nepal-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/cinema-nepal-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/cinema-nepal-backend:latest
```

Then force a new ECS deployment to pick up the new image:

```bash
aws ecs update-service --cluster cinema-nepal-cluste --service backend-service --force-new-deployment
```

The same pattern applies to the frontend, with `VITE_API_URL` passed as a build arg pointing at the backend ALB's DNS name.

### Required backend environment variables

| Variable | Purpose |
|---|---|
| `APP_KEY` | Laravel encryption key |
| `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | RDS connection |
| `AWS_BUCKET`, `AWS_DEFAULT_REGION` | S3 bucket for poster uploads (credentials come from the ECS task role, not env vars) |
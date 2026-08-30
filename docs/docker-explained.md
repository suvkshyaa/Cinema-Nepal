# Understanding Docker for Nepali Cinema Hub

## 1. What Docker actually solves

Before Docker: "it works on my machine" is a real problem. Your Laravel app needs PHP 8.2, specific extensions, Composer, the right MySQL version, Node for the frontend build — all installed *correctly* and *matching* across your laptop, your teammate's laptop, and the server. One mismatch and things break in confusing ways.

**Docker's idea:** package the application together with everything it needs to run (the runtime, libraries, system tools) into a single unit called an **image**. That image runs identically anywhere Docker is installed — your Windows machine, a teammate's Mac, an AWS server, a Kubernetes cluster. No more "works on my machine."

## 2. Core vocabulary

| Term | What it means | Real-world analogy |
|---|---|---|
| **Image** | A read-only blueprint/snapshot — your app + its environment, frozen | A recipe |
| **Container** | A running instance of an image | A dish cooked from that recipe |
| **Dockerfile** | The instructions to build an image, step by step | The recipe's written steps |
| **docker-compose** | A tool to define and run *multiple* containers together as one system | A meal plan combining several recipes |
| **Registry** (e.g. Docker Hub) | Where built images are stored/shared | A cookbook library |

You can run many containers from the same image (like cooking the same recipe multiple times), and each container is isolated from the others unless you explicitly connect them.

## 3. Why we have TWO Dockerfiles

Our app is 3-tier: frontend, backend, database. Each tier has a *completely different* runtime:
- **Frontend** needs Node.js to *build* the React app, but once built, it's just static HTML/CSS/JS — it doesn't need Node.js to *run*.
- **Backend** needs PHP + Composer + Laravel's dependencies to run continuously (it's a live server handling requests).
- **Database** — we don't write a Dockerfile at all; we use the official, pre-built `mysql:8.0` image from Docker Hub. No need to reinvent MySQL.

So: one Dockerfile per tier that needs custom building (frontend, backend), and an off-the-shelf image for MySQL.

## 4. Reading the backend Dockerfile, line by line

```dockerfile
FROM php:8.2-cli
```
Start from an official base image that already has PHP 8.2 installed. We're building *on top of* someone else's image — this is the norm in Docker, not a shortcut.

```dockerfile
RUN apt-get update && apt-get install -y git unzip libzip-dev libpng-dev \
    && docker-php-ext-install pdo pdo_mysql zip
```
Laravel needs specific PHP extensions (`pdo_mysql` to talk to MySQL, `zip` for Composer packages). We install them here, once, baked into the image.

```dockerfile
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
```
A neat trick: instead of installing Composer the long way, we copy the Composer *binary* directly from the official `composer` image into ours.

```dockerfile
WORKDIR /var/www/html
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize
```
This ordering is deliberate, not accidental — it's a **caching optimization**. Docker builds in layers, and each instruction is a layer. If `composer.json` hasn't changed, Docker reuses the cached "install dependencies" layer instead of re-downloading everything, even if you changed a controller file. We copy dependency files first, install, *then* copy the rest of the code. This makes rebuilds much faster.

```dockerfile
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```
The command that runs when the container **starts**. `--host=0.0.0.0` (not `127.0.0.1`) matters a lot here — inside a container, `127.0.0.1` only means "this container," and other containers/your browser couldn't reach it. `0.0.0.0` means "listen on all network interfaces," so it's actually reachable from outside the container.

## 5. Reading the frontend Dockerfile — multi-stage builds

```dockerfile
FROM node:20-alpine AS build
...
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```
This is a **multi-stage build** — two `FROM` lines in one file. Why: we need Node.js to *build* the React app (`npm run build` produces static files in `dist/`), but the final running container should NOT need Node.js at all — it just needs to serve static files, which Nginx does far more efficiently and with a much smaller image size.

Stage 1 (`build`) is a temporary "workshop" — it does the building and gets thrown away. Stage 2 only copies the *finished output* (`/app/dist`) into a clean, lightweight Nginx image. The final image never contains Node.js, npm, or your source code — just the built HTML/CSS/JS. Smaller, faster, more secure.

## 6. docker-compose.yml — orchestrating all three together

A single container is one recipe. Our app needs three running *at once*, aware of each other. `docker-compose.yml` describes that:

```yaml
services:
  mysql: ...
  backend: ...
  frontend: ...
```
Each `service` becomes its own container. Compose creates a private network so containers can reach each other **by service name** — this is key:

```yaml
DB_HOST: mysql
```
Inside the `backend` container, `mysql` isn't a random word — Docker's internal DNS resolves it to the `mysql` container's address. This only works *between containers on the same compose network*; it wouldn't work from your Windows host directly (that's why the ports are also mapped out to `localhost`).

```yaml
depends_on:
  mysql:
    condition: service_healthy
```
This tells Compose: "don't start the backend until MySQL is actually ready to accept connections" (not just "started," but genuinely healthy) — avoiding the classic race condition where the backend crashes because MySQL hasn't finished initializing yet.

```yaml
ports:
  - "5173:80"
```
Format is `"host_port:container_port"`. Inside the frontend container, Nginx listens on port 80 (the standard). We map that to `5173` on your actual Windows machine, so `localhost:5173` in your browser reaches it.

## 7. Step-by-step: running it

1. **Copy the Docker files** into your real project folder (`backend/Dockerfile`, `backend/.dockerignore`, `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.dockerignore`, `docker-compose.yml`, `.env.example`).

2. **Generate a Laravel APP_KEY** (used for encrypting sessions/cookies — every Laravel app needs one):
   ```powershell
   cd backend
   php artisan key:generate --show
   ```
   Copy the output (looks like `base64:AbCdEf123...=`).

3. **Create the root `.env` file** — copy `.env.example` to `.env` in the project root, and paste your key:
   ```
   APP_KEY=base64:AbCdEf123...=
   ```
   `docker-compose` automatically reads a `.env` file sitting next to it.

4. **Stop any local dev servers** (`php artisan serve`, `npm run dev`) — they'd otherwise fight Docker for the same ports.

5. **Build and start everything:**
   ```powershell
   docker compose up --build
   ```
   `--build` forces Docker to build fresh images from your Dockerfiles (not reuse anything cached from a previous run). This step downloads base images, installs dependencies, builds the React app, and starts all 3 containers — expect a few minutes the first time.

6. **Set up the database** (only needed once, or after wiping the `mysql_data` volume):
   ```powershell
   docker compose exec backend php artisan migrate --seed
   ```
   `exec` runs a command *inside* an already-running container — here, we're asking the `backend` container to run Artisan's migration command for us.

7. **Visit `http://localhost:5173`** — the entire stack is now running fully containerized.

## 8. Useful commands to know (and explain to others)

| Command | What it does |
|---|---|
| `docker compose up` | Start all services (use `-d` to run in the background) |
| `docker compose down` | Stop and remove all containers (data in named volumes like `mysql_data` survives) |
| `docker compose logs backend` | See the Laravel container's output/errors |
| `docker compose ps` | List running containers and their status |
| `docker compose exec backend bash` | Open a shell *inside* the backend container — useful for debugging |
| `docker compose build` | Rebuild images without starting containers |

## 9. Why this matters for the CI/CD story

This is the payoff for the next stages: once your app is packaged as Docker images, Jenkins can build these exact same images automatically on every code push, push them to a registry, and Kubernetes can run them anywhere — your laptop, AWS, any cloud — with zero "works on my machine" surprises. Everything from here on builds on top of what you just did.

# nPanel System — Self-Hosted Infrastructure

Docker Compose stack for running PostgreSQL, PgBouncer, and MinIO locally and on GCP Compute Engine.

```
system/
├── docker-compose.yml          ← local development (all ports exposed)
├── docker-compose.prod.yml     ← production overrides (nginx + SSL, no public ports)
├── .env.example                ← copy to .env and fill in secrets
├── nginx/
│   ├── nginx.conf              ← main nginx config
│   └── conf.d/storage.conf     ← virtual hosts for MinIO S3 + Console
├── postgres/
│   └── init.sql                ← runs once on first DB init
└── scripts/
    └── init-ssl.sh             ← one-shot SSL cert issuance (production only)
```

---

## Local Development

### 1. Create your `.env` file

```sh
cp .env.example .env
```

Open `.env` and set strong passwords for `POSTGRES_PASSWORD` and `MINIO_ROOT_PASSWORD`. Leave `MINIO_SERVER_URL` and `MINIO_BROWSER_REDIRECT_URL` blank for local.

### 2. Start all services

```sh
docker compose up -d
```

### 3. Verify everything is running

```sh
docker compose ps
```

All four containers should show status `Up` (minio-init will exit after creating the bucket — that is expected).

### 4. Service endpoints (local)

| Service | URL | Notes |
|---------|-----|-------|
| PostgreSQL (direct) | `postgresql://localhost:5432/npanel` | Use for migrations |
| PgBouncer (pooled) | `postgresql://localhost:6432/npanel` | Use this in your app |
| MinIO S3 API | `http://localhost:9000` | S3-compatible endpoint |
| MinIO Console | `http://localhost:9001` | Web UI — login with MINIO_ROOT_USER/PASSWORD |

### 5. Useful commands

```sh
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f postgres
docker compose logs -f minio

# Stop everything (keeps data volumes)
docker compose down

# Stop and wipe all data (destructive!)
docker compose down -v

# Connect to PostgreSQL directly
docker compose exec postgres psql -U npanel -d npanel

# Open a MinIO mc shell
docker compose exec minio mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
```

---

## Production (GCP Compute Engine)

### Prerequisites

- GCE VM with Docker + Docker Compose v2 installed
- Firewall rules: TCP 80 and 443 open inbound
- DNS A records pointing to the VM's external IP:
  - `storage.nisccloud.com`
  - `storage-console.nisccloud.com`

### 1. Copy files to the VM

```sh
gcloud compute scp --recurse ./system user@your-vm:/opt/npanel-system
```

### 2. Set up `.env` on the VM

```sh
cd /opt/npanel-system
cp .env.example .env
# Edit .env — set strong passwords + fill in domain names
nano .env
```

### 3. Start the production stack (no SSL yet)

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Issue SSL certificates (one time only)

```sh
chmod +x scripts/init-ssl.sh
cd scripts && ./init-ssl.sh
```

### 5. Restart nginx to load the new certs

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

Certbot will automatically renew certificates every 12 hours from this point.

---

## Connection strings for the app

Once running, use these values in `apps/server/.env.production`:

```env
# Replace Supabase DATABASE_URL with PgBouncer (port 6432 locally, internal on prod)
DATABASE_URL=postgresql://npanel:<password>@localhost:6432/npanel

# MinIO S3-compatible endpoint
# Local:
S3_ENDPOINT=http://localhost:9000
# Production:
S3_ENDPOINT=https://storage.nisccloud.com

S3_ACCESS_KEY=<MINIO_ROOT_USER>
S3_SECRET_KEY=<MINIO_ROOT_PASSWORD>
S3_BUCKET=npanel-uploads
S3_REGION=us-east-1
```

To get it running locally.

Prerequisites
Make sure Docker Desktop is running on your system. Verify with:

docker --version
docker compose version
Step 1 — Create your .env file
Open a terminal in the system/ folder:


copy .env.example .env
Open .env and fill in at minimum these values (everything else has safe defaults):

POSTGRES_PASSWORD=pick_a_strong_password
MINIO_ROOT_PASSWORD=pick_a_strong_password
GRAFANA_ADMIN_PASSWORD=pick_a_strong_password
PGADMIN_PASSWORD=pick_a_strong_password
PGADMIN_EMAIL=admin@nisccloud.com
Leave MINIO_SERVER_URL blank for local — it's only needed in production.

Step 2 — Choose what to start
Option A — Infrastructure only (Postgres + PgBouncer + MinIO):

docker compose up -d
Option B — Infrastructure + full monitoring stack (recommended):

docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
Step 3 — Watch it come up
docker compose ps
Wait for all containers to show Up. The nPanel-System-minio-init container will show Exited (0) — that's expected, it creates the bucket and stops.

Watch live logs if you want to see progress:

docker compose logs -f
Or per service:

docker compose logs -f postgres
docker compose logs -f minio
Step 4 — Verify everything works
Hit each URL in your browser:

Service	URL	Login
MinIO Console
http://localhost:9001
minioadmin / your MINIO_ROOT_PASSWORD
pgAdmin
http://localhost:5050
your PGADMIN_EMAIL / PGADMIN_PASSWORD
Grafana
http://localhost:3100
admin / your GRAFANA_ADMIN_PASSWORD
Uptime Kuma
http://localhost:3102
create account on first visit
Prometheus
http://localhost:9090
none
Alertmanager
http://localhost:9093
none
To connect pgAdmin to your local Postgres, add a new server in the pgAdmin UI:

Host: postgres (Docker network name)
Port: 5432
Username: npanel
Password: your POSTGRES_PASSWORD
Useful commands
# Stop everything (data is preserved in volumes)
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down
# Stop and wipe ALL data (destructive — fresh start)
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down -v
# Restart a single service
docker compose restart minio
# Check resource usage
docker stats

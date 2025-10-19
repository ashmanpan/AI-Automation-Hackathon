# On-Premises Deployment Guide

This guide covers deploying the Hackathon Platform on your own infrastructure using Docker and MinIO.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [Production Deployment](#production-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware Requirements

**Minimum (Development/Testing):**
- 2 CPU cores
- 4 GB RAM
- 20 GB storage

**Recommended (Production - up to 100 participants):**
- 4 CPU cores
- 8 GB RAM
- 100 GB storage (50 GB for database, 50 GB for file storage)

**Large Scale (200+ participants):**
- 8 CPU cores
- 16 GB RAM
- 200+ GB storage

### Software Requirements

- **Operating System**: Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+) or macOS
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (for local development)
- **Git**: For cloning repository

### Network Requirements

- Ports 5000 (backend), 5432 (PostgreSQL), 9000 (MinIO API), 9001 (MinIO Console)
- Internet connection for OpenAI API (AI grading)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Frontend                       │
│            (React - Port 3000)                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Backend API                        │
│        (Node.js/Express - Port 5000)            │
└─────┬──────────────────────────────┬────────────┘
      │                              │
      ▼                              ▼
┌─────────────────┐        ┌──────────────────────┐
│   PostgreSQL    │        │       MinIO          │
│   (Port 5432)   │        │  (Ports 9000/9001)   │
│   [Database]    │        │  [Object Storage]    │
└─────────────────┘        └──────────────────────┘
```

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/hackathon-platform.git
cd hackathon-platform
```

### 2. Configure Environment

```bash
cd backend
cp .env.onprem .env

# Edit .env with your values
nano .env
```

Update these critical values:
- `DB_PASSWORD`: Strong password for PostgreSQL
- `JWT_SECRET`: Random string (min 16 characters)
- `OPENAI_API_KEY`: Your OpenAI API key

### 3. Start Infrastructure

```bash
cd ..
docker-compose up -d postgres minio
```

### 4. Wait for Services

```bash
# Wait 30 seconds for PostgreSQL to initialize
sleep 30

# Verify services are running
docker-compose ps
```

### 5. Run Database Migrations

```bash
cd backend
npm install
npm run migrate
```

### 6. Start Backend

```bash
npm run dev
```

Your backend is now running at `http://localhost:5000`

### 7. Verify Setup

```bash
# Check health
curl http://localhost:5000/api/health

# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Detailed Setup

### Step 1: Install Docker and Docker Compose

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**CentOS/RHEL:**
```bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**macOS:**
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Docker Compose is included
```

### Step 2: Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Step 3: Configure Database

Edit `docker-compose.yml` if you want custom PostgreSQL settings:

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: your_secure_password  # Change this
  volumes:
    - postgres_data:/var/lib/postgresql/data
  # Optional: Expose to host
  # ports:
  #   - "5432:5432"
```

### Step 4: Configure MinIO

Edit `docker-compose.yml` for MinIO settings:

```yaml
minio:
  environment:
    MINIO_ROOT_USER: minioadmin  # Change in production
    MINIO_ROOT_PASSWORD: minioadmin  # Change in production
  volumes:
    - minio_data:/data
```

### Step 5: Configure Backend

Create `.env` from template:

```bash
cd backend
cp .env.onprem .env
```

Edit `.env`:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hackathon_platform
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_secret_key_minimum_16_characters_long

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=hackathon-files

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# AI Grading
AI_GRADING_ENABLED=true
AI_GRADING_AUTO=false
```

### Step 6: Start Services

```bash
# Start PostgreSQL and MinIO
docker-compose up -d postgres minio

# Check logs
docker-compose logs -f postgres
docker-compose logs -f minio

# Verify containers are healthy
docker-compose ps
```

### Step 7: Access MinIO Console

1. Open browser: `http://localhost:9001`
2. Login:
   - Username: `minioadmin`
   - Password: `minioadmin`
3. Verify `hackathon-files` bucket exists

### Step 8: Initialize Database

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npm run migrate

# Verify admin user exists
docker exec -it hackathon-postgres psql -U postgres -d hackathon_platform -c "SELECT username, role FROM users WHERE role='admin';"
```

### Step 9: Start Backend

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

### Step 10: Test API

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Should return JWT token
```

---

## Production Deployment

### Using PM2 (Process Manager)

#### Install PM2

```bash
npm install -g pm2
```

#### Create PM2 Ecosystem File

```bash
cd backend
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'hackathon-backend',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
EOF
```

#### Start with PM2

```bash
# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it shows

# Monitor
pm2 monit
```

#### PM2 Commands

```bash
# Status
pm2 status

# Logs
pm2 logs hackathon-backend

# Restart
pm2 restart hackathon-backend

# Stop
pm2 stop hackathon-backend

# Delete
pm2 delete hackathon-backend
```

### Using Systemd Service

Create service file:

```bash
sudo nano /etc/systemd/system/hackathon-backend.service
```

```ini
[Unit]
Description=Hackathon Platform Backend
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/hackathon-platform/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /path/to/hackathon-platform/backend/dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hackathon-backend
sudo systemctl start hackathon-backend
sudo systemctl status hackathon-backend
```

### Reverse Proxy with Nginx

Install Nginx:

```bash
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL
```

Configure:

```bash
sudo nano /etc/nginx/sites-available/hackathon-platform
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for real-time updates
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    client_max_body_size 10M;
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/hackathon-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx

sudo certbot --nginx -d your-domain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## Monitoring and Maintenance

### Health Checks

```bash
# API health
curl http://localhost:5000/api/health

# Database health
docker exec hackathon-postgres pg_isready -U postgres

# MinIO health
curl http://localhost:9000/minio/health/live
```

### Log Management

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f minio

# PM2 logs
pm2 logs hackathon-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring

```bash
# System resources
htop

# Docker stats
docker stats

# Database size
docker exec hackathon-postgres psql -U postgres -d hackathon_platform -c "SELECT pg_size_pretty(pg_database_size('hackathon_platform'));"

# MinIO storage
docker exec hackathon-minio mc du myminio/hackathon-files
```

---

## Backup and Recovery

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups/hackathon

# Backup database
docker exec hackathon-postgres pg_dump -U postgres hackathon_platform > ~/backups/hackathon/db-$(date +%Y%m%d-%H%M%S).sql

# Automated daily backup (crontab)
crontab -e
# Add this line:
# 0 2 * * * docker exec hackathon-postgres pg_dump -U postgres hackathon_platform > ~/backups/hackathon/db-$(date +\%Y\%m\%d).sql
```

### MinIO Backup

```bash
# Using MinIO Client (mc)
docker exec hackathon-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Mirror to external storage
docker exec hackathon-minio mc mirror myminio/hackathon-files /backup/minio/
```

### Restore Database

```bash
# From backup file
docker exec -i hackathon-postgres psql -U postgres hackathon_platform < ~/backups/hackathon/db-20240115.sql
```

### Complete Backup Script

```bash
#!/bin/bash
BACKUP_DIR=~/backups/hackathon
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec hackathon-postgres pg_dump -U postgres hackathon_platform > $BACKUP_DIR/db-$DATE.sql

# Backup MinIO data
docker exec hackathon-minio mc mirror myminio/hackathon-files $BACKUP_DIR/minio-$DATE/

# Keep only last 7 days
find $BACKUP_DIR -name "db-*" -mtime +7 -delete
find $BACKUP_DIR -name "minio-*" -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $DATE"
```

---

## Troubleshooting

### PostgreSQL Issues

**Cannot connect:**
```bash
# Check if running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**Authentication failed:**
```bash
# Verify password in .env matches docker-compose.yml
# Reset password
docker exec -it hackathon-postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'new_password';"
```

### MinIO Issues

**Connection refused:**
```bash
# Check if running
docker-compose ps minio

# Restart
docker-compose restart minio

# Check endpoint in .env
# For Docker: MINIO_ENDPOINT=minio
# For host: MINIO_ENDPOINT=localhost
```

**Bucket not found:**
```bash
# Create bucket manually
docker exec hackathon-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin
docker exec hackathon-minio mc mb myminio/hackathon-files
```

### Backend Issues

**Module not found:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Find process using port 5000
lsof -i :5000
# Or
netstat -tulpn | grep 5000

# Kill process
kill -9 <PID>
```

### Performance Issues

**Slow database:**
```bash
# Check active queries
docker exec hackathon-postgres psql -U postgres -d hackathon_platform -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';"

# Analyze tables
docker exec hackathon-postgres psql -U postgres -d hackathon_platform -c "VACUUM ANALYZE;"
```

**High memory usage:**
```bash
# Check Docker stats
docker stats

# Increase Docker memory limit
# Edit /etc/docker/daemon.json
{
  "default-ulimits": {
    "memlock": {
      "Hard": -1,
      "Name": "memlock",
      "Soft": -1
    }
  }
}
```

---

## Security Checklist

- [ ] Change default passwords (PostgreSQL, MinIO, admin user)
- [ ] Use strong JWT secret (min 32 characters)
- [ ] Configure firewall (ufw/firewalld)
- [ ] Enable SSL/TLS (Let's Encrypt)
- [ ] Restrict MinIO console access
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup encryption
- [ ] Secure OpenAI API key

---

## Scaling Considerations

### Horizontal Scaling

- Run multiple backend instances behind load balancer
- Use PM2 cluster mode
- Separate database and backend servers

### Database Scaling

- Increase PostgreSQL connection pool
- Add read replicas
- Regular VACUUM and ANALYZE

### Storage Scaling

- Use distributed MinIO setup
- Add more storage volumes
- Implement storage tiers

---

## Support

For issues:
- Check logs first
- Review this guide
- See main README.md
- Create GitHub issue with logs and error messages

#!/usr/bin/env bash
set -e

# directory where docker-compose file lives on the server
APP_DIR=/home/deploy/app
COMPOSE_FILE=$APP_DIR/docker-compose.prod.yml

# ensure directory exists
mkdir -p "$APP_DIR"

# write docker-compose file (overwrite), or you can keep it on server manually
cat > $COMPOSE_FILE <<'EOF'
version: '3.8'
services:
  app:
    image: YOUR_DOCKERHUB_USER/your-backend:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
EOF

# Pull latest image and restart containers
cd "$APP_DIR"
docker-compose -f docker-compose.prod.yml pull --ignore-pull-failures
docker-compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f

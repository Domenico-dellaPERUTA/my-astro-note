#!/bin/bash

set -e

REMOTE_USER="ninja"
REMOTE_HOST="shinobi.local"
REMOTE_DIR="/home/ninja/docker/my-astro"
LOCAL_PROJECT="/Users/ninja/Sviluppi/tmp/my-astro"
LOCAL_WEBAPP="/Library/WebServer/WebApp"

echo "🚀 Avvio deploy su $REMOTE_HOST..."

# 1. Crea le cartelle remote se non esistono
echo "📁 Creo cartelle remote..."
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR /home/ninja/docker/WebApp"

# 2. Copia il progetto
echo "📦 Copio il progetto..."
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='public/WebApp' \
  $LOCAL_PROJECT/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# 3. Copia la cartella WebApp
echo "🖼️  Copio i file WebApp..."
rsync -av $LOCAL_WEBAPP/ $REMOTE_USER@$REMOTE_HOST:/home/ninja/docker/WebApp/

# 4. Avvia Docker sul Raspberry
echo "🐳 Avvio Docker..."
ssh $REMOTE_USER@$REMOTE_HOST "
  cd $REMOTE_DIR
  cp -r /home/ninja/docker/WebApp ./public/WebApp
  docker compose -f docker-compose.prod.yml up -d --build
"

echo "✅ Deploy completato! App disponibile su http://shinobi.local:4321"
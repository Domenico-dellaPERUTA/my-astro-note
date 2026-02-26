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
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR"

# 2. Copia il progetto
echo "📦 Copio il progetto..."
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='public/WebApp' \
  $LOCAL_PROJECT/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# 3. Copia WebApp SOLO se non esiste
echo "🖼️  Controllo file WebApp..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
  if [ ! -d "/home/ninja/docker/my-astro/public/WebApp" ] || [ -z "$(ls -A /home/ninja/docker/my-astro/public/WebApp)" ]; then
    echo "📂 Cartella WebApp non esiste o è vuota, la creo..."
    mkdir -p /home/ninja/docker/my-astro/public/WebApp
  else
    echo "✅ Cartella WebApp già presente, skip copia"
    exit 0
  fi
EOF

# Copia solo se necessario (il comando sopra ha fatto exit 0 se non serve)
if [ $? -eq 0 ]; then
  NEEDS_COPY=$(ssh $REMOTE_USER@$REMOTE_HOST "[ ! -d '/home/ninja/docker/my-astro/public/WebApp' ] || [ -z \"\$(ls -A /home/ninja/docker/my-astro/public/WebApp)\" ] && echo 'yes' || echo 'no'")
  
  if [ "$NEEDS_COPY" = "yes" ]; then
    echo "📤 Copiando file WebApp..."
    rsync -av $LOCAL_WEBAPP/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/public/WebApp/
  fi
fi

# 4. Avvia Docker sul Raspberry
echo "🐳 Avvio Docker..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
  cd /home/ninja/docker/my-astro
  docker compose -f docker-compose.prod.yml down
  docker compose -f docker-compose.prod.yml up -d
  
  echo "⏳ Attendo avvio container..."
  sleep 10
  
  echo "✅ Verifica file WebApp..."
  docker exec my-astro-app ls -la /workspace/public/WebApp/ | head -n 10
EOF

echo "✅ Deploy completato!"
echo "🌐 App: http://shinobi.local:4321"
echo "🗄️  Adminer: http://shinobi.local:8089"
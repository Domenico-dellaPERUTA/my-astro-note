#!/bin/bash

set -e

REMOTE_USER="ninja"
REMOTE_HOST="shinobi.local"
REMOTE_DIR="/home/ninja/docker/my-astro"
LOCAL_PROJECT="/Users/ninja/Sviluppi/tmp/my-astro"
LOCAL_WEBAPP="/Library/WebServer/WebApp"

echo "🚀 Avvio deploy su $REMOTE_HOST..."

# 1. Build locale
echo "-- [1/8] Build locale -----------------------------------"
echo "🔨 Build Astro in locale..."
cd $LOCAL_PROJECT
npm run build
# 1b. Fix vulnerabilità
echo "🔒 Fix vulnerabilità npm..."
npm audit fix
# 2. Installa solo dipendenze di produzione
echo "-- [2/8] Installo dipendenze produzione ----------------"
echo "📦 npm ci --omit=dev..."
npm ci --omit=dev

# 3. Crea cartelle remote con permessi corretti (PRIMA che Docker le tocchi)
echo "-- [3/8] Preparo cartelle remote -----------------------"
echo "📁 Creo cartelle remote..."
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR/dist/client/WebApp $REMOTE_DIR/node_modules"

# 4. Pulizia e reset permessi dist/ sul server
echo "-- [4/8] Pulizia remota --------------------------------"
echo "🧹 Pulizia dist/ e node_modules remoti..."
ssh $REMOTE_USER@$REMOTE_HOST "
  docker compose -f $REMOTE_DIR/docker-compose.prod.yml down 2>/dev/null || true
  docker run --rm -v $REMOTE_DIR:/fix alpine sh -c '
    rm -rf /fix/dist/* /fix/dist/.[!.]* 2>/dev/null
    rm -rf /fix/node_modules/* /fix/node_modules/.[!.]* 2>/dev/null
    chown -R 1000:1000 /fix/dist /fix/node_modules
  '
  mkdir -p $REMOTE_DIR/dist/client/WebApp
"

# 5. Copia dist/ e node_modules sul server
echo "-- [5/8] Copia dist/ e node_modules -------------------"
echo "📦 Copio dist/..."
rsync -av \
  $LOCAL_PROJECT/dist/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/dist/

echo "📦 Copio node_modules (solo produzione)..."
rsync -av \
  $LOCAL_PROJECT/node_modules/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/node_modules/

# 6. Copia file di configurazione Docker
echo "-- [6/8] Copia configurazioni Docker ------------------"
echo "⚙️  Copio configurazioni Docker..."
rsync -av \
  $LOCAL_PROJECT/docker-compose.prod.yml \
  $LOCAL_PROJECT/init-db.sh \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# 7. Copia WebApp solo se necessario
echo "-- [7/8] Copia WebApp ---------------------------------"
echo "🖼️  Controllo file WebApp..."
NEEDS_COPY=$(ssh $REMOTE_USER@$REMOTE_HOST \
  "[ -z \"\$(ls -A '$REMOTE_DIR/dist/client/WebApp')\" ] && echo 'yes' || echo 'no'")

if [ "$NEEDS_COPY" = "yes" ]; then
  echo "📤 Copiando file WebApp..."
  rsync -av $LOCAL_WEBAPP/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/dist/client/WebApp/
else
  echo "✅ Cartella WebApp già presente"
fi

# 8. Deploy Docker
echo "-- [8/8] Deploy Docker --------------------------------"
echo "🐳 Avvio Docker..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
  cd /home/ninja/docker/my-astro

  docker compose -f docker-compose.prod.yml up -d

  echo "⏳ Attendo avvio database..."
  sleep 15

  echo "🔧 Inizializzo database..."
  chmod +x ./init-db.sh
  ./init-db.sh

  echo "⏳ Attendo container app..."
  sleep 10

  echo "✅ Verifica file WebApp..."
  ls -la /home/ninja/docker/my-astro/dist/client/WebApp/ | head -n 10

  echo "📋 Log container app (ultimi 20 righe)..."
  docker logs --tail 20 my-astro-app
EOF

echo ""
echo "✅ Deploy completato!"
echo "🌐 App: http://shinobi.local:4321"
echo "🗄️  Adminer: http://shinobi.local:8089"
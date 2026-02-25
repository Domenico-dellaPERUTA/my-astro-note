#!/bin/bash

echo "🚀 Avvio deploy..."

# Copia WebApp dentro il progetto
echo "📁 Copio i file WebApp..."
cp -r /Library/WebServer/WebApp ./public/WebApp

# Build e avvia
docker compose up -d --build

echo "✅ Deploy completato!"
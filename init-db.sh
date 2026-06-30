#!/bin/bash

set -e

DB_CONTAINER="my-astro-db"
DB_NAME="appunti_db"
DB_USER="root"
DB_PASSWORD="Orione___"
SQL_FILE="create_table_db.sql"

echo "🔧 Inizializzazione database..."

# Aspetta che MariaDB sia pronto
echo "⏳ Attendo avvio MariaDB..."
sleep 5

# Crea utente e permessi
echo "👤 Creo utente applicazione..."
docker exec -i $DB_CONTAINER mariadb -uroot -p"$DB_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
EOF

# Importa lo schema
if [ -f "$SQL_FILE" ]; then
    echo "📄 Importo schema database..."
    docker exec -i $DB_CONTAINER mariadb -uroot -p"$DB_PASSWORD" $DB_NAME < $SQL_FILE
    echo "✅ Schema importato!"
else
    echo "⚠️ File $SQL_FILE non trovato!"
fi

echo "🎉 Inizializzazione completata!"
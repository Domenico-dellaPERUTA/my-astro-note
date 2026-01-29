#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment of my-astro..."

# 1. Build the project
echo "📦 Building the project..."
npm run build

# 2. Preparation of directories and files
echo "📂 Preparing deployment directory..."
sudo mkdir -p /Library/WebServer/notes

echo "🚚 Copying files..."
sudo cp -r dist /Library/WebServer/notes/
sudo cp -r node_modules /Library/WebServer/notes/
sudo cp package.json /Library/WebServer/notes/
sudo cp .env /Library/WebServer/notes/

# 3. Configure launchd
echo "⚙️ Configuring launchd..."
sudo cp com.notes.astro.plist /Library/LaunchDaemons/
sudo chown root:wheel /Library/LaunchDaemons/com.notes.astro.plist
sudo chmod 644 /Library/LaunchDaemons/com.notes.astro.plist

# 4. Configure Apache
echo "⚙️ Configuring Apache..."
sudo cp notes.conf /private/etc/apache2/other/

# 5. Update /etc/hosts
echo "🌐 Updating /etc/hosts..."
if ! grep -q "notes.local" /etc/hosts; then
    sudo sh -c 'echo "127.0.0.1 notes.local" >> /etc/hosts'
fi

# 6. Start/Restart services
echo "🔄 Restarting services..."
sudo launchctl unload /Library/LaunchDaemons/com.notes.astro.plist 2>/dev/null || true
sudo launchctl load -w /Library/LaunchDaemons/com.notes.astro.plist
sudo apachectl restart

echo "✅ Deployment completed! Access the app at http://notes.local"

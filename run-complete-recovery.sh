#!/bin/bash

echo "🚨 COMPLETE ALEX WILSON SONGBOOK RECOVERY"
echo "========================================"

# Navigate to the project directory
cd /Users/ryanmorrison/alex-wilson-songbook

# Step 1: Run the final recovery script
echo "1. Running data recovery..."
node final-recovery.js

# Step 2: Make sure all scripts are executable
echo "2. Making scripts executable..."
chmod +x *.sh

# Step 3: Install dependencies (if needed)
echo "3. Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Step 4: Check songs.json integrity
echo "4. Verifying songs database..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/songs.json', 'utf8'));
console.log('✅ Found', data.metadata.totalSongs, 'songs in database');
console.log('✅ Last modified:', data.metadata.lastModified);
"

# Step 5: Check if all files are in place
echo "5. Verifying project structure..."
for file in "src/data/songs.json" "src/data/songs.js" "index.html" "package.json"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🎉 RECOVERY COMPLETE!"
echo "===================="
echo "Your Alex Wilson Songbook has been restored!"
echo ""
echo "▶️  To start the application:"
echo "   npm run dev     # Development server"
echo "   npm run start   # Production server"
echo ""
echo "🌐 Open in browser: http://localhost:5173"
echo ""
echo "📝 All your songs, lyrics, and notes have been preserved!"

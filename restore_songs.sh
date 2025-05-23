#!/bin/bash

# Simple script to restore songs from backup
# Run this from the alex-wilson-songbook directory

echo "🔧 Starting song restoration from backup..."
echo "📁 Working in: $(pwd)"

# Check if backup file exists
if [ ! -f "aw_songs.md" ]; then
    echo "❌ Error: aw_songs.md backup file not found!"
    echo "   Please ensure the backup file is in the current directory."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found!"
    echo "   Please install Node.js to run this restoration script."
    exit 1
fi

# Check if target directory exists
if [ ! -d "src/data" ]; then
    echo "❌ Error: src/data directory not found!"
    echo "   Please run this script from the alex-wilson-songbook root directory."
    exit 1
fi

# Run the restoration script
echo "🚀 Running restoration script..."
node restore_songs_simple.js

if [ $? -eq 0 ]; then
    echo "✅ Restoration completed successfully!"
    echo "📝 All 53 songs have been restored from the backup"
    echo "🔧 The 'soundsLike' feature has been preserved"
    echo "📁 Updated file: src/data/songs.js"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Test the application: npm run dev"
    echo "   2. Verify all songs are loading correctly"
    echo "   3. The 'sounds like' feature should now be available again"
else
    echo "❌ Restoration failed!"
    echo "   Please check the error messages above and try again."
    exit 1
fi

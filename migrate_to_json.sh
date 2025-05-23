#!/bin/bash

# Complete migration script from markdown to JSON database
# Run this from the alex-wilson-songbook directory

echo "🚀 Starting migration from Markdown to JSON database..."
echo "📁 Working in: $(pwd)"

# Check if backup file exists
if [ ! -f "aw_songs.md" ]; then
    echo "❌ Error: aw_songs.md backup file not found!"
    echo "   Please ensure the backup file is in the current directory."
    exit 1
fi

# Create backup of current songs.js
if [ -f "src/data/songs.js" ]; then
    echo "💾 Backing up current songs.js..."
    cp src/data/songs.js src/data/songs.js.backup.$(date +%Y%m%d_%H%M%S)
fi

# Run the conversion
echo "🔄 Converting markdown to JSON database..."
node convert_to_json.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Your songbook now has:"
    echo "   📊 Persistent data storage (JSON database)"
    echo "   💾 Automatic saving of all changes"
    echo "   🔄 Backup/export functionality"
    echo "   🔍 Enhanced search capabilities"
    echo "   📝 Version tracking for each song"
    echo ""
    echo "📁 New files created:"
    echo "   • src/data/songs.json (primary database)"
    echo "   • src/data/songs.js (updated module)"
    echo "   • src/utils/persistence.js (storage utilities)"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Test the application: npm run dev"
    echo "   2. Make some edits - they'll persist automatically!"
    echo "   3. Export backups using the UI when needed"
    echo "   4. Commit the new JSON file to git for version control"
    echo ""
    echo "🗂️ File structure:"
    echo "   songs.json     → Primary data (commit to git)"
    echo "   songs.js       → JavaScript interface"
    echo "   persistence.js → Auto-save & export utilities"
    echo ""
    echo "🔒 Your data is now:"
    echo "   • Automatically saved after every change"
    echo "   • Backed up in localStorage"
    echo "   • Exportable to markdown anytime"
    echo "   • Version controlled with timestamps"
else
    echo "❌ Migration failed!"
    echo "   Please check the error messages above."
    echo "   Your original files remain unchanged."
    exit 1
fi

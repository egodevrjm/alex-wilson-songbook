#!/bin/bash

# Make the migration script executable
chmod +x migrate-game-attributes.js

echo "Running game attributes migration..."
node migrate-game-attributes.js

echo ""
echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Start the app: npm run dev"
echo "2. Go to Settings"
echo "3. Enable Game Mode"
echo "4. Access the Game tab to start playing!"
echo ""
echo "See GAME_INTEGRATION_GUIDE.md for detailed instructions."

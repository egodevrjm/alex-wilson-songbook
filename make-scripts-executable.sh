#!/bin/bash
# Make scripts executable

chmod +x setup-gemini.sh
chmod +x fix-global-function.sh
chmod +x start-app.sh
chmod +x setup-api-key.sh

echo "Scripts are now executable!"
echo "You can run:"
echo "  - ./setup-gemini.sh to set up Gemini API"
echo "  - ./fix-global-function.sh to fix the global function issue"
echo "  - ./start-app.sh to start both server and client"

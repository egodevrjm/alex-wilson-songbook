#!/bin/bash

# Fix script for the "Failed to generate song Thjis is for Create Song globally" error

echo "Fixing global function issues in Alex Wilson Songbook..."
echo "=================================================="

# Check if .env file exists and has API key
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit the .env file and add your GEMINI_API_KEY"
    exit 1
fi

# Make sure we have the required packages
npm install @google/generative-ai dotenv express cors

# Start the server
echo "Starting server to test API connection..."
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Test API connection
echo "Testing API connection..."
curl -s -X POST http://localhost:3001/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, are you working?","temperature":0.1}' > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Server API is accessible"
else
    echo "❌ Server API is not responding"
    echo "Please check your Gemini API key and server configuration"
fi

# Remind user about global function usage
echo ""
echo "=================================================="
echo "To properly use the global function:"
echo ""
echo "1. Run server.js in one terminal: node server.js"
echo "2. Run the app in another terminal: npm run dev"
echo "3. Open the app in your browser"
echo "4. Use the global function with proper syntax:"
echo ""
echo "   window.createSongFromPrompt('A song about mountains')"
echo ""
echo "   Note: Don't use 'Thjis is for Create Song globally'"
echo "   as this appears to be a typo."
echo ""
echo "5. Or use the test page we've created:"
echo "   test-global-function.html"
echo "=================================================="

# Clean up
kill $SERVER_PID 2>/dev/null
echo ""
echo "Fix script completed. Please follow the instructions above."

#!/bin/bash

# Alex Wilson Songbook - Quick Start Script
# This script helps you get started with the AI image generation features

echo "🎵 Alex Wilson Songbook - AI Image Setup 🎨"
echo "============================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "📝 Please edit .env file and add your GEMINI_API_KEY"
    echo "   You can get an API key from: https://aistudio.google.com/"
    echo ""
    read -p "Press Enter after you've added your API key..."
    echo ""
fi

# Check if API key is set
source .env
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY is not set in .env file"
    echo "📝 Please edit .env file and add your API key"
    echo "   Example: GEMINI_API_KEY=AIzaSyC..."
    exit 1
fi

echo "✅ API key found in .env file"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Test the API connection
echo "🧪 Testing AI image generation..."
echo "   (This may take a moment...)"
echo ""

# Start server in background
echo "🚀 Starting server..."
npm run server > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Test the Imagen API
echo "🔬 Running API tests..."
npm run test-imagen

# Ask if user wants to start the full application
echo ""
echo "🎉 Setup complete!"
echo ""
read -p "Would you like to start the full application now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting the Alex Wilson Songbook..."
    echo ""
    echo "🌐 The application will open in your browser"
    echo "📍 URL: http://localhost:5173"
    echo ""
    echo "📚 For help with AI image generation, see IMAGEN_USER_GUIDE.md"
    echo ""
    echo "🛑 To stop the application, press Ctrl+C"
    echo ""
    
    # Kill the background server and start normally
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    
    # Start both server and client
    ./start-app.sh
else
    echo "👍 You can start the application later with: ./start-app.sh"
    echo ""
    # Clean up background server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
fi

echo "🎵 Thank you for using Alex Wilson Songbook! 🎵"

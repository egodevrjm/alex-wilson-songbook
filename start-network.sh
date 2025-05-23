#!/bin/bash

# Alex Wilson Songbook - Network Development Startup Script
echo "🎵 Starting Alex Wilson Songbook for network access..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the alex-wilson-songbook directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Get the local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}')

echo "🖥️  MacBook IP Address: $LOCAL_IP"
echo "📱 Access on your phone: http://$LOCAL_IP:5173"
echo ""
echo "🚀 Starting servers..."
echo "   Backend (API): http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo "   Network access: http://$LOCAL_IP:5173"
echo ""

# Start the backend server in the background
echo "Starting backend server..."
npm run server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the frontend development server
echo "Starting frontend development server..."
npm run dev

# When frontend stops, kill the backend too
echo "Stopping backend server..."
kill $BACKEND_PID 2>/dev/null

echo "✅ Servers stopped"

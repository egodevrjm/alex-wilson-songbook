#!/bin/bash

# Start the server and development app for Alex Wilson Songbook

echo "Starting Alex Wilson Songbook..."
echo "===================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with your Gemini API key:"
    echo "cp .env.example .env"
    echo "Then edit the .env file to add your API key."
    echo "💡 You can also run './setup-imagen.sh' for guided setup with AI image generation"
    exit 1
fi

# Check if GEMINI_API_KEY is set in .env file
if ! grep -q "GEMINI_API_KEY=" .env || grep -q "GEMINI_API_KEY=your_gemini_api_key_here" .env; then
    echo "Warning: GEMINI_API_KEY may not be properly set in your .env file."
    echo "Please ensure you have a valid API key."
fi

# Function to check if a command is available
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo "Error: Node.js is not installed!"
    echo "Please install Node.js before running this script."
    exit 1
fi

# Check for npm
if ! command_exists npm; then
    echo "Error: npm is not installed!"
    echo "Please install npm before running this script."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Function to kill background processes on script exit
cleanup() {
    echo "Shutting down processes..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Start the server
echo "Starting server..."
node server.js &
SERVER_PID=$!

# Check if server started successfully
sleep 2
if ! ps -p $SERVER_PID > /dev/null; then
    echo "Error: Failed to start server!"
    exit 1
fi

echo "Server running on http://localhost:3001"

# Start the Vite development server
echo "Starting Vite development server..."
npm run dev &
CLIENT_PID=$!

# Check if client started successfully
sleep 2
if ! ps -p $CLIENT_PID > /dev/null; then
    echo "Error: Failed to start development server!"
    kill $SERVER_PID
    exit 1
fi

echo ""
echo "===================================="
echo "Alex Wilson Songbook is now running!"
echo "Open your browser to the URL shown above by the Vite output."
echo "The test page is also available at: test-global-function.html"
echo "📚 For AI image generation help, see: IMAGEN_USER_GUIDE.md"
echo "🧪 To test image generation, run: npm run test-imagen"
echo "Press Ctrl+C to stop all processes."
echo "===================================="

# Wait for user input to keep the script running
wait

#!/bin/bash
# Make this script executable with: chmod +x setup-gemini.sh

# Setup script for Gemini API integration in Alex Wilson Songbook

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
  echo "Please edit the .env file and add your GEMINI_API_KEY"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "npm is not installed. Please install Node.js and npm first."
  exit 1
fi

# Install dependencies
echo "Installing required dependencies..."
npm install @google/generative-ai dotenv express cors

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "Installation completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Edit the .env file and add your GEMINI_API_KEY"
  echo "2. Start the backend: node server.js"
  echo "3. Start the frontend: npm run dev"
  echo ""
  echo "See GEMINI_API_SETUP.md for detailed instructions and usage."
else
  echo "Installation failed. Please check the error messages above."
fi

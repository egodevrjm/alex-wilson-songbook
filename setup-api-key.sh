#!/bin/bash

# Script to guide users through setting up their Gemini API key

echo "==== Google Gemini API Key Setup ===="
echo "This script will help you set up your Gemini API key for Alex Wilson Songbook."
echo

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
fi

# Check if key is already set
current_key=$(grep "^GEMINI_API_KEY=" .env | cut -d'=' -f2)

if [[ -n "$current_key" && "$current_key" != "your_key_here" && "$current_key" != "your_gemini_api_key_here" ]]; then
  echo "You already have an API key configured:"
  echo "GEMINI_API_KEY=$current_key"
  read -p "Do you want to replace this key? (y/n): " replace_key
  
  if [[ "$replace_key" != "y" && "$replace_key" != "Y" ]]; then
    echo "Keeping existing key. Let's verify it..."
    node verify-api-key.js
    exit $?
  fi
fi

echo
echo "To get a Gemini API key:"
echo "1. Go to https://aistudio.google.com/"
echo "2. Sign in with your Google account"
echo "3. Navigate to the API section"
echo "4. Create a new API key"
echo

# Prompt for API key
read -p "Enter your Gemini API key: " api_key

if [ -z "$api_key" ]; then
  echo "No API key entered. Exiting setup."
  exit 1
fi

# Update the .env file
sed -i.bak "/^# GEMINI_API_KEY=/d" .env
sed -i.bak "s/^GEMINI_API_KEY=.*/GEMINI_API_KEY=$api_key/" .env 2>/dev/null || \
  echo "GEMINI_API_KEY=$api_key" >> .env

# Remove backup file
rm -f .env.bak 2>/dev/null

echo
echo "API key has been saved to .env file."
echo "Verifying the API key..."

# Verify the key
node verify-api-key.js

if [ $? -eq 0 ]; then
  echo
  echo "Setup completed successfully! You can now start the application:"
  echo "./start-app.sh"
else
  echo
  echo "There was an issue with your API key. Please check the errors above."
fi

#!/bin/bash

# Quick verification script for Google Imagen integration

echo "🔍 Verifying Google Imagen Integration..."
echo "========================================"

# Check if files exist
echo "📁 Checking required files..."

files=(
    ".env"
    "server.js"
    "src/services/imagenService.js"
    "src/components/MediaManager.jsx"
    "src/components/AlbumImageGenerator.jsx"
    "package.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""

# Check environment variable
echo "🔑 Checking API key..."
if [ -f ".env" ]; then
    if grep -q "GEMINI_API_KEY=AIza" .env; then
        echo "✅ API key appears to be set"
    else
        echo "⚠️  API key may not be properly configured"
    fi
else
    echo "❌ .env file not found"
fi

echo ""

# Check server endpoints in server.js
echo "🛠️  Checking server endpoints..."
if grep -q "/api/imagen/generate" server.js; then
    echo "✅ Image generation endpoint found"
else
    echo "❌ Image generation endpoint missing"
fi

if grep -q "/api/imagen/health" server.js; then
    echo "✅ Health check endpoint found"
else
    echo "❌ Health check endpoint missing"
fi

echo ""

# Check frontend integration
echo "🎨 Checking frontend integration..."
if grep -q "ImagenService" src/components/MediaManager.jsx; then
    echo "✅ MediaManager uses ImagenService"
else
    echo "❌ MediaManager missing ImagenService integration"
fi

if grep -q "Generate with AI" src/components/MediaManager.jsx; then
    echo "✅ AI generation button found in MediaManager"
else
    echo "❌ AI generation button missing"
fi

echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if grep -q "@google/generative-ai" package.json; then
    echo "✅ Google Generative AI package found"
else
    echo "❌ Google Generative AI package missing"
fi

if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Run 'npm install' to install dependencies"
fi

echo ""
echo "🏁 Verification complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your API key is properly set in .env"
echo "2. Run 'npm run test-imagen' to test the integration"
echo "3. Start the app with 'npm run quickstart' or './start-app.sh'"
echo "4. See IMAGEN_USER_GUIDE.md for detailed usage instructions"

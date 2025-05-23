const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function debugImagenEndpoints() {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    return;
  }
  
  console.log('🔍 Testing different Imagen API endpoints...\n');
  
  // Test different possible endpoints
  const endpoints = [
    // Current endpoint we're using
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImage?key=${API_KEY}`,
    
    // Alternative endpoints to try
    `https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-002:generateImage?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta2/models/imagen-3.0-generate-002:generateImage?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${API_KEY}`,
    
    // New possible base URLs
    `https://generativelanguage.googleapis.com/v1beta/imagen:generate?key=${API_KEY}`,
    `https://aiplatform.googleapis.com/v1beta/imagen:generate?key=${API_KEY}`,
  ];
  
  const testPayload = {
    prompt: 'A simple test image',
    numberOfImages: 1
  };
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`\n🧪 Testing endpoint ${i + 1}:`);
    console.log(endpoint.replace(API_KEY, 'xxx...'));
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('   ✅ SUCCESS! This endpoint works!');
        console.log('   🎯 Use this endpoint in your server.js');
        break;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
}

// Also test the models list endpoint
async function listAvailableModels() {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  console.log('\n\n📋 Checking available models...');
  
  const modelsEndpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(modelsEndpoint);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Available models:');
      
      const imagenModels = data.models.filter(model => 
        model.name.includes('imagen')
      );
      
      if (imagenModels.length > 0) {
        console.log('\n🎨 Imagen models found:');
        imagenModels.forEach(model => {
          console.log(`   - ${model.name}`);
          console.log(`     Display name: ${model.displayName}`);
          if (model.supportedGenerationMethods) {
            console.log(`     Methods: ${model.supportedGenerationMethods.join(', ')}`);
          }
        });
      } else {
        console.log('\n❌ No Imagen models found in the list');
        console.log('\n🔍 All available models:');
        data.models.slice(0, 10).forEach(model => {
          console.log(`   - ${model.name}`);
        });
      }
    } else {
      console.log(`❌ Failed to list models: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error listing models: ${error.message}`);
  }
}

async function main() {
  await debugImagenEndpoints();
  await listAvailableModels();
}

main();

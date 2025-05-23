const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

// Get the API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY;

// Function to verify the API key
async function verifyApiKey() {
  console.log('\n=== Gemini API Key Verification ===\n');
  
  // Check if API_KEY is defined
  if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is not set in your .env file');
    console.log('\nPlease follow these steps:');
    console.log('1. Go to https://aistudio.google.com/');
    console.log('2. Sign in with your Google account');
    console.log('3. Navigate to the API section');
    console.log('4. Create a new API key');
    console.log('5. Add it to your .env file as GEMINI_API_KEY=your_key_here');
    process.exit(1);
  }

  // Check if API_KEY is just a placeholder
  if (API_KEY === 'your_key_here' || API_KEY === 'your_gemini_api_key_here') {
    console.error('❌ Error: You are using a placeholder API key');
    console.log('\nPlease replace the placeholder with your actual Gemini API key in the .env file.');
    process.exit(1);
  }

  console.log('Attempting to connect to Gemini API...');
  
  try {
    // Initialize the API
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Get a model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Generate content to test the API key
    const prompt = 'Respond with just the text "API key is valid" if you can read this message.';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Check if we got a valid response
    if (text && text.includes('API key is valid')) {
      console.log('✅ Success: Your Gemini API key is valid and working properly!');
      console.log('\nYou can now use the Alex Wilson Songbook application with AI features.');
      console.log('Run the following command to start both the server and client:');
      console.log('  ./start-app.sh');
    } else {
      console.log('⚠️ Warning: Received an unexpected response from the API:');
      console.log(text);
      console.log('\nThe API key may be valid, but there might be other issues.');
    }
  } catch (error) {
    console.error('❌ Error: Unable to connect to Gemini API');
    console.error(`Error details: ${error.message}`);
    
    if (error.message.includes('API key')) {
      console.log('\nThe API key you provided appears to be invalid.');
    } else if (error.message.includes('network')) {
      console.log('\nThere might be network connectivity issues.');
    }
    
    console.log('\nPlease follow these steps:');
    console.log('1. Double-check that you have copied the correct API key from Google AI Studio');
    console.log('2. Make sure the key is properly formatted in your .env file');
    console.log('3. Check your internet connection');
    console.log('4. Verify that the Google AI Studio services are available');
    process.exit(1);
  }
}

// Run the verification
verifyApiKey();

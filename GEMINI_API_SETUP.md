# Gemini API Integration for Alex Wilson Songbook

This guide explains how to set up and use the Google Gemini API integration with the Alex Wilson Songbook application.

## Setup Instructions

### 1. Get a Google Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/) and sign in with a Google account
2. Navigate to the API section and create an API key
3. Copy the generated API key

### 2. Configure the Application

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and paste your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   ```

### 3. Install Dependencies and Run

1. Make sure you have the required dependencies:
   ```bash
   npm install @google/generative-ai dotenv express cors
   ```

2. Start the backend server in one terminal:
   ```bash
   node server.js
   ```

3. In a separate terminal, start the frontend:
   ```bash
   npm run dev
   ```

## Using Gemini AI Features

The Alex Wilson Songbook now includes several AI-powered features:

### Creating a New Song

1. Click the **AI Assistant** button in any song view
2. Select **Create New Song**
3. Enter a theme or topic (required) and optionally provide:
   - Title (or let AI generate one)
   - Genre
   - Additional instructions
4. Click **Generate Song**
5. Review the generated lyrics and click **Add to Songbook**

### Enhancing Existing Lyrics

1. Open a song you want to enhance
2. Click the **AI Clean-up** button next to the lyrics
3. Provide specific instructions for enhancement
4. Click **Enhance Lyrics**
5. Review the enhanced lyrics and click **Update Lyrics**

### Generating Notes

1. Open a song you want to analyze
2. Click the **AI Generate** button next to the Notes section
3. Choose the note type (Analysis, Background, Performance)
4. Click **Generate Notes**
5. Review the generated notes and click **Save Notes**

### Generating Chord Progressions

This feature allows you to automatically generate chord progressions for your lyrics:

1. Open a song with lyrics
2. Select the chord generation option
3. Optionally specify a genre and musical key
4. Click **Generate Chord Progression**
5. Review the chords and apply them to your song

## Tips for Better Results

- **Be specific in theme descriptions**: Instead of "love," try "rekindling love after years apart"
- **Include style guidance**: Mention specific songwriting styles, eras, or artists for reference
- **Provide structure hints**: Specify if you want a particular pattern (verse-chorus-verse-bridge)
- **Try multiple generations**: AI results vary, so generate multiple options for best results
- **Edit and refine**: Use AI generations as a starting point and refine with your own creativity

## Troubleshooting

- **API Key Errors**: Verify your API key is correctly set in the `.env` file
- **Request Failures**: Check your network connection and API quota limitations
- **Server Not Running**: Make sure the server.js is running in a separate terminal
- **Poor Generation Quality**: Try more specific prompts or adjust the instructions

## Example Prompts

**Theme Ideas:**
- "A coal miner reflecting on life choices and opportunities missed"
- "Finding redemption after betraying a close friend"
- "Rural life and the tension between tradition and change"
- "The bittersweet feeling of watching your hometown fade in the rearview mirror"

**Enhancement Instructions:**
- "Strengthen the imagery in the verses while keeping the chorus intact"
- "Add more emotional depth to the bridge section"
- "Make the lyrics more specific to Appalachian coal mining"
- "Improve the rhyme scheme while maintaining the meaning"

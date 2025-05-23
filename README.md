# Alex Wilson Songbook

A web application for managing song lyrics, notes, and media for the fictional artist Alex Wilson. This app supports creating, editing, and organizing song content with optional AI assistance for generating new content.

## Features

### Core Features
- View and manage song lyrics and notes
- Create new songs manually or with AI assistance
- Search through your song collection
- Create and manage playlists, albums, and setlists
- Mobile-responsive design with theme support

### AI-Powered Features
- **AI image generation** for song artwork and album covers (Google Imagen 3)
- AI-powered song generation, enhancement, and analysis
- Automatic theme extraction from lyrics
- Multiple style and colour options for generated images
- Format lyrics and generate chord progressions

### 🎮 Game Mode Integration (NEW)
- **Roleplay companion** for the Alex Wilson Story game
- Track song attributes (rawness, production, crossover appeal, emotional impact)
- Manage release status and performance history
- Dice roller with automatic modifiers
- Social media reaction simulator
- Industry connections manager
- Career progression tracking
- See `GAME_INTEGRATION_GUIDE.md` for full details

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- A Google Gemini API key (for AI features)

### Installation

1. Clone the repository
2. Set up the environment variables:
   ```
   cp .env.example .env
   ```
3. Set up your Google Gemini API key:
   ```
   # Make the script executable
   chmod +x setup-api-key.sh
   
   # Run the interactive setup
   ./setup-api-key.sh
   ```
4. Install dependencies:
   ```
   npm install
   ```

### Running the Application

You can use the provided script to start both the server and client:

```bash
# Make the script executable
chmod +x start-app.sh

# Run the application
./start-app.sh
```

Alternatively, you can start them separately:

```bash
# Start the server
npm run server

# In a separate terminal, start the client
npm run dev
```

### Testing the Global Function

If you're having issues with the global `createSongFromPrompt` function, you can use the included test page:

1. Start both the server and client
2. Open the client in your browser
3. In a separate tab, open `test-global-function.html`
4. Use the form to test the global function

## Troubleshooting

If you encounter the error "Failed to generate song Thjis is for Create Song globally":

1. Make sure the server is running
2. Verify your Gemini API key is valid and properly set in the `.env` file
3. Check the browser console for more detailed error messages
4. Try using the AI generation through the UI rather than the global function

## Development

### Project Structure

- `/src` - Frontend React code
  - `/components` - React components
  - `/services` - API services
  - `/hooks` - Custom React hooks
  - `/utils` - Utility functions
  - `/data` - Initial data
- `server.js` - Backend Express server
- `.env` - Environment variables
- `vite.config.js` - Vite configuration

### AI Integration

The application integrates with Google's Gemini API for:

- Generating song lyrics based on themes and prompts
- Enhancing existing lyrics
- Creating song notes and analysis
- Generating chord progressions
- **AI image generation** for custom song artwork and album covers (Imagen 3)

See `GEMINI_API_SETUP.md` for detailed setup instructions and `IMAGEN_USER_GUIDE.md` for comprehensive AI image generation documentation.

### Testing the AI Image Generation

To verify your Imagen integration is working correctly:

```bash
npm run test-imagen
```

This will test your API configuration and generate sample images.

## License

This project is fictional and created for demonstration purposes.

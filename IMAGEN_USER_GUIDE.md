# Google Imagen Integration - User Guide

## 🎨 Overview

The Alex Wilson Songbook now includes powerful AI image generation capabilities using Google's Imagen 3 API. You can create custom artwork for both individual songs and album covers directly within the application.

## 🚀 Getting Started

### Prerequisites
- A valid Google Gemini API key with Imagen access
- The server must be running (`npm run server`)
- Active internet connection

### Testing Your Setup
Run the test script to verify everything is working:
```bash
npm run test-imagen
```

## 🎵 Song Image Generation

### How to Generate Song Images

1. **Open a Song**: Navigate to any song in your collection
2. **Open Media Manager**: Click the "Add Media + AI Images" or "Media & AI" button
3. **Switch to Image Tab**: Make sure you're on the Image tab
4. **Click "Generate with AI"**: This opens the AI image generator

### Customisation Options

**Art Style Options:**
- Modern Artistic (default)
- Minimalist
- Vintage/Retro
- Abstract
- Photorealistic
- Watercolor
- Digital Illustration
- Folk Art
- Geometric
- Surreal

**Colour Palette Options:**
- Warm & Vibrant
- Cool & Calming
- Monochromatic
- High Contrast
- Earth Tones
- Neon & Electric
- Pastel & Soft
- Deep & Rich
- Sepia/Vintage
- Black & White

**Additional Details:**
Add specific elements you want included in the image:
- Musical instruments ("acoustic guitar", "piano keys")
- Landscapes ("mountain vista", "ocean sunset")
- Urban elements ("city lights", "street scene")
- Abstract concepts ("flowing energy", "geometric patterns")

### How It Works

The AI analyses your song's:
- **Title**: Used as primary context
- **Lyrics**: Automatically scanned for themes (love, nature, darkness, etc.)
- **Genre**: Influences the overall aesthetic
- **Your Custom Options**: Style, colours, and additional details

## 💿 Album Cover Generation

### Creating Album Covers

1. **Go to Albums Section**: Click "Albums" in the main navigation
2. **Create or Edit Album**: Either create a new album or edit an existing one
3. **Click "Generate Album Cover"**: Found in the album editor
4. **Customise Options**: Choose style, colours, and additional details
5. **Generate**: Creates 3 different cover options to choose from

### Album-Specific Features

- **Multi-song Analysis**: Considers all tracks in the album for thematic cohesion
- **Professional Layouts**: Optimised for album cover standards
- **Multiple Variations**: Generates 3 options per request
- **Square Format**: Perfect 1:1 aspect ratio for album covers

## 🎯 Tips for Better Results

### Writing Effective Prompts
- **Be Specific**: "Acoustic guitar against mountain landscape" vs "nice scene"
- **Match Genre**: Vintage styles for folk, modern for contemporary
- **Consider Mood**: The AI extracts emotion from your lyrics automatically
- **Experiment**: Try different style/colour combinations

### Theme Extraction
The AI automatically detects these themes from lyrics:
- **Emotional**: love, melancholy, joy, anger, hope
- **Environmental**: brightness, darkness, weather, water, landscape
- **Relational**: friendship, solitude, family

### Optimisation Tips
- **Keep Additional Details Concise**: 1-2 sentences work best
- **Use Visual Language**: Focus on what you want to see, not abstract concepts
- **Try Multiple Generations**: Each generation is unique
- **Consider Your Audience**: Match the style to your musical genre

## 🛠️ Troubleshooting

### Common Issues

**"Failed to generate image"**
- Check your internet connection
- Verify the server is running
- Run `npm run test-imagen` to diagnose

**"Rate limit exceeded"**
- Wait a few minutes before trying again
- Google has usage limits on the API

**"Authentication failed"**
- Verify your API key in the `.env` file
- Ensure the key has Imagen access enabled
- Check your Google Cloud billing is active

**"Invalid request"**
- Try simplifying your prompt
- Remove any unusual characters
- Check that song data is properly loaded

### Error Recovery
- **Server Errors**: Restart the server with `npm run server`
- **API Errors**: Wait and retry, or modify your prompt
- **Loading Issues**: Refresh the page and try again

## 📁 File Management

### Image Storage
- Generated images are stored locally in your browser
- Images persist between sessions
- Large images are automatically optimised
- Export functionality includes generated images

### Format Support
- All generated images are in high-quality PNG format
- Suitable for both digital and print use
- Standard 1:1 aspect ratio for consistency

## 🔧 Advanced Features

### Integration with Other Features
- **Export to Markdown**: Generated images are included
- **Playlist Views**: Song artwork displays in playlists
- **Setlist Manager**: Shows song images for visual reference
- **Album Collections**: Cohesive visual themes across albums

### Performance Optimisation
- Images are compressed for faster loading
- Automatic fallback to cached versions
- Progressive loading for better user experience

## 📊 API Usage

### Understanding Costs
- Image generation may incur costs through Google Cloud
- Check your Google Cloud Console for usage monitoring
- Consider setting up billing alerts

### Rate Limits
- Google imposes limits on API usage
- The app automatically handles rate limiting
- Wait periods are communicated in error messages

## 🔒 Privacy & Security

### Data Handling
- Images are generated dynamically and stored locally
- Song lyrics are only sent to Google for generation
- No personal data is permanently stored by Google
- All communication is encrypted (HTTPS)

### API Key Security
- Store your API key securely in the `.env` file
- Never commit API keys to version control
- Regenerate keys if compromised

## 📞 Support

If you encounter issues:

1. **Check the Console**: Browser developer tools show detailed errors
2. **Run Diagnostics**: Use `npm run test-imagen`
3. **Review Logs**: Server logs contain detailed error information
4. **Restart Services**: Sometimes a simple restart fixes issues

## 🆕 Future Enhancements

Planned features:
- Batch image generation for multiple songs
- Custom aspect ratios (not just square)
- Image editing and filtering options
- Integration with external image libraries
- Advanced prompt templates

---

*This guide covers the current implementation of Google Imagen integration in the Alex Wilson Songbook. The feature is actively maintained and improved based on user feedback.*

# Alex Wilson Songbook - Game Integration Guide

This guide explains the new Game Mode features that integrate with the Alex Wilson Story roleplay game.

## 🎮 Enabling Game Mode

1. **Run the migration** (first time only):
   ```bash
   npm run migrate-game
   ```
   This adds game attributes to all existing songs.

2. **Enable Game Mode** in Settings:
   - Go to Settings
   - Toggle "Enable Game Mode"
   - A new "Game" tab will appear in the navigation

## 🎯 Game Features

### 1. Song Attributes
Each song now has game-specific attributes that affect gameplay:

- **Rawness (1-10)**: Emotional authenticity
- **Production (1-10)**: Technical quality  
- **Crossover Appeal (1-10)**: Appeal beyond country audience
- **Emotional Impact (1-10)**: How strongly it affects listeners

These attributes affect:
- Viral potential when releasing songs
- Audience reactions
- Industry interest
- Career progression

### 2. Release Status
Songs can be marked as "Released" or "Unreleased":
- Unreleased songs are private (only Alex knows them)
- Released songs generate social media reactions
- Release status affects reputation and audience growth

### 3. Performance Tracking
Log where and when songs were performed:
- Venue name
- Date
- Audience size
- Each performance can improve song attributes

### 4. Game Dashboard
The dashboard displays:
- Current date/time in game
- Character meters (Hope, Rage, Authenticity, Reputation, SongwriterRep)
- Wallet (cash, debt, royalties, streaming revenue)
- Gear level and bonuses
- Audience reach (local, regional, national, online)
- Genre credibility scores
- Industry connections count
- Fatigue level

### 5. Dice Roller
Roll dice for game actions:
- 1d6 for standard actions
- 1d20 for viral potential
- Automatic modifiers based on gear and song attributes
- Visual outcome indicators (Stumble, Hold, Stride, Spark!)

### 6. Social Media Simulation
View simulated platform reactions:
- X/Twitter
- TikTok  
- Instagram
- YouTube
- Reactions scale with reputation and audience size
- Different platforms have different audiences

### 7. Industry Connections
Track relationships with:
- Venue owners
- Producers
- Other artists
- Executives
- Media contacts

Each connection has:
- Relationship level (1-5 stars)
- Influence level (local, regional, national)
- Special opportunities they can unlock

### 8. Quick Actions
Common game actions:
- Advance time (+1 hour, +8 hours, +1 day)
- Buy food (+1 Hope, -$10)
- Rest (+2 Hope, advance 8 hours)
- Work shift (+$75, advance 8 hours)

### 9. Career Milestones
Track progress through:
- Listener milestones (100, 1000, 5000, 10000+ listeners)
- First cover by another artist
- Songwriter reputation milestones
- First viral moment

### 10. Timeline Management
- View current game date and time
- Advance time in controlled increments
- Track important dates (rent due on Fridays)

## 🎲 Gameplay Integration

### Song Release Flow
1. Create/edit a song in the main songbook
2. Set attributes in Game Mode
3. Mark as "Released" when ready
4. View social media reactions
5. Roll dice for viral potential

### Performance Flow
1. Select a song
2. Add performance details
3. Roll dice for audience reaction
4. Gain reputation and audience growth

### Connection Building
1. Add new connections as you meet them
2. Track relationship levels
3. Use connections for opportunities
4. Maintain relationships over time

## 📊 Tips for Game Masters

- Song attributes can be adjusted based on in-game events
- Use the dice roller for all performance checks
- Social media reactions provide narrative flavor
- Connections drive story opportunities
- Monitor meters for story triggers (Hope < 2, Rage > 8, etc.)

## 🔧 Technical Details

### Data Storage
- Game state is saved in localStorage
- Song game attributes are part of the song data
- All changes persist between sessions

### Migration
The migration script:
- Adds game attributes to existing songs
- Analyzes song content to set initial attributes
- Creates a backup before making changes

## 🚀 Future Enhancements

Planned features:
- Email/text message simulation
- Publishing deal negotiations
- Tour planning
- Collaborative songwriting mechanics
- Revenue tracking over time
- Achievement system

## 🐛 Troubleshooting

**Game Mode not showing:**
- Make sure you've run the migration
- Enable Game Mode in Settings
- Refresh the page

**Attributes not saving:**
- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing cache and reloading

**Social media not showing reactions:**
- Songs must be marked as "Released"
- Build audience through performances
- Increase reputation for more engagement

## 📝 Game Mode Best Practices

1. **Start small**: Begin with low attributes and build up
2. **Track everything**: Use performance history for narrative
3. **Engage with reactions**: Social media provides story hooks
4. **Build connections**: They're key to career progression
5. **Balance meters**: Don't let Hope get too low or Rage too high
6. **Use time wisely**: Advance time strategically
7. **Release strategically**: Not every song needs immediate release

Enjoy bringing Alex Wilson's story to life!

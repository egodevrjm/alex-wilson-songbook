// Enhanced song structure for Alex Wilson Story Game integration
export const INITIAL_SONG_ATTRIBUTES = {
  rawness: 5,        // 1-10: Emotional authenticity
  production: 3,     // 1-10: Technical quality
  crossoverAppeal: 3,// 1-10: Appeal beyond country audience
  emotionalImpact: 5 // 1-10: How strongly it affects listeners
};

export const INITIAL_GAME_STATE = {
  // Core timeline and state
  date: "2025-05-18",
  time: "23:45",
  
  // Character stats and metrics
  meters: {
    Hope: 2,
    Rage: 7,
    Authenticity: 5,
    Reputation: 1,
    SongwriterRep: 0
  },
  
  // Work and economic situation
  work: {
    job: "mine",
    fatigue: 0
  },
  wallet: {
    cash: 120,
    debt: 0,
    royalties: 0,
    streamingRevenue: 0
  },
  
  // Equipment quality
  gear: "Scuffed", // Scuffed → Basic → Quality → Professional → Studio
  
  // Audience demographics and reach
  audience: {
    local: 3,
    regional: 0,
    national: 0,
    online: 1,
    genreAudience: {
      country: 4,
      folk: 2,
      rock: 0,
      pop: 0,
      indie: 0
    }
  },
  
  // Industry connections
  connections: [],
  
  // Ambient and NPC tracking
  lastCues: [],
  npcs: []
};

// Enhanced song structure with game attributes
export const createGameSong = (baseSong) => ({
  ...baseSong,
  // Game-specific attributes
  released: false,
  type: "full", // fragment, demo, full
  attributes: {
    ...INITIAL_SONG_ATTRIBUTES
  },
  performances: [],
  covers: [],
  audience: [],
  viralSeeds: [], // Elements that could make it go viral
  createdInGame: false,
  gameMetadata: {
    firstPerformed: null,
    totalPlays: 0,
    peakAudience: 0,
    streamingPlays: 0,
    lastModifiedInGame: null
  }
});

// Genre credibility tracker
export const GENRE_CREDIBILITY = {
  country: 5,
  folk: 4,
  rock: 0,
  pop: 0,
  indie: 0
};

// Gear progression levels
export const GEAR_LEVELS = {
  Scuffed: { bonus: 0, cost: 0, description: "Barely holding together" },
  Basic: { bonus: 1, cost: 100, description: "Functional but worn" },
  Quality: { bonus: 2, cost: 500, description: "Professional grade" },
  Professional: { bonus: 3, cost: 2000, description: "Studio quality" },
  Studio: { bonus: 4, cost: 10000, description: "Top of the line" }
};

// Career milestones
export const CAREER_MILESTONES = [
  { listeners: 100, event: "First open mic opportunity" },
  { listeners: 1000, event: "Small venue booking offer" },
  { listeners: 5000, event: "Local radio interest" },
  { listeners: 10000, event: "Label scout attention" },
  { listeners: 50000, event: "Regional touring opportunity" },
  { listeners: 100000, event: "Major label interest" },
  { covers: 1, event: "First artist covers your song" },
  { songwriterRep: 5, event: "Established artists request collaborations" },
  { viral: 1, event: "First viral moment" }
];

// Platform templates for social media reactions
export const PLATFORM_STYLES = {
  twitter: {
    maxLength: 280,
    format: "@{username}: {message}",
    verified: "✓"
  },
  tiktok: {
    format: "@{username}: {message}",
    features: ["duet", "stitch", "sound"]
  },
  instagram: {
    format: "@{username}: {message}",
    features: ["story", "reel", "post"]
  },
  youtube: {
    format: "{username} ({time} ago): {message}",
    features: ["likes", "replies"]
  }
};

// Connection types for industry networking
export const CONNECTION_TYPES = {
  VENUE_OWNER: { influence: "local", opportunities: ["gigs", "residency"] },
  PRODUCER: { influence: "regional", opportunities: ["recording", "mixing"] },
  ARTIST: { influence: "varies", opportunities: ["collaboration", "tour"] },
  EXECUTIVE: { influence: "national", opportunities: ["deals", "distribution"] },
  MEDIA: { influence: "varies", opportunities: ["coverage", "interviews"] }
};

// Dice roll modifiers
export const ROLL_MODIFIERS = {
  songRelease: (song) => {
    let modifier = 0;
    if (song.attributes.rawness > 7) modifier += 1;
    if (song.attributes.emotionalImpact > 7) modifier += 1;
    if (song.attributes.production > 7) modifier += 1;
    return modifier;
  },
  crossoverAttempt: (genreCredibility, targetGenre) => {
    return genreCredibility[targetGenre] > 0 ? 1 : -1;
  },
  collaboration: (connections) => {
    const highRepConnections = connections.filter(c => c.reputation > 3);
    return highRepConnections.length;
  }
};

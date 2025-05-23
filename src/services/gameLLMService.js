// LLM Service for Game Integration
const GAME_SYSTEM_PROMPT = `You are the narrator for "The Alex Wilson Story," an interactive narrative game about a coal miner's son who becomes a country music sensation through social media.

CHARACTER CONTEXT:
- Alex Wilson: 25, coal miner's son from Kentucky
- Recently betrayed by his girlfriend Shay
- Works in the mines but dreams of music
- Doesn't use social media (important: he's unaware of being filmed/streamed)
- Authentic, raw talent with deep emotional wounds

GAME MECHANICS:
- Hope/Rage/Authenticity/Reputation meters (0-10 scale)
- Cash/Debt/Royalties/Streaming revenue tracking
- Gear progression: Scuffed → Basic → Quality → Professional → Studio
- Audience reach: local/regional/national/online
- Genre credibility tracking

NARRATIVE STYLE:
- Use sensory details (🧠 sensory, 📐 visual, 💔 emotional cues)
- Present tense, immersive descriptions
- Show social media's impact without Alex knowing
- Balance hope and struggle
- Kentucky dialect in dialogue when appropriate

RESPONSE FORMAT:
1. Acknowledge the player's choice
2. Describe immediate consequences
3. Show environmental/NPC reactions
4. Hint at social media activity (Alex unaware)
5. Update relevant meters/stats
6. Continue the narrative flow

NARRATIVE CONTINUATION:
- Most responses should continue within the same scene
- Only use [SCENE COMPLETE] when the narrative naturally concludes (e.g., Alex leaves location, time skip needed)
- You can provide new choices within the scene by including:
  [NEW CHOICES]
  [
    {"id": "choice1", "type": "safe", "icon": "🛡️", "label": "Safe Choice", "description": "Description"},
    {"id": "choice2", "type": "risky", "icon": "⚡", "label": "Risky Choice", "description": "Description"},
    {"id": "choice3", "type": "creative", "icon": "🎨", "label": "Creative Choice", "description": "Description"},
    {"id": "custom", "type": "custom", "icon": "❓", "label": "Something else?", "description": "That's for you to create"}
  ]
  [/NEW CHOICES]
- If no specific choices, the player can always describe their own action

IMPORTANT:
- Alex never directly engages with social media
- Viral moments happen around him, not because of him
- Maintain the tragedy and triumph balance
- Keep responses under 300 words
- Let scenes develop naturally - don't rush to the next scene`;

class GameLLMService {
  constructor() {
    this.apiKey = localStorage.getItem('geminiApiKey');
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('geminiApiKey', key);
  }

  async generateResponse(scene, choice, gameState, sceneTurns = 0) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildPrompt(scene, choice, gameState, sceneTurns);

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('LLM API Error:', error);
      return this.getFallbackResponse(scene, choice);
    }
  }

  buildPrompt(scene, choice, gameState, sceneTurns) {
    return `${GAME_SYSTEM_PROMPT}

CURRENT SCENE: ${scene.title}
SCENE CONTEXT: ${scene.narrative}
SCENE TURNS: ${sceneTurns} (turns taken in this scene)

PLAYER'S CHOICE: ${choice.label || choice.type} - ${choice.description}
${choice.type === 'custom' ? `Custom action: ${choice.customText}` : ''}
${choice.type === 'performance' ? `Song performed: "${choice.songTitle}"${choice.soundsLike ? ` (sounds like ${choice.soundsLike})` : ''}` : ''}

CURRENT GAME STATE:
- Date/Time: ${gameState.date} ${gameState.time}
- Meters: Hope ${gameState.meters.Hope}/10, Rage ${gameState.meters.Rage}/10, Authenticity ${gameState.meters.Authenticity}/10, Reputation ${gameState.meters.Reputation}/10
- Wallet: ${gameState.wallet.cash} cash, ${gameState.wallet.debt} debt
- Gear: ${gameState.gear}
- Audience: Local ${gameState.audience.local}/10, Regional ${gameState.audience.regional}/10, National ${gameState.audience.national}/10, Online ${gameState.audience.online}/10

Generate a response that:
1. Shows the immediate outcome of the player's choice
2. Includes at least one NPC reaction
3. Hints at social media activity (that Alex doesn't see)
4. Suggests meter changes (format: [Hope +1] [Authenticity +2])
5. Continues the scene naturally

SPECIAL: If the player performed a song (type: 'performance'), describe the crowd's reaction, the emotional impact, and hint at viral potential. Songs create powerful moments that resonate deeply.

SCENE PACING:
- Turns 0-2: Scene is just beginning, establish atmosphere and develop situation
- Turns 3-5: Scene reaches its peak tension/emotion
- Turns 6+: Consider if the scene has reached a natural conclusion
- Only use [SCENE COMPLETE] when narratively appropriate (Alex leaves, time skip needed, emotional arc complete)

DO NOT rush to end scenes. Let them develop organically.
If the scene continues, you may provide new choices or let the player describe their next action.

Keep it under 300 words and maintain the story's emotional tone.`;
  }

  parseResponse(data) {
    try {
      const text = data.candidates[0].content.parts[0].text;
      
      // Extract meter changes
      const meterChanges = {};
      const meterRegex = /\[(Hope|Rage|Authenticity|Reputation)\s*([+-]\d+)\]/g;
      let match;
      while ((match = meterRegex.exec(text)) !== null) {
        meterChanges[match[1]] = parseInt(match[2]);
      }

      // Check for scene completion markers
      const sceneComplete = text.includes('[SCENE COMPLETE]') || text.includes('[END SCENE]');
      const hasNewChoices = text.includes('[NEW CHOICES]');
      
      // Extract new choices if present
      let choices = null;
      if (hasNewChoices) {
        const choicesMatch = text.match(/\[NEW CHOICES\]([\s\S]*?)\[\/NEW CHOICES\]/m);
        if (choicesMatch) {
          try {
            choices = JSON.parse(choicesMatch[1]);
          } catch (e) {
            console.warn('Could not parse choices from response');
          }
        }
      }

      // Remove special notations from text
      let cleanText = text
        .replace(meterRegex, '')
        .replace(/\[SCENE COMPLETE\]/g, '')
        .replace(/\[END SCENE\]/g, '')
        .replace(/\[NEW CHOICES\][\s\S]*?\[\/NEW CHOICES\]/gm, '')
        .trim();

      return {
        text: cleanText,
        meterChanges,
        sceneComplete,
        choices,
        success: true
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return this.getFallbackResponse();
    }
  }

  getFallbackResponse(scene, choice) {
    const fallbackResponses = {
      safe: {
        text: "You chose the safe path. The moment passes quietly, leaving only the echo of what might have been. Somewhere, a phone screen goes dark, the moment uncaptured. The world continues its rhythm, unaware of the song that remained unsung.\n\nThe air feels heavier now, thick with unspoken words and melodies that will never be heard. You can feel the weight of the guitar on your shoulder, a constant reminder of the music trapped inside.",
        meterChanges: { Hope: -1 },
        sceneComplete: false
      },
      risky: {
        text: "You take a measured risk, stepping slightly outside your comfort zone. A few heads turn, noticing something different in the air. In the background, someone's phone captures a fragment of the moment, though you remain unaware. The gesture ripples outward in small, unexpected ways.\n\nA woman nearby pauses her conversation, drawn by something she can't quite name. The old busker gives you a knowing nod, recognizing a kindred spirit in the struggle.",
        meterChanges: { Authenticity: 1 },
        sceneComplete: false
      },
      creative: {
        text: "You embrace the creative impulse, letting your authentic self shine through. The music flows from somewhere deep, raw and real. Unknown to you, multiple phones light up, capturing lightning in a bottle. Hearts race, both yours and those witnessing something genuine being born. The universe shifts, just a little.\n\nThe notes hang in the air like a confession, each one carrying pieces of your story. A teenager stops scrolling, mesmerized. An elderly couple holds hands a little tighter. This is why you play.",
        meterChanges: { Authenticity: 2, Hope: 1 },
        sceneComplete: false
      },
      custom: {
        text: "Your unique choice creates unexpected ripples. The world responds to your authenticity in ways you couldn't predict. Somewhere in the digital ether, your moment begins to resonate with strangers who understand pain transformed into art.\n\nThe scene continues to unfold around you, each moment pregnant with possibility. What began as a simple choice becomes something more - a turning point, perhaps, or just another step on a longer journey.",
        meterChanges: { Authenticity: 1 },
        sceneComplete: false
      },
      performance: {
        text: "As the first notes ring out, the world seems to pause. Your voice carries the weight of everything you've been through - the betrayal, the pain, the hope that refuses to die. Those nearby stop what they're doing, drawn by something raw and real.\n\nPhones appear like fireflies in the darkness, capturing a moment that feels bigger than this place, this time. Someone wipes away a tear. Another person mouths 'who is this?' to their friend. The music flows through you, each note a piece of your soul laid bare.\n\nYou don't see the comments flooding in, the shares multiplying, the strangers finding solace in your pain transformed into art. You just play, lost in the truth of the moment.",
        meterChanges: { Authenticity: 3, Hope: 2, Reputation: 1 },
        sceneComplete: false
      }
    };

    return fallbackResponses[choice.type] || fallbackResponses.custom;
  }

  // Generate social media reactions based on scene and choice
  generateSocialReactions(scene, choice) {
    const platforms = ['twitter', 'tiktok', 'instagram', 'youtube'];
    const reactions = [];

    if (choice.type === 'creative' || choice.type === 'risky') {
      const selectedPlatforms = platforms.filter(() => Math.random() > 0.5);
      
      selectedPlatforms.forEach(platform => {
        reactions.push({
          platform,
          engagement: Math.floor(Math.random() * 1000) + 100,
          viralPotential: choice.type === 'creative' ? 0.7 : 0.3
        });
      });
    }

    return reactions;
  }
}

export default GameLLMService;

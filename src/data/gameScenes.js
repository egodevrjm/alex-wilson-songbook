// Game Scenes for Alex Wilson Story
export const GAME_SCENES = {
  // Day 0 Scenes
  busker: {
    id: 'busker',
    title: 'The Busker',
    day: 0,
    date: '2025-05-16',
    dayName: 'Fri',
    time: '15:12',
    timeOfDay: 'Afternoon',
    
    cues: [
      { type: 'sensory', icon: '🧠', text: 'A city bus exhales diesel as tourists swarm the Pikeville farmer\'s market' },
      { type: 'visual', icon: '📐', text: 'The old man\'s trembling fingers struggle with a broken guitar string beneath the market\'s colorful awning' },
      { type: 'emotional', icon: '💔', text: 'Alex\'s knuckles whiten around his own guitar case strap' }
    ],
    
    narrative: `The weathered busker fumbles again with the snapped E-string, his open case holding scattered coins that don't add up to gas money. Two college girls linger nearby, one subtly filming market scenes with her phone while the other scrolls TikTok. A well-dressed man in boots and a subtle Stetson pauses momentarily, eyeing both the old timer and Alex with quiet curiosity before continuing on.`,
    
    dialogue: {
      character: 'Alex',
      text: 'Man shouldn\'t have to beg to be heard.'
    },
    
    choices: [
      {
        id: 'walk_away',
        type: 'safe',
        icon: '🛡️',
        label: 'Walk Away',
        description: 'Keep your songs to yourself; this isn\'t your moment.'
      },
      {
        id: 'offer_help',
        type: 'risky',
        icon: '⚡',
        label: 'Offer Help',
        description: 'Fix the old man\'s string, then quietly suggest taking turns — "I\'ve got some originals."'
      },
      {
        id: 'take_stage',
        type: 'creative',
        icon: '🎨',
        label: 'Take the Stage',
        description: 'Say, "Rest a bit, sir" and borrow his spot to perform your most personal songs while he recovers.'
      },
      {
        id: 'custom',
        type: 'custom',
        icon: '❓',
        label: 'Something else?',
        description: 'That\'s for you to create — what do you do?'
      }
    ],
    
    defaultStatus: {
      time: '15:12',
      cash: 120,
      debt: 0,
      gear: 'Scuffed',
      meters: {
        Hope: 2,
        Rage: 7,
        Auth: 5,
        Rep: 1
      }
    }
  },
  
  shattering: {
    id: 'shattering',
    title: 'The Shattering',
    day: 0,
    date: '2025-05-16',
    dayName: 'Fri',
    time: '23:45',
    timeOfDay: 'Late-night',
    location: 'Alex\'s rented room in a sagging trailer',
    
    dynamicCue: {
      chance: 0.33,
      text: 'Rain rattles on the tin-sheened roof.'
    },
    
    lockScreen: {
      time: '23:45',
      battery: 8,
      signal: 'weak',
      notifications: [
        { app: 'Snapchat', sender: 'Shay', time: '23:45' }
      ]
    },
    
    messageContent: {
      app: 'Snapchat',
      sender: 'Shay',
      time: '23:45',
      type: 'photo',
      content: '(Photo auto-opens: Shay kneels, cheeks flushed. Three unfamiliar men hover behind, grinning like loping wolves. Caption: "She\'s kinda tied up rn bro 💦 FaceTime if you want a front-row seat 😈")',
      note: 'That is the polite description, the image itself left no secret of what she was doing. They sent a video after to further cement it'
    },
    
    narrative: `The silence crowds you like coal dust in a lung. Rain drums harder, and the guitar strap bites deeper into your ribs — the battered six-string suddenly feels like the last ledge on a cliff.

A pulse pounds behind your eyes.
Your chest splinters.
Your fingertips quake.

You don't notice standing until your knuckles graze the stained ceiling tile.`,
    
    hiddenMeterUpdates: {
      Hope: { from: 3, to: 2 },
      Rage: { from: 5, to: 7 }
    },
    
    environmentDetails: [
      'You are alone.',
      'The room is 2.4 m × 3 m, air bitter with stale sweat and pine disinfectant.',
      'Your phone trembles in your hand.'
    ],
    
    epilogue: 'Betrayal sears too bright to swallow. Tonight you will share your music for the first time — no face, no name, only raw sound flung into the void.',
    
    prompt: 'That\'s for you to create — what do you do?',
    
    defaultStatus: {
      time: '23:45',
      cash: 120,
      debt: 0,
      gear: 'Scuffed',
      meters: {
        Hope: 2,
        Rage: 7,
        Auth: 5,
        Rep: 1
      }
    }
  },
  
  tailgate: {
    id: 'tailgate',
    title: 'The Tailgate',
    day: 0,
    date: '2025-05-17',
    dayName: 'Sat',
    time: '23:58',
    timeOfDay: 'Late-night',
    
    cues: [
      { type: 'sensory', icon: '🧠', text: 'A symphony of crickets swells in the humid Kentucky air' },
      { type: 'visual', icon: '🌙', text: 'The moon casts long shadows on the dirt road as Alex sits alone on his truck\'s tailgate' },
      { type: 'emotional', icon: '💔', text: 'His worn guitar feels both familiar and foreign in his hands' }
    ],
    
    narrative: `Crickets thrum in the humid dark as Alex sits alone on the open tailgate of his truck, parked off an old dirt road. He strums low, barely audible, backlit by moonlight. Dust motes dance in the single beam of a distant porch light. A half-empty bottle of soda sweats in the truck bed. Farther up the hill, two teens are parked, ostensibly filming the night sky with their phone, but the lens is tilted down by accident, capturing Alex. He has no clue they are there and doesn't use social media.`,
    
    dialogue: {
      character: 'Alex',
      text: '...',
      action: 'He hums a few hesitant notes, then stops, looking out at the darkness.'
    },
    
    choices: [
      {
        id: 'safe',
        type: 'safe',
        icon: '🚶',
        label: 'Safe',
        description: 'Snap the guitar case shut and drive home before anyone sees. The isolation is stifling; maybe it\'s better to just leave.'
      },
      {
        id: 'risky',
        type: 'risky',
        icon: '⚠️',
        label: 'Risky',
        description: 'Stay and play a little louder, not realising you\'re being recorded. The melody starts to flow, vulnerability mixing with the night air.'
      },
      {
        id: 'creative',
        type: 'creative',
        icon: '🎸',
        label: 'Creative',
        description: 'Let go — sing one of your buried originals into the night, unaware it\'s being streamed to 300 followers and counting. The song is raw, stripped bare, and feels like a confession whispered to the darkness.'
      },
      {
        id: 'custom',
        type: 'custom',
        icon: '❓',
        label: 'Something else?',
        description: 'That\'s for you to create — what do you do?'
      }
    ],
    
    defaultStatus: {
      time: '23:58',
      cash: 120,
      debt: 0,
      gear: 'Scuffed',
      meters: {
        Hope: 2,
        Rage: 7,
        Authenticity: 5,
        Reputation: 4
      }
    }
  },
  
  drone: {
    id: 'drone',
    title: 'The Drone',
    day: 0,
    date: '2025-05-17',
    dayName: 'Sat',
    time: '17:18',
    timeOfDay: 'Afternoon',
    
    cues: [
      { type: 'sensory', icon: '🧠', text: 'The cloying scent of fryer grease hangs heavy in the air, mixing with the dusty aroma of the fairground' },
      { type: 'visual', icon: '🦟', text: 'A persistent mosquito buzzes near Alex\'s ear as a small hobby drone whirs overhead' },
      { type: 'environmental', icon: '🚧', text: 'Faded carnival banners flap listlessly in the dwindling breeze, echoing the stalled music' }
    ],
    
    narrative: `Fryer-grease smoke drifts across the cracked asphalt of the emptying fairground parking lot, where metal stalls are being folded away. A hobby drone buzzes insistently overhead, its camera lens swiveling, tracking Alex as he sits on his truck's tailgate. His guitar case remains stubbornly unopened across his knees, his shoulders tense. Nearby, a teenager with a sequined vest frantically searches for a spare speaker for their talent show performance, their hopeful energy tinged with panic. A few stragglers meander through the lot, some glancing at Alex, others distracted by their melting ice cream cones. The sun beats down, reflecting off the drone's casing in sharp glints.`,
    
    dialogue: {
      character: 'Alex',
      text: '...',
      action: 'He shifts uncomfortably, a frown creasing his forehead.'
    },
    
    choices: [
      {
        id: 'safe',
        type: 'safe',
        icon: '🚶',
        label: 'Safe',
        description: 'Stay seated, hands gripping the guitar case, let the drone pass, and watch the fair wind down. Try to become invisible.'
      },
      {
        id: 'risky',
        type: 'risky',
        icon: '⚠️',
        label: 'Risky',
        description: 'Offer to help the teen singer hunt for a spare speaker, keeping your guitar firmly closed. Avoid the drone\'s gaze.'
      },
      {
        id: 'creative',
        type: 'creative',
        icon: '🎸',
        label: 'Creative',
        description: 'Take a deep breath, lift the guitar case lid, stride toward the makeshift stage area, and launch into an original song while the drone livestreams to an unknown audience. Ignore the heat.'
      },
      {
        id: 'custom',
        type: 'custom',
        icon: '❓',
        label: 'Something else?',
        description: 'That\'s for you to create — what do you do?'
      }
    ],
    
    defaultStatus: {
      time: '17:18',
      cash: 120,
      debt: 0,
      gear: 'Scuffed',
      meters: {
        Hope: 2,
        Rage: 7,
        Authenticity: 5,
        Reputation: 4
      }
    }
  },
  
  jukebox: {
    id: 'jukebox',
    title: 'The Jukebox',
    day: 0,
    date: '2025-05-18',
    dayName: 'Sun',
    time: '10:23',
    timeOfDay: 'Late-morning',
    
    narrative: `Coffee-steam curls through Mae's Diner screen door, its narrow porch holding three rocking chairs in a neat row. Inside, the jukebox fizzles silent while a waitress livestreams the awkward lull; Alex rests a toolbox and his unopened case against a peeling post, jaw tight.`,
    
    dialogue: {
      character: 'Alex',
      text: '…'
    },
    
    choices: [
      {
        id: 'safe',
        type: 'safe',
        icon: '🚶',
        label: 'Safe',
        description: 'Fix the jukebox wiring, then step away before anyone asks for more.'
      },
      {
        id: 'risky',
        type: 'risky',
        icon: '⚠️',
        label: 'Risky',
        description: 'Offer a cover on the jukebox mic, keeping your own songs to yourself.'
      },
      {
        id: 'creative',
        type: 'creative',
        icon: '🎸',
        label: 'Creative',
        description: 'Open your case on the porch, sing an original into the waitress\'s live feed and wake the diner.'
      },
      {
        id: 'custom',
        type: 'custom',
        icon: '❓',
        label: 'Something else?',
        description: 'That\'s for you to create — what do you do?'
      }
    ],
    
    defaultStatus: {
      time: '10:23',
      cash: 120,
      debt: 0,
      gear: 'Scuffed',
      meters: {
        Hope: 2,
        Rage: 7,
        Authenticity: 5,
        Reputation: 4
      }
    }
  },
  
  picnic: {
    id: 'picnic',
    title: 'The Picnic',
    day: 0,
    date: '2025-05-18',
    dayName: 'Sun',
    time: '13:05',
    timeOfDay: 'Afternoon',
    
    narrative: `Charcoal smoke rolls over the church-green picnic, long folding tables stretching end-to-end beneath faded bunting. The worship band's amp dies mid-hymn as a youth leader's phone keeps Facebook Live running; Alex loiters near the food line, thumb tracing the latch of his weathered guitar case. The pastor asks him to play.`,
    
    dialogue: {
      character: 'Alex',
      text: '…'
    },
    
    choices: [
      {
        id: 'safe',
        type: 'safe',
        icon: '🚶',
        label: 'Safe',
        description: 'Help shift tables and leave the music to the pastor\'s crew.'
      },
      {
        id: 'risky',
        type: 'risky',
        icon: '⚠️',
        label: 'Risky',
        description: 'Offer to fix the amp and restart the hymn with a familiar cover.'
      },
      {
        id: 'creative',
        type: 'creative',
        icon: '🎸',
        label: 'Creative',
        description: 'Step forward, borrow a stool and share your first gospel-tinged original straight into the live stream.'
      },
      {
        id: 'custom',
        type: 'custom',
        icon: '❓',
        label: 'Something else?',
        description: 'That\'s for you to create — what do you do?'
      }
    ],
    
    defaultStatus: {
      time: '13:05',
      cash: 120,
      debt: 0,
      gear: 'Scuffed',
      meters: {
        Hope: 2,
        Rage: 7,
        Authenticity: 5,
        Reputation: 4
      }
    }
  },
  
  gasStation: {
    id: 'gasStation',
    title: 'The Gas Station',
    day: 1,
    date: '2025-05-19',
    dayName: 'Mon',
    time: '21:17',
    timeOfDay: 'Evening',
    
    narrative: `Petrol fumes hang beneath the flickering canopy lights of a roadside station, two pumps standing a car-length apart. Rain begins to spit while a traveller's dash-cam streams to TikTok, framing Alex leaning against the ice-box, guitar case upright, chest rising fast.`,
    
    dialogue: {
      character: 'Alex',
      text: '…'
    },
    
    choices: [
      {
        id: 'safe',
        type: 'safe',
        icon: '🚶',
        label: 'Safe',
        description: 'Pull your jacket tight, wait out the rain and wave the traveller on.'
      },
      {
        id: 'risky',
        type: 'risky',
        icon: '⚠️',
        label: 'Risky',
        description: 'Offer to help the traveller top up fuel, keeping your guitar closed.'
      },
      {
        id: 'creative',
        type: 'creative',
        icon: '🎸',
        label: 'Creative',
        description: 'Pop the boot of your truck, perch on the tailgate and play an original as the dash-cam audience climbs.'
      },
      {
        id: 'custom',
        type: 'custom',
        icon: '❓',
        label: 'Something else?',
        description: 'That\'s for you to create — what do you do?'
      }
    ],
    
    defaultStatus: {
      time: '21:17',
      cash: 120,
      debt: 0,
      gear: 'Scuffed',
      meters: {
        Hope: 2,
        Rage: 7,
        Authenticity: 5,
        Reputation: 4
      }
    }
  }
};

// Scene order for progression
export const SCENE_ORDER = [
  'busker',
  'shattering',
  'tailgate',
  'drone',
  'jukebox',
  'picnic',
  'gasStation'
];

// Get scene by ID
export const getScene = (sceneId) => GAME_SCENES[sceneId];

// Get next scene
export const getNextScene = (currentSceneId) => {
  const currentIndex = SCENE_ORDER.indexOf(currentSceneId);
  if (currentIndex === -1 || currentIndex === SCENE_ORDER.length - 1) {
    return null;
  }
  return GAME_SCENES[SCENE_ORDER[currentIndex + 1]];
};

// Get all available starting scenes
export const getStartingScenes = () => {
  return SCENE_ORDER.map(id => ({
    id,
    ...GAME_SCENES[id]
  }));
};

// Sample songs that deploy with the app
// These will be available immediately on fresh deployments

export const sampleSongs = [
  {
    id: 'sample-1',
    title: 'Kentucky Hills',
    slug: 'kentucky-hills',
    lyrics: `**Verse 1:**
Way up in them Kentucky hills
Where the morning mist still lingers
On the hollers and the rills
I was raised by weathered fingers

**Chorus:**
But I ain't lookin' back no more
To them days of hurt and sorrow
Got my guitar and these old scars
And I'm singin' for tomorrow

**Verse 2:**
Daddy's voice still echoes harsh
Through the trailer's rusted walls
But I found my voice in music
When the mountain darkness falls

**Chorus:**
But I ain't lookin' back no more
To them days of hurt and sorrow
Got my guitar and these old scars
And I'm singin' for tomorrow

**Bridge:**
Every song's a prayer I'm sendin'
Every chord's a step I'm takin'
From the boy who couldn't mend it
To the man who's finally wakin'

**Chorus:**
And I ain't lookin' back no more
To them days of hurt and sorrow
Got my guitar and these old scars
And I'm singin' for tomorrow`,
    notes: 'Written during a difficult period, reflecting on childhood in eastern Kentucky. The song represents moving forward while acknowledging the past.',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    soundsLike: 'Chris Stapleton meets Tyler Childers',
    audio: null,
    image: null
  },
  {
    id: 'sample-2', 
    title: 'Blackberry Wine',
    slug: 'blackberry-wine',
    lyrics: `**Verse 1:**
She left me with a mason jar
Of blackberry wine so sweet
Said "drink this when you miss me
And remember how we used to meet"

**Chorus:**
Down by the creek where the blackberries grow
In the summer heat and the evening glow
That blackberry wine takes me back in time
To when your heart was mine

**Verse 2:**
I sip it slow on Sunday nights
When the loneliness gets deep
Taste of summer on my lips
And memories I can't keep

**Chorus:**
Down by the creek where the blackberries grow
In the summer heat and the evening glow
That blackberry wine takes me back in time
To when your heart was mine

**Bridge:**
Mason jar's near empty now
But the taste still lingers strong
Like the love we had together
Like this melancholy song

**Final Chorus:**
Down by the creek where the blackberries grow
In the summer heat and the evening glow
That blackberry wine takes me back in time
To when your heart was mine
To when your heart was mine`,
    notes: 'A nostalgic love song about lost romance and memories preserved in simple moments. The blackberry wine serves as a metaphor for bittersweet memories.',
    createdAt: '2024-02-03T14:20:00Z',
    updatedAt: '2024-02-03T14:20:00Z',
    soundsLike: 'Jason Isbell with a touch of Johnny Cash',
    audio: null,
    image: null
  },
  {
    id: 'sample-3',
    title: 'Coal Dust Dreams', 
    slug: 'coal-dust-dreams',
    lyrics: `**Verse 1:**
Six AM the whistle blows
Down into the earth I go
With my headlamp and my fears
Been doin' this for twenty years

**Chorus:**
But I got coal dust dreams
Of somethin' more than this
Sunday morning gospel streams
And my baby's gentle kiss
These coal dust dreams
They keep me alive
In the darkness down below
They help me survive

**Verse 2:**
Daddy died in these same mines
Left us with his worried mind
Swore I'd never follow suit
But bills don't pay with good intent

**Chorus:**
But I got coal dust dreams
Of somethin' more than this
Sunday morning gospel streams
And my baby's gentle kiss
These coal dust dreams
They keep me alive
In the darkness down below
They help me survive

**Bridge:**
Every swing of this old pick
Every prayer that I send up
Is a step toward the light
Lord, I've had enough

**Final Chorus:**
Of these coal dust dreams
I want somethin' more than this
No more underground schemes
Just my baby's gentle kiss
These coal dust dreams
They kept me alive
But now I'm climbin' up
Into the light
Into the light`,
    notes: 'About the generational cycle of coal mining and the dream of breaking free. Represents the struggle between necessity and aspiration.',
    createdAt: '2024-01-28T16:45:00Z',
    updatedAt: '2024-01-28T16:45:00Z',
    soundsLike: 'Tyler Childers meets Bruce Springsteen',
    audio: null,
    image: null
  }
];

export const sampleAlbums = [
  {
    id: 'sample-album-1',
    title: 'Holler Songs',
    description: 'A collection of songs about growing up in rural Kentucky, family struggles, and finding hope in music.',
    songs: [
      { slug: 'kentucky-hills', title: 'Kentucky Hills' },
      { slug: 'coal-dust-dreams', title: 'Coal Dust Dreams' }
    ],
    createdAt: '2024-02-10T12:00:00Z',
    coverImage: null
  }
];

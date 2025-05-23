import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ProfileMediaPlayer from './ProfileMediaPlayer';

const Profile = ({ songs = [] }) => {
  const { theme } = useTheme();

  const basicInfo = {
    name: "Alex Wilson",
    age: "19 (Born: July 12, 2005)",
    height: "6ft 2",
    hometown: "Pikeville, Kentucky",
    instruments: ["Guitar", "Fiddle", "Voice", "Piano (self-taught - imagines keys in his mind)"],
    favoriteMusicians: ["Johnny Cash", "Waylon Jennings", "Chris Stapleton", "Tyler Childers", "Adele"],
    favoriteSongs: [
      '"Hurt" by Johnny Cash',
      '"Cover Me Up" by Jason Isbell',
      '"O Death" (as sung by Ralph Stanley)'
    ],
    mostInfluentialAlbum: '"Traveller" by Chris Stapleton',
    dreamCollaborations: ["Dolly Parton", "Reba McEntire", "Tyler Childers"],
    hiddenTalent: "Can fix and restore broken instruments",
    biggestFear: "Repeating his father's mistakes",
    favouritePlace: "Sitting on the tailgate of his truck, parked where the pines thin out and the mountain wind whistles",
    worstInjury: "Broken arm at 14 when his father went too far — the injury never healed quite right, but he still taught himself to play through the pain",
    treasuredPossession: "The rusted guitar he found at six — still plays it on every track",
    viewOnFame: "I ain't chasin' fame — just truth. If folks feel what I felt when I wrote it, that's enough.",
    signatureLook: "Often shirtless, in worn Wrangler jeans and sun-faded white tees that cling to his frame, finished with scuffed leather boots that have walked miles of hard road",
    favouriteClothing: 'A pair of worn Wranglers that he\'s had through the fields, the mines, heartbreak and pain. Describes them as "feeling like home".'
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Alex Wilson</h1>
          <p className="text-xl text-gray-600">Singer-Songwriter from Pikeville, Kentucky</p>
        </div>

        {/* Photos */}
        <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
          <h2 className="text-2xl font-semibold mb-4 text-center">Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-center">
              <img 
                src="/alex1.png" 
                alt="Alex Wilson - Photo 1" 
                className="rounded-lg shadow-lg max-w-full h-auto max-h-96 object-cover"
              />
            </div>
            <div className="flex justify-center">
              <img 
                src="/alex2.png" 
                alt="Alex Wilson - Photo 2" 
                className="rounded-lg shadow-lg max-w-full h-auto max-h-96 object-cover"
              />
            </div>
          </div>
        </div>

        {/* Media Player */}
        <ProfileMediaPlayer songs={songs} />

        {/* Quick Facts Grid */}
        <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
          <h2 className="text-2xl font-semibold mb-4">Quick Facts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Age:</span>
              <span className="ml-2 text-gray-600">{basicInfo.age}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Height:</span>
              <span className="ml-2 text-gray-600">{basicInfo.height}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Hometown:</span>
              <span className="ml-2 text-gray-600">{basicInfo.hometown}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Hidden Talent:</span>
              <span className="ml-2 text-gray-600">{basicInfo.hiddenTalent}</span>
            </div>
          </div>
        </div>

        {/* Musical Background */}
        <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
          <h2 className="text-2xl font-semibold mb-4">Musical Background</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Instruments</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {basicInfo.instruments.map((instrument, index) => (
                  <li key={index}>{instrument}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Favourite Musicians</h3>
              <div className="flex flex-wrap gap-2">
                {basicInfo.favoriteMusicians.map((musician, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {musician}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Favourite Songs</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {basicInfo.favoriteSongs.map((song, index) => (
                  <li key={index}>{song}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Most Influential Album</h3>
              <p className="text-gray-600">{basicInfo.mostInfluentialAlbum}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Dream Collaborations</h3>
              <div className="flex flex-wrap gap-2">
                {basicInfo.dreamCollaborations.map((artist, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {artist}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
          <h2 className="text-2xl font-semibold mb-4">Personal Details</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Signature Look</h3>
              <p className="text-gray-600">{basicInfo.signatureLook}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Favourite Item of Clothing</h3>
              <p className="text-gray-600">{basicInfo.favouriteClothing}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Favourite Place to Write</h3>
              <p className="text-gray-600">{basicInfo.favouritePlace}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Most Treasured Possession</h3>
              <p className="text-gray-600">{basicInfo.treasuredPossession}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Biggest Fear</h3>
              <p className="text-gray-600">{basicInfo.biggestFear}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">View on Fame</h3>
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600">
                "{basicInfo.viewOnFame}"
              </blockquote>
            </div>
          </div>
        </div>

        {/* Biography */}
        <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
          <h2 className="text-2xl font-semibold mb-4">Biography</h2>
          
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              At nineteen, Alex Wilson carries his scars like armour and his past like a shadow—always close, always shaping who he is. His body has been forged by labour and hardship: broad shoulders that taper into a lean, muscular frame, each sinew a testament to the life he's lived. His sun-bronzed skin bears the imprint of too many harsh summers, while calloused hands tell silent stories of work, pain, and persistence.
            </p>

            <p>
              He grew up in a battered double-wide trailer, rusting silently at the forgotten end of Blackberry Creek Road near Pikeville, Kentucky—coal country. Their home was a steel cage of broken glass and whispered secrets, resting precariously on cinder blocks amid scrubby pines and mountains that watched in silent judgment. Inside, silence was currency, and Alex learned early how precious words could be.
            </p>

            <p>
              Behind those splintered walls, music became his salvation. At six years old, he rescued a cracked and rusted guitar from a roadside dump, smuggling it home beneath his jacket to hide beneath loose floorboards. It became his companion in darkness, strings vibrating with unspoken truths, each note another breath in suffocating silence.
            </p>

            <p>
              By the time he was nine, Alex was working. His father stayed passed out most mornings, and if he wanted food or a way to get to school, he had to earn it. He bussed tables, picked crops, washed trailers—anything he could do to keep the lights on. In poor country, nobody looked twice. He raised himself, scraped his knees and stitched his own pride.
            </p>

            <p>
              His musical talent isn't learned—it's lived. Complete songs form vividly in his mind, spilling out fully formed, raw and powerful as storms rolling down the Appalachians. He chases melodies blindly, hands driven by an urgency to release whatever's trapped inside him. It isn't talent as much as it is survival, the lifeline thrown into his solitary ocean of despair.
            </p>

            <p>
              Every instrument he touched became an ally. Invisible piano keys danced under his fingertips on kitchen tables, their silent melodies his first real taste of hope. An abandoned violin, salvaged from a roadside dumpster, sang beneath his touch, its broken strings transforming sorrow into something achingly beautiful. Instruments became weapons—each note a shield, each song a battle won against his past.
            </p>

            <p>
              At sixteen, a fist marked his birthday and eviction notice simultaneously. Cast out with nothing but his instruments and unbroken spirit, he found shelter in another cramped trailer down the road—barely a home, yet entirely his. Work was constant: fields, farms, and eventually mines, hands bloodied, knees raw, lungs filled with coal dust. Each dollar earned was another stitch holding his fragmented dreams together.
            </p>

            <p>
              He built muscle over trauma, seeking strength as armour against vulnerability. Yet, despite relentless hours in fields and mines, the music persisted—trapped, aching, whispering incessantly from within. That battered guitar, once hidden beneath his childhood fears, now travels openly by his side. It remains his shield, his sword, his deepest truth.
            </p>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-800 mb-2">Notable Experience</h3>
              <p className="text-gray-600">
                <strong>Worst Injury:</strong> {basicInfo.worstInjury}
              </p>
            </div>

            <p className="font-medium italic text-blue-700">
              Someday soon, Alex will summon the courage to let these buried songs free, tearing down the walls he's spent a lifetime constructing. And when that moment comes, the world won't just hear his music—they'll feel it, raw and powerful, echoing from holler to mountaintop, a voice finally breaking free from silence.
            </p>
          </div>
        </div>

        {/* Musical Philosophy */}
        <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
          <h2 className="text-2xl font-semibold mb-4">Musical Philosophy</h2>
          <p className="text-gray-700 leading-relaxed">
            Alex's music emerges from the shadows of the mountains, echoing the silent ache within him. His voice—deep and resonant, rugged as mountain rock—carries gravelly tones reminiscent of Chris Stapleton, Johnny Cash's quiet gravity, and the fiery grit of Travis Tritt. Yet no one has heard it. He's never played a gig, never stood before a mic. His songs are his alone, scribbled into margins and murmured into silence. Each note carries pain, honesty, and defiance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import React, { useEffect, useState } from 'react';

const SongPerformance = ({ song, onComplete }) => {
  const [displayedSections, setDisplayedSections] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  // Generate social media comments based on song attributes
  const generateComments = (verse, index) => {
    const templates = {
      emotional: [
        "😭 this hits different at 2am",
        "who gave him the right to destroy me like this",
        "FELT THAT IN MY SOUL",
        "crying in the club rn",
        "this man really said let me ruin your whole day"
      ],
      upbeat: [
        "🔥🔥🔥 STRAIGHT FIRE",
        "THIS IS A VIBE",
        "adding this to everything omg",
        "the way this SLAPS",
        "turn it UP 🎵"
      ],
      storytelling: [
        "wait wait wait... did he just...",
        "THE STORYTELLING >>> ",
        "movie when???",
        "I need to know what happens next",
        "bruh the imagery though"
      ],
      authentic: [
        "real recognize real",
        "finally someone keeping it 💯",
        "the RAW EMOTION",
        "this is what music is supposed to be",
        "no cap this is ART"
      ]
    };

    // Determine comment style based on song attributes
    const styles = [];
    if (song.attributes?.emotionalImpact > 7) styles.push('emotional');
    if (song.tempo === 'upbeat' || song.mood === 'hopeful') styles.push('upbeat');
    if (song.narrative === 'strong') styles.push('storytelling');
    if (song.attributes?.rawness > 7) styles.push('authentic');
    
    if (styles.length === 0) styles.push('authentic'); // default

    const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
    const comments = templates[selectedStyle];
    
    // Generate 2-4 comments per verse
    const numComments = 2 + Math.floor(Math.random() * 3);
    const selectedComments = [];
    
    for (let i = 0; i < numComments; i++) {
      const platform = ['twitter', 'tiktok', 'instagram', 'youtube'][Math.floor(Math.random() * 4)];
      const username = generateUsername();
      const likes = Math.floor(Math.random() * 5000) + 100;
      
      selectedComments.push({
        platform,
        username,
        text: comments[Math.floor(Math.random() * comments.length)],
        likes,
        timestamp: `${Math.floor(Math.random() * 59)}s ago`
      });
    }
    
    return selectedComments;
  };

  const generateUsername = () => {
    const prefixes = ['music', 'country', 'real', 'coal', 'mountain', 'soul', 'midnight'];
    const suffixes = ['lover', 'soul', 'heart', 'vibes', 'dreams', 'life', 'fan'];
    const numbers = Math.floor(Math.random() * 999);
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}${numbers}`;
  };

  const platformIcons = {
    twitter: '🐦',
    tiktok: '🎵',
    instagram: '📷',
    youtube: '▶️'
  };

  useEffect(() => {
    if (!song.lyrics) return;

    // Parse lyrics into sections
    const sections = song.lyrics.split('\n\n').filter(section => section.trim());
    let delay = 0;
    const delayIncrement = 3000; // 3 seconds between sections

    sections.forEach((section, index) => {
      setTimeout(() => {
        const sectionLines = section.split('\n').filter(line => line.trim());
        const isChorus = sectionLines[0]?.toLowerCase().includes('chorus');
        const comments = generateComments(section, index);
        
        setDisplayedSections(prev => [...prev, {
          type: 'lyrics',
          content: sectionLines,
          isChorus
        }]);

        // Add comments after a short delay
        setTimeout(() => {
          setDisplayedSections(prev => [...prev, {
            type: 'comments',
            content: comments
          }]);
        }, 1500);
      }, delay);
      
      delay += delayIncrement;
    });

    // Mark as complete after all sections
    setTimeout(() => {
      setIsComplete(true);
    }, delay + 2000);
  }, [song]);

  return (
    <div className="space-y-6 my-8">
      {/* Song Introduction */}
      <div className="text-center space-y-2">
        <p className="text-gray-400 italic">*Alex takes a deep breath and begins to play*</p>
        <h3 className="text-2xl font-bold text-yellow-400">{song.title}</h3>
      </div>

      {/* Lyrics and Comments */}
      {displayedSections.map((section, index) => (
        <div key={index} className="animate-fadeIn">
          {section.type === 'lyrics' ? (
            <div className={`${section.isChorus ? 'ml-8 border-l-2 border-yellow-500 pl-4' : ''} space-y-2`}>
              {section.content.map((line, lineIndex) => (
                <p key={lineIndex} className="text-gray-200 italic">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <div className="space-y-3 my-6">
              {section.content.map((comment, commentIndex) => (
                <div key={commentIndex} className="flex items-start gap-3 opacity-70">
                  <span className="text-lg">{platformIcons[comment.platform]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-400">@{comment.username}</span>
                      <span className="text-xs text-gray-500">• {comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">❤️ {comment.likes.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Completion */}
      {isComplete && (
        <div className="text-center space-y-4 animate-fadeIn">
          <p className="text-gray-400 italic">*The last note fades into the {song.setting || 'night'} air*</p>
          <div className="text-yellow-400 text-sm">
            🎵 Song performed: +2 Authenticity | Audience engagement increasing...
          </div>
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default SongPerformance;

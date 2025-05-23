import React, { useState, useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext';

const SocialMediaFeed = ({ song, platform = 'twitter' }) => {
  const { gameState, generatePlatformReaction } = useGameState();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const platforms = {
    twitter: {
      name: 'X/Twitter',
      icon: '𝕏',
      color: 'bg-black',
      maxLength: 280
    },
    tiktok: {
      name: 'TikTok',
      icon: '♪',
      color: 'bg-gradient-to-br from-pink-500 to-blue-500',
      features: ['duet', 'sound']
    },
    instagram: {
      name: 'Instagram',
      icon: '📷',
      color: 'bg-gradient-to-br from-purple-600 to-pink-500',
      features: ['story', 'reel']
    },
    youtube: {
      name: 'YouTube',
      icon: '▶️',
      color: 'bg-red-600',
      features: ['likes', 'comments']
    }
  };
  
  const generateUsername = () => {
    const adjectives = ['country', 'mountain', 'bluegrass', 'nashville', 'appalachian', 'coal', 'steel'];
    const nouns = ['soul', 'heart', 'voice', 'fan', 'lover', 'roots', 'revival'];
    const numbers = Math.floor(Math.random() * 999);
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${nouns[Math.floor(Math.random() * nouns.length)]}${numbers}`;
  };
  
  const generatePost = () => {
    const username = generateUsername();
    const isVerified = gameState.meters.Reputation > 5 && Math.random() > 0.7;
    const timestamp = new Date();
    const reaction = generatePlatformReaction(platform, song.title, gameState.meters.Reputation);
    
    return {
      id: Date.now() + Math.random(),
      username,
      isVerified,
      content: reaction,
      timestamp,
      likes: Math.floor(Math.random() * (gameState.audience.online * 100)) + 10,
      shares: Math.floor(Math.random() * (gameState.audience.online * 20)) + 1,
      platform
    };
  };
  
  const loadPosts = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newPosts = [];
      const postCount = Math.min(5 + gameState.audience.online, 15);
      
      for (let i = 0; i < postCount; i++) {
        newPosts.push(generatePost());
      }
      
      setPosts(newPosts);
      setIsLoading(false);
    }, 1000);
  };
  
  useEffect(() => {
    if (song.released) {
      loadPosts();
    }
  }, [song.released, platform]);
  
  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };
  
  if (!song.released) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500">Release this song to see social media reactions</p>
      </div>
    );
  }
  
  const currentPlatform = platforms[platform];
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Platform header */}
      <div className={`${currentPlatform.color} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{currentPlatform.icon}</span>
            <span className="font-bold text-lg">{currentPlatform.name}</span>
          </div>
          <button
            onClick={loadPosts}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Posts */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse text-gray-500">Loading reactions...</div>
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex space-x-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {post.username[0].toUpperCase()}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-1 mb-1">
                    <span className="font-semibold">@{post.username}</span>
                    {post.isVerified && <span className="text-blue-500">✓</span>}
                    <span className="text-gray-500 text-sm">· {formatTimestamp(post.timestamp)}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 mb-2">{post.content}</p>
                  
                  {/* Engagement */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <button className="hover:text-red-500 transition-colors">
                      ❤️ {post.likes}
                    </button>
                    <button className="hover:text-blue-500 transition-colors">
                      🔄 {post.shares}
                    </button>
                    {platform === 'youtube' && (
                      <button className="hover:text-gray-700 transition-colors">
                        💬 Reply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No reactions yet. Build your audience to see more engagement!
          </div>
        )}
      </div>
      
      {/* Platform stats */}
      {posts.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 text-sm">
          <div className="flex justify-around text-center">
            <div>
              <div className="font-semibold text-lg">
                {posts.reduce((sum, post) => sum + post.likes, 0)}
              </div>
              <div className="text-gray-500">Total Likes</div>
            </div>
            <div>
              <div className="font-semibold text-lg">
                {posts.reduce((sum, post) => sum + post.shares, 0)}
              </div>
              <div className="text-gray-500">Total Shares</div>
            </div>
            <div>
              <div className="font-semibold text-lg">
                {Math.floor(gameState.audience.online * 1000)}
              </div>
              <div className="text-gray-500">Reach</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaFeed;

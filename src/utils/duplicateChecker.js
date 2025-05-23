// Utility functions for detecting duplicate songs

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

// Calculate similarity percentage between two strings
export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Normalize string for comparison (remove punctuation, extra spaces, convert to lowercase)
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
    .trim();
}

// Check for exact title duplicates
export function findExactTitleDuplicates(songs) {
  const duplicates = [];
  const titleMap = new Map();
  
  songs.forEach(song => {
    const normalizedTitle = normalizeString(song.title);
    
    if (titleMap.has(normalizedTitle)) {
      const existing = titleMap.get(normalizedTitle);
      // Check if this is the first duplicate found for this title
      const existingGroup = duplicates.find(group => 
        group.some(s => s.slug === existing.slug)
      );
      
      if (existingGroup) {
        existingGroup.push(song);
      } else {
        duplicates.push([existing, song]);
      }
    } else {
      titleMap.set(normalizedTitle, song);
    }
  });
  
  return duplicates;
}

// Check for similar titles using fuzzy matching
export function findSimilarTitles(songs, threshold = 0.8) {
  const duplicates = [];
  const processed = new Set();
  
  for (let i = 0; i < songs.length; i++) {
    if (processed.has(songs[i].slug)) continue;
    
    const similar = [songs[i]];
    processed.add(songs[i].slug);
    
    for (let j = i + 1; j < songs.length; j++) {
      if (processed.has(songs[j].slug)) continue;
      
      const similarity = calculateSimilarity(
        normalizeString(songs[i].title),
        normalizeString(songs[j].title)
      );
      
      if (similarity >= threshold) {
        similar.push(songs[j]);
        processed.add(songs[j].slug);
      }
    }
    
    if (similar.length > 1) {
      duplicates.push(similar);
    }
  }
  
  return duplicates;
}

// Check for exact lyrics duplicates
export function findExactLyricsDuplicates(songs) {
  const duplicates = [];
  const lyricsMap = new Map();
  
  songs.forEach(song => {
    if (!song.lyrics || song.lyrics.trim() === '') return;
    
    const normalizedLyrics = normalizeString(song.lyrics);
    
    if (lyricsMap.has(normalizedLyrics)) {
      const existing = lyricsMap.get(normalizedLyrics);
      const existingGroup = duplicates.find(group => 
        group.some(s => s.slug === existing.slug)
      );
      
      if (existingGroup) {
        existingGroup.push(song);
      } else {
        duplicates.push([existing, song]);
      }
    } else {
      lyricsMap.set(normalizedLyrics, song);
    }
  });
  
  return duplicates;
}

// Check for similar lyrics using fuzzy matching
export function findSimilarLyrics(songs, threshold = 0.9) {
  const duplicates = [];
  const processed = new Set();
  const songsWithLyrics = songs.filter(song => song.lyrics && song.lyrics.trim() !== '');
  
  for (let i = 0; i < songsWithLyrics.length; i++) {
    if (processed.has(songsWithLyrics[i].slug)) continue;
    
    const similar = [songsWithLyrics[i]];
    processed.add(songsWithLyrics[i].slug);
    
    for (let j = i + 1; j < songsWithLyrics.length; j++) {
      if (processed.has(songsWithLyrics[j].slug)) continue;
      
      const similarity = calculateSimilarity(
        normalizeString(songsWithLyrics[i].lyrics),
        normalizeString(songsWithLyrics[j].lyrics)
      );
      
      if (similarity >= threshold) {
        similar.push(songsWithLyrics[j]);
        processed.add(songsWithLyrics[j].slug);
      }
    }
    
    if (similar.length > 1) {
      duplicates.push(similar);
    }
  }
  
  return duplicates;
}

// Comprehensive duplicate check
export function findAllDuplicates(songs, options = {}) {
  const {
    checkExactTitles = true,
    checkSimilarTitles = true,
    checkExactLyrics = true,
    checkSimilarLyrics = false,
    titleSimilarityThreshold = 0.8,
    lyricsSimilarityThreshold = 0.9
  } = options;
  
  const results = {
    exactTitles: checkExactTitles ? findExactTitleDuplicates(songs) : [],
    similarTitles: checkSimilarTitles ? findSimilarTitles(songs, titleSimilarityThreshold) : [],
    exactLyrics: checkExactLyrics ? findExactLyricsDuplicates(songs) : [],
    similarLyrics: checkSimilarLyrics ? findSimilarLyrics(songs, lyricsSimilarityThreshold) : []
  };
  
  return results;
}

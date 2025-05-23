/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - A URL-friendly slug
 */
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') {
    console.error('Invalid input to generateSlug:', text);
    throw new Error('Invalid text for slug generation');
  }
  
  // Convert text to lowercase
  let slug = text.toLowerCase().trim();
  
  // Replace any non-alphanumeric characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  
  // Remove hyphens from the beginning and end
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Ensure the slug has at least some content
  if (!slug) {
    slug = 'song';
  }
  
  // Always add a timestamp to ensure uniqueness
  const timestamp = Date.now();
  slug = `${slug}-${timestamp}`;
  
  console.log(`Generated slug: "${slug}" from text: "${text}"`);
  return slug;
};

/**
 * Format a date in a friendly way
 * @param {Date|number|string} date - The date to format
 * @returns {string} - A formatted date string
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format a file size in a friendly way
 * @param {number} bytes - The file size in bytes
 * @param {number} decimals - The number of decimal places
 * @returns {string} - A formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if a file is an audio file
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if the file is an audio file
 */
export const isAudioFile = (filename) => {
  const supportedAudioTypes = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return supportedAudioTypes.includes(extension);
};

/**
 * Check if a file is an image file
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if the file is an image file
 */
export const isImageFile = (filename) => {
  const supportedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return supportedImageTypes.includes(extension);
};

/**
 * Get a contrasting text color (black or white) based on background color
 * @param {string} bgColor - The background color in hex format (e.g., "#ff0000")
 * @returns {string} - Either "#ffffff" or "#000000"
 */
export const getContrastingTextColor = (bgColor) => {
  // Default to black if invalid bgColor
  if (!bgColor || bgColor.charAt(0) !== '#') {
    return '#000000';
  }
  
  // Remove the hash at the beginning
  let color = bgColor.substring(1);
  
  // Parse colors (handle both 3-digit and 6-digit formats)
  let r, g, b;
  if (color.length === 3) {
    r = parseInt(color.charAt(0) + color.charAt(0), 16);
    g = parseInt(color.charAt(1) + color.charAt(1), 16);
    b = parseInt(color.charAt(2) + color.charAt(2), 16);
  } else if (color.length === 6) {
    r = parseInt(color.substring(0, 2), 16);
    g = parseInt(color.substring(2, 4), 16);
    b = parseInt(color.substring(4, 6), 16);
  } else {
    return '#000000';
  }
  
  // Calculate luminance (perceived brightness)
  // Formula: (0.299*R + 0.587*G + 0.114*B)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Use white text for dark backgrounds, black text for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Get a random color in hex format
 * @returns {string} - A random color in hex format
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
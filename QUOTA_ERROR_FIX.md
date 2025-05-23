# 🚨 localStorage Quota Error - Solution

## The Problem
Your localStorage is completely full, preventing even the migration from running. This happens when you have many songs with individual property entries.

## The Solution

### Option 1: Use the Cleanup Tool (Recommended)
1. Open `cleanup.html` in your browser
2. Click "Analyze Storage" to see what's using space
3. Click "Backup Data" to save your songs (recommended)
4. Click "Clean Up Storage" to free space
5. Click "Continue to App" to load the songbook with migration

### Option 2: Manual Browser Console Cleanup
If the cleanup tool doesn't work, paste this in your browser console:

```javascript
// Emergency cleanup - removes individual song properties
const keysToRemove = Object.keys(localStorage).filter(key => 
  key.startsWith('lyrics-') || 
  key.startsWith('notes-') || 
  key.startsWith('title-') || 
  key.startsWith('soundsLike-') ||
  key.startsWith('image-') ||
  key.startsWith('audio-')
);

console.log(`Removing ${keysToRemove.length} song property entries...`);
keysToRemove.forEach(key => {
  try {
    localStorage.removeItem(key);
  } catch(e) {
    console.error(`Failed to remove ${key}`);
  }
});

console.log('Cleanup complete! Refresh the page.');
```

### Option 3: Clear Everything (Last Resort)
If nothing else works:
1. Open browser DevTools (F12)
2. Go to Application → Storage → Local Storage
3. Right-click your domain
4. Select "Clear"
5. Reload the app (you'll lose custom songs but can restore from backup)

## After Cleanup

Once you've freed up space:
1. The app will automatically migrate remaining data to IndexedDB
2. You won't have storage quota issues anymore
3. All your songs will be preserved (from custom-songs if individual entries were removed)

## Prevention

The new IndexedDB system prevents this issue by:
- Using a database instead of individual localStorage entries
- Supporting gigabytes of storage instead of 5-10MB
- Efficiently storing all song data together

## Need Help?

If you're still having issues:
1. Check browser console for specific errors
2. Try in an incognito/private window
3. Ensure JavaScript is enabled
4. Try a different browser

The migration only needs to run once - after that, you'll never see quota errors again!

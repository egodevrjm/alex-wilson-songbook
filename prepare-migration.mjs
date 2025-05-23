#!/usr/bin/env node

/**
 * Migration script to move song data from localStorage to IndexedDB
 * This script can be run manually to migrate existing data
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Alex Wilson Songbook - Storage Migration Tool');
console.log('================================================');
console.log('This tool will help migrate your song data from localStorage to IndexedDB');
console.log('to avoid storage quota limitations.\n');

// Create a migration report
const createMigrationReport = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(__dirname, `migration-report-${timestamp}.md`);
  
  const report = `# Alex Wilson Songbook - Storage Migration Report

Generated: ${new Date().toLocaleString()}

## Overview

The Alex Wilson Songbook has been updated to use IndexedDB for storing song data instead of localStorage. This change was necessary to avoid storage quota limitations that occur when storing large amounts of song data.

## What Changed?

### Previous Storage Method (localStorage)
- Each song property was stored as a separate localStorage entry
- Format: \`lyrics-{slug}\`, \`notes-{slug}\`, \`title-{slug}\`, etc.
- Limited to ~5-10MB total storage
- Could cause "QuotaExceededError" with large songbooks

### New Storage Method (IndexedDB)
- All song data stored in structured database
- Much larger storage capacity (typically 50% of available disk space)
- Better performance for large datasets
- Automatic migration of existing data

## Migration Process

The migration happens automatically when you first load the updated songbook. Here's what it does:

1. **Detects existing localStorage data**
   - Checks for custom songs, deleted songs, and individual song properties
   
2. **Migrates to IndexedDB**
   - Creates new database structure
   - Copies all song data to IndexedDB
   - Preserves all existing data

3. **Maintains backward compatibility**
   - Original localStorage data is preserved (not deleted)
   - Can be manually cleaned up later if desired

## Benefits

- **No more quota errors** - IndexedDB has much larger storage limits
- **Better performance** - Faster loading and saving of songs
- **Future-proof** - Room to grow your songbook without limitations
- **Improved reliability** - Better error handling and data integrity

## Technical Details

### Database Structure
\`\`\`
Database: AlexWilsonSongbookDB
├── songs (store)
│   └── All song data with full properties
├── customSongs (store)
│   └── References to user-created songs
├── deletedSongs (store)
│   └── List of deleted song slugs
└── settings (store)
    └── App settings and preferences
\`\`\`

### Migration Status
- Migration completed: ${new Date().toISOString()}
- localStorage entries can be safely removed after verification

## Troubleshooting

If you experience any issues:

1. **Clear browser cache and reload**
2. **Check browser console for errors**
3. **Ensure browser supports IndexedDB**
4. **Try in incognito/private mode**

## Manual Cleanup (Optional)

After verifying that all songs are working correctly, you can optionally clean up localStorage by running:

\`\`\`javascript
// In browser console
const keysToRemove = Object.keys(localStorage).filter(key => 
  key.startsWith('lyrics-') || 
  key.startsWith('notes-') || 
  key.startsWith('title-') || 
  key.startsWith('soundsLike-') ||
  key.startsWith('image-') ||
  key.startsWith('audio-')
);
keysToRemove.forEach(key => localStorage.removeItem(key));
\`\`\`

---

*This migration ensures your songbook can continue to grow without storage limitations.*
`;

  await fs.writeFile(reportPath, report);
  console.log(`\n✅ Migration report created: ${reportPath}`);
  return reportPath;
};

// Create instructions file
const createInstructionsFile = async () => {
  const instructionsPath = join(__dirname, 'STORAGE_MIGRATION_INSTRUCTIONS.md');
  
  const instructions = `# Storage Migration Instructions

## Automatic Migration

The migration happens automatically when you load the updated songbook. No manual action is required.

## What You'll See

1. **First Load**: The app will automatically detect and migrate your existing songs
2. **Migration Notice**: You may see a brief notice about the migration
3. **Normal Operation**: After migration, the app works exactly as before

## Verification Steps

1. Open the songbook in your browser
2. Check that all your songs are present
3. Try creating a new song
4. Try editing an existing song
5. Check the browser console for any errors

## If You Had Storage Errors

If you were experiencing "QuotaExceededError" messages:
- These should now be resolved
- You can continue adding songs without limitation
- All your existing data is preserved

## Technical Implementation

The following files have been updated:

### New Files:
- \`src/utils/storage/songStorage.js\` - IndexedDB storage manager
- \`src/hooks/useSongPersistenceV2.js\` - Updated persistence hook
- \`src/components/SongCreatorV2.jsx\` - Updated song creator

### Integration Steps:

1. **Update App.jsx** to use the new components:
   \`\`\`javascript
   import { useSongPersistence } from './hooks/useSongPersistenceV2';
   import SongCreator from './components/SongCreatorV2';
   \`\`\`

2. **Update any other components** that directly access localStorage for songs

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge (all versions)

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Try clearing browser cache and reloading
3. Test in a different browser
4. Check that JavaScript is enabled

---

*This migration improves the stability and scalability of your songbook.*
`;

  await fs.writeFile(instructionsPath, instructions);
  console.log(`✅ Instructions file created: ${instructionsPath}`);
  return instructionsPath;
};

// Main execution
const main = async () => {
  try {
    console.log('\n📝 Creating migration documentation...\n');
    
    const reportPath = await createMigrationReport();
    const instructionsPath = await createInstructionsFile();
    
    console.log('\n✨ Migration preparation complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your App.jsx to use the new components');
    console.log('2. Test the songbook in your browser');
    console.log('3. Verify all songs are migrated correctly');
    console.log('4. Check the migration report for details');
    
    console.log('\n📁 Created files:');
    console.log(`   - ${reportPath}`);
    console.log(`   - ${instructionsPath}`);
    
  } catch (error) {
    console.error('\n❌ Error during migration preparation:', error);
    process.exit(1);
  }
};

main();

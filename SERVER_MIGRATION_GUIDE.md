# 🚀 Server-Side Storage Migration Guide

This guide will help you migrate from browser storage (localStorage/IndexedDB) to **Vercel KV storage** for persistent data across all users.

## 🎯 **What This Achieves**

- ✅ **Shared Data**: Songs and albums uploaded by admin are visible to all public users
- ✅ **Persistent Storage**: Data survives browser changes and device switches
- ✅ **Scalable**: Can handle much larger datasets than browser storage
- ✅ **Reliable**: Server-side backup and redundancy

## 📋 **Prerequisites**

1. **Vercel Account** (free tier works)
2. **Vercel CLI** installed: `npm i -g vercel`
3. **Project deployed to Vercel** (or local development with Vercel dev)

## 🛠️ **Setup Steps**

### **1. Create Vercel KV Database**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Choose **KV (Key-Value)**
6. Name it: `alex-wilson-songbook-kv`
7. Choose region closest to your users
8. Click **Create**

### **2. Get Environment Variables**

After creating the KV database:

1. Go to **Settings** tab in your KV database
2. Copy these three variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN` 
   - `KV_REST_API_READ_ONLY_TOKEN`

### **3. Update Environment Variables**

#### **For Deployed App (Vercel Dashboard):**
1. Go to your project in Vercel Dashboard
2. Go to **Settings** > **Environment Variables**
3. Add these variables:

```bash
ADMIN_PASSWORD=your-secure-admin-password-here
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
KV_REST_API_URL=your-kv-rest-api-url-from-step-2
KV_REST_API_TOKEN=your-kv-rest-api-token-from-step-2
KV_REST_API_READ_ONLY_TOKEN=your-kv-rest-api-read-only-token-from-step-2
NODE_ENV=production
```

#### **For Local Development (.env file):**

Update your `.env` file:

```bash
# Google Gemini API Key from https://aistudio.google.com/
GEMINI_API_KEY=your-gemini-api-key-here

# Server port (optional, defaults to 3001)
PORT=3001

# AUTHENTICATION (Replace with your secure passwords)
ADMIN_PASSWORD=your-secure-admin-password-here
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long-replace-this

# VERCEL KV STORAGE (Add from Vercel Dashboard)
KV_REST_API_URL=your-kv-rest-api-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-rest-api-read-only-token

# DEPLOYMENT
NODE_ENV=development
```

### **4. Generate Secure Secrets**

Run this to generate secure authentication keys:

```bash
# Generate JWT Secret (32+ characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate Admin Password (16 characters)
node -e "console.log('ADMIN_PASSWORD=' + require('crypto').randomBytes(8).toString('hex'))"
```

### **5. Deploy Changes**

```bash
# Deploy to Vercel
vercel --prod

# Or for local development with Vercel functions
vercel dev
```

## 🔄 **Data Migration (If You Have Existing Songs)**

If you already have songs stored in browser storage, here's how to migrate them:

### **Option 1: Export/Import via UI**
1. Before switching to server storage, use the **Export Manager** in Settings
2. Export all your songs to a JSON file
3. After setup, use **Import Manager** to upload the file

### **Option 2: Manual API Migration** (Advanced)

Create a migration script to move localStorage data to server:

```javascript
// Run this in browser console BEFORE switching to server storage
const exportData = () => {
  const songs = JSON.parse(localStorage.getItem('songs') || '[]');
  const albums = JSON.parse(localStorage.getItem('songbook-albums') || '[]');
  
  const exportData = {
    songs,
    albums,
    exportedAt: new Date().toISOString()
  };
  
  // Download as JSON file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'alex-wilson-songbook-backup.json';
  a.click();
};

exportData();
```

Then import via the UI after server setup.

## 🧪 **Testing the Migration**

### **1. Test Server Storage**
```bash
# Test API endpoints locally
curl http://localhost:3000/api/data?action=songs

# Test authentication
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'
```

### **2. Verify Data Sharing**

1. **Admin View**: 
   - Sign in as admin
   - Create a test song with image/audio
   - Note the song appears immediately

2. **Public View**: 
   - Open incognito/private window
   - Visit your app without signing in
   - Verify the test song appears for public users

3. **Cross-Device Test**:
   - Check the song appears on different devices
   - Verify images and audio work everywhere

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. "Invalid credentials" Error**
```bash
# Check environment variables are set
vercel env ls

# Make sure JWT_SECRET is 32+ characters
echo $JWT_SECRET | wc -c  # Should be 32+
```

#### **2. "Failed to load songs" Error**
```bash
# Check KV database connection
vercel logs --function=api/data

# Verify KV variables are correct in Vercel Dashboard
```

#### **3. Songs Don't Appear for Public Users**
- Ensure you're using the server persistence hooks
- Check API endpoint returns data: `curl yourapp.vercel.app/api/data?action=songs`
- Verify no authentication errors in browser network tab

#### **4. Images/Audio Don't Load**
- Check file size limits (Vercel KV has 1MB per key limit)
- Consider using external storage (Cloudinary, AWS S3) for large media
- For now, keep images under 500KB and audio under 10MB

### **Rollback Plan**

If you need to rollback to browser storage:

1. Revert these files:
   ```bash
   git checkout HEAD~1 src/App.jsx
   git checkout HEAD~1 src/hooks/useSongPersistenceV2.js
   git checkout HEAD~1 src/hooks/useAlbumPersistence.js
   ```

2. Export data from server first:
   ```bash
   curl yourapp.vercel.app/api/data?action=songs > songs-backup.json
   curl yourapp.vercel.app/api/data?action=albums > albums-backup.json
   ```

## 🎉 **Success Verification**

You'll know the migration worked when:

- ✅ Admin can create songs that immediately appear for public users
- ✅ Songs persist across browser refreshes and device changes  
- ✅ Images and audio files work for all users
- ✅ No "loading from localStorage" messages in console
- ✅ Data survives clearing browser storage

## 📊 **Performance Notes**

- **First Load**: May be slightly slower as it fetches from server
- **Subsequent Loads**: Should be fast with proper caching
- **Storage Limits**: Vercel KV free tier: 30,000 requests/month, 256MB storage
- **Scaling**: For high-traffic apps, consider Vercel Pro plan

## 🔐 **Security Considerations**

- **Admin Password**: Use a strong, unique password
- **JWT Secret**: Never commit to git, use environment variables only
- **API Rate Limiting**: Currently basic, consider adding rate limiting for production
- **Data Validation**: Server validates all inputs to prevent malicious data

---

**Need Help?** Check the browser console for detailed error messages, or examine the Vercel function logs for server-side issues.

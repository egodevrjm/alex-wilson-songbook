#!/usr/bin/env node

/**
 * Security Setup Helper
 * Generates secure environment variables for deployment
 */

const crypto = require('crypto');

console.log('🔐 Alex Wilson Songbook - Security Setup\n');

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Generate suggested admin password
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
let adminPassword = '';
for (let i = 0; i < 16; i++) {
  adminPassword += chars.charAt(Math.floor(Math.random() * chars.length));
}

console.log('📝 Copy these to your Vercel environment variables:\n');

console.log('ADMIN_PASSWORD=' + adminPassword);
console.log('JWT_SECRET=' + jwtSecret);
console.log('GEMINI_API_KEY=your-gemini-api-key-here');

console.log('\n🔒 Save your admin password securely!');
console.log('Password:', adminPassword);

console.log('\n📋 Next steps:');
console.log('1. Add these to Vercel dashboard → Settings → Environment Variables');
console.log('2. Deploy your app');
console.log('3. Sign in with your generated password');

console.log('\n✅ Your songbook will be secure for public deployment!');

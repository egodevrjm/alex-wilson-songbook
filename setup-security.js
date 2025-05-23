#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Alex Wilson Songbook - Security Setup');
console.log('=====================================\n');

// Generate secure JWT secret (32 bytes = 64 hex chars)
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Generate secure admin password (16 bytes = 32 hex chars)
const adminPassword = crypto.randomBytes(16).toString('hex');

console.log('Generated secure credentials:');
console.log('');
console.log('ADMIN_PASSWORD=' + adminPassword);
console.log('JWT_SECRET=' + jwtSecret);
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env file');
} catch (error) {
  console.log('⚠️  No .env file found, will create one');
}

// Update or add the credentials
let updatedContent = envContent;

// Update JWT_SECRET
if (updatedContent.includes('JWT_SECRET=')) {
  updatedContent = updatedContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
  console.log('✅ Updated JWT_SECRET in .env');
} else {
  updatedContent += `\nJWT_SECRET=${jwtSecret}`;
  console.log('✅ Added JWT_SECRET to .env');
}

// Update ADMIN_PASSWORD
if (updatedContent.includes('ADMIN_PASSWORD=')) {
  updatedContent = updatedContent.replace(/ADMIN_PASSWORD=.*/, `ADMIN_PASSWORD=${adminPassword}`);
  console.log('✅ Updated ADMIN_PASSWORD in .env');
} else {
  updatedContent += `\nADMIN_PASSWORD=${adminPassword}`;
  console.log('✅ Added ADMIN_PASSWORD to .env');
}

// Write the updated .env file
try {
  fs.writeFileSync(envPath, updatedContent);
  console.log('✅ Updated .env file successfully');
} catch (error) {
  console.error('❌ Error writing .env file:', error.message);
  process.exit(1);
}

console.log('');
console.log('🚀 Next Steps:');
console.log('1. Set up Vercel KV database (see SERVER_MIGRATION_GUIDE.md)');
console.log('2. Add KV environment variables to .env');
console.log('3. Deploy to Vercel or run locally with: vercel dev');
console.log('');
console.log('📝 Your admin credentials:');
console.log('Username: admin');
console.log('Password: ' + adminPassword);
console.log('');
console.log('⚠️  IMPORTANT: Keep these credentials secure!');
console.log('   Never commit them to git or share them publicly.');

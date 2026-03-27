#!/usr/bin/env node

// Simple startup script for production
console.log('🚀 Starting Elemenopee Backend...');
console.log('📦 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || '5000');

// Import and start the server
import('./dist/server.js').catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

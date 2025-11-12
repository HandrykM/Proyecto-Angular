// frontend/server.js
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist/frontend/browser')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Handle all routes - must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/frontend/browser/index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('🚀 Frontend server running on port', port);
  console.log('📁 Serving files from:', path.join(__dirname, 'dist/frontend/browser'));
});
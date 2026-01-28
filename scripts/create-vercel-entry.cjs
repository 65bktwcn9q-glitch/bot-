const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '../apps/web/dist');
if (!fs.existsSync(distDir)) {
  process.exit(0);
}

const entryPath = path.join(distDir, 'index.js');
const content = `'use strict';
const fs = require('node:fs');
const path = require('node:path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

module.exports = (req, res) => {
  const rawUrl = req.url || '/';
  const urlPath = rawUrl === '/' ? '/index.html' : rawUrl.split('?')[0];
  const safePath = path.normalize(urlPath).replace(/^\\.(\\.|$)/, '');
  const filePath = path.join(__dirname, safePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const fallback = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(fallback);
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeTypes['.html']);
    res.end(html);
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const body = fs.readFileSync(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.end(body);
};
`;

fs.writeFileSync(entryPath, content);

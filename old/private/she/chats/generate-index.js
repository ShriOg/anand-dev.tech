/**
 * Auto-generate index.json for chat folders
 * Run: node generate-index.js
 * Watch mode: node generate-index.js --watch
 */

const fs = require('fs');
const path = require('path');

const CHATS_DIR = __dirname;
const WHATSAPP_DIR = path.join(CHATS_DIR, 'Whatsapp');
const INSTA_DIR = path.join(CHATS_DIR, 'insta');

function generateWhatsAppIndex() {
  const indexPath = path.join(WHATSAPP_DIR, 'index.json');
  
  if (!fs.existsSync(WHATSAPP_DIR)) {
    console.log('[WhatsApp] Directory not found, creating...');
    fs.mkdirSync(WHATSAPP_DIR, { recursive: true });
  }
  
  const files = fs.readdirSync(WHATSAPP_DIR)
    .filter(f => f.endsWith('.txt') && f !== 'index.json');
  
  fs.writeFileSync(indexPath, JSON.stringify(files, null, 2));
  console.log(`[WhatsApp] Index updated: ${files.length} chats`);
  files.forEach(f => console.log(`  - ${f}`));
}

function generateInstagramIndex() {
  const indexPath = path.join(INSTA_DIR, 'index.json');
  
  if (!fs.existsSync(INSTA_DIR)) {
    console.log('[Instagram] Directory not found, creating...');
    fs.mkdirSync(INSTA_DIR, { recursive: true });
  }
  
  const folders = fs.readdirSync(INSTA_DIR)
    .filter(f => {
      const fullPath = path.join(INSTA_DIR, f);
      // Check if it's a folder containing message_1.html
      return fs.statSync(fullPath).isDirectory() && 
             fs.existsSync(path.join(fullPath, 'message_1.html'));
    });
  
  fs.writeFileSync(indexPath, JSON.stringify(folders, null, 2));
  console.log(`[Instagram] Index updated: ${folders.length} chats`);
  folders.forEach(f => console.log(`  - ${f}`));
}

function generateAll() {
  console.log('\n═══════════════════════════════════════');
  console.log('  Chat Index Generator');
  console.log('═══════════════════════════════════════\n');
  
  generateWhatsAppIndex();
  console.log('');
  generateInstagramIndex();
  
  console.log('\n✅ Done!\n');
}

// Run once
generateAll();

// Watch mode
if (process.argv.includes('--watch')) {
  console.log('👀 Watching for changes...\n');
  
  // Watch WhatsApp folder
  if (fs.existsSync(WHATSAPP_DIR)) {
    fs.watch(WHATSAPP_DIR, { persistent: true }, (eventType, filename) => {
      if (filename && filename !== 'index.json') {
        console.log(`[WhatsApp] Change detected: ${filename}`);
        generateWhatsAppIndex();
      }
    });
  }
  
  // Watch Instagram folder
  if (fs.existsSync(INSTA_DIR)) {
    fs.watch(INSTA_DIR, { persistent: true }, (eventType, filename) => {
      if (filename && filename !== 'index.json') {
        console.log(`[Instagram] Change detected: ${filename}`);
        generateInstagramIndex();
      }
    });
  }
}

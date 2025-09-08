#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('📁 Copying examples to dist folder...');

// Create examples directory in dist
const distExamplesDir = path.join(projectRoot, 'dist', 'examples');
if (!fs.existsSync(distExamplesDir)) {
  fs.mkdirSync(distExamplesDir, { recursive: true });
}

// Copy all HTML files from examples folder
const examplesDir = path.join(projectRoot, 'examples');
const exampleFiles = fs.readdirSync(examplesDir).filter(file => file.endsWith('.html'));

exampleFiles.forEach(file => {
  const sourcePath = path.join(examplesDir, file);
  const destPath = path.join(distExamplesDir, file);
  
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Copied ${file}`);
});

// Copy admin folder if exists
const adminDir = path.join(projectRoot, 'src', 'admin');
if (fs.existsSync(adminDir)) {
  const distAdminDir = path.join(projectRoot, 'dist', 'admin');
  if (!fs.existsSync(distAdminDir)) {
    fs.mkdirSync(distAdminDir, { recursive: true });
  }
  
  const adminFiles = fs.readdirSync(adminDir).filter(file => file.endsWith('.html'));
  adminFiles.forEach(file => {
    const sourcePath = path.join(adminDir, file);
    const destPath = path.join(distAdminDir, file);
    
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied admin/${file}`);
  });
}

// Copy assets if they exist
if (fs.existsSync('./src/assets')) {
  console.log('📁 Copying assets to dist folder...');
  
  // Create assets directory in dist
  if (!fs.existsSync('./dist/assets')) {
    fs.mkdirSync('./dist/assets', { recursive: true });
  }
  
  // Copy all files from src/assets to dist/assets
  const assetFiles = fs.readdirSync('./src/assets');
  assetFiles.forEach(file => {
    const srcPath = path.join('./src/assets', file);
    const destPath = path.join('./dist/assets', file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file}`);
    }
  });
  
  console.log('🎉 Assets copied successfully!');
}

console.log('🎉 Examples copied successfully!');

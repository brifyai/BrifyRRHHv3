import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * This script scans all .js files under ./src and appends ".js" to any relative import
 * that is missing an extension. It avoids third-party imports and leaves known asset extensions intact.
 *
 * Example fixes:
 *  - import x from '../lib/supabase'         -> import x from '../lib/supabase.js'
 *  - import y from '../../lib/hybridGoogleDrive' -> import y from '../../lib/hybridGoogleDrive.js'
 *  - import z from '../services/foo'         -> import z from '../services/foo.js'
 *
 * It will NOT touch:
 *  - package imports: import x from 'react'
 *  - already extended imports: import x from '../lib/supabase.js'
 *  - asset/style/json imports: .css .json .svg .png .jpg .jpeg .gif .webp .ico
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'src');

// Known extensions we should not modify
const SAFE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.json', '.css', '.scss', '.sass',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tiff', '.avif', '.webm', '.mp4'
];

// Regex to match both forms:
//  1) import something from '../relative/path'
//  2) import '../relative/path'
const IMPORT_REGEX = /(^\s*import\s+(?:[^'"]*?\s+from\s+)?)(['"])(\.{1,2}\/[^'"]+)\2/gm;

let filesProcessed = 0;
let filesModified = 0;
let replacements = 0;

function needsExtension(specifier) {
  // If the specifier already ends with a safe extension, no change.
  return !SAFE_EXTENSIONS.some(ext => specifier.endsWith(ext));
}

function fixImportsInContent(content) {
  let modified = false;

  const newContent = content.replace(IMPORT_REGEX, (full, preamble, quote, specifier) => {
    // Skip if specifier already contains a safe extension
    if (!needsExtension(specifier)) {
      return full; // no change
    }

    // Only act on relative imports (regex already ensures this)
    // Append ".js" by default
    const fixedSpecifier = `${specifier}.js`;

    modified = true;
    replacements += 1;

    // Reconstruct preserving original quote
    return `${preamble}${quote}${fixedSpecifier}${quote}`;
  });

  return { modified, newContent };
}

function processFile(filePath) {
  if (!filePath.endsWith('.js')) return;

  try {
    const original = fs.readFileSync(filePath, 'utf8');
    const { modified, newContent } = fixImportsInContent(original);

    filesProcessed += 1;

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      filesModified += 1;
      console.log(`✅ Fixed imports: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error reading/writing ${filePath}: ${err.message}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      processFile(full);
    }
  }
}

console.log('🔧 Scanning and fixing relative imports missing ".js" under ./src ...');
walk(SRC_DIR);
console.log(`\n📊 Summary:
- Files processed: ${filesProcessed}
- Files modified:  ${filesModified}
- Imports fixed:   ${replacements}
`);
console.log('✅ Done.');
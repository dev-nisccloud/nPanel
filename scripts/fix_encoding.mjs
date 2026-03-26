import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const replacements = [
  { corrupted: 'ÃƒÂ°Ã…Â¸“Ã¢â‚¬Å¾', original: '📄' },
  { corrupted: 'ÃƒÂ°Ã…Â¸“Ã‚Â ', original: '📁' },
  { corrupted: 'ÃƒÂ°Ã…Â¸“', original: '📂' },
  { corrupted: 'ÃƒÂ¢Ã¢â€šÂ¬”', original: '—' },
  { corrupted: 'ÃƒÂ¢Ã¢â€šÂ¬“', original: '–' },
  { corrupted: 'ÃƒÂ¢” ’', original: '→' },
  { corrupted: 'Ã¢â€ â€™', original: '→' },
  { corrupted: 'Ã¢â‚¬Â¢', original: '•' },
  { corrupted: 'Ã¢â‚¬Â¦', original: '…' },
  { corrupted: 'Ã¢â‚¬â€œ', original: '–' },
  { corrupted: 'Ã¢â‚¬â€', original: '—' },
  { corrupted: 'Ã¢â‚¬Å“', original: '“' },
  { corrupted: 'Ã¢â‚¬Â ', original: '” ' },
  { corrupted: 'Ã¢â‚¬Â', original: '”' },
  { corrupted: 'Ã¢â‚¬Ëœ', original: '‘' },
  { corrupted: 'Ã¢â‚¬â„¢', original: '’' },
  { corrupted: 'Ã‚Â', original: ' ' },
  { corrupted: 'ÃƒÂ©', original: 'é' },
  { corrupted: 'ÃƒÂ ', original: 'à' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (['node_modules', '.git', '.turbo', 'dist', 'build'].includes(file)) continue;
      walk(fullPath);
    } else {
      const ext = path.extname(file);
      if (['.tsx', '.ts', '.js', '.mjs', '.json', '.css', '.md', '.html'].includes(ext)) {
        processFile(fullPath);
      }
    }
  }
}

function processFile(filePath) {
  if (filePath.endsWith('fix_encoding.mjs')) return; // Don't fix self
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;

    for (const { corrupted, original } of replacements) {
      if (newContent.includes(corrupted)) {
        newContent = newContent.split(corrupted).join(original);
        modified = true;
      }
    }

    if (modified) {
      console.log(`Fixed: ${filePath}`);
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

console.log('Starting encoding fix...');
walk(rootDir);
console.log('Finished.');

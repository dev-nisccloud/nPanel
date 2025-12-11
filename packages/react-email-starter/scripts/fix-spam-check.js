#!/usr/bin/env node

/**
 * Script to fix spam check timeout issues in react-email preview server
 * This script patches the generated .react-email/src/app/preview/[...slug]/page.tsx
 * to handle spam check failures gracefully during build
 */

const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', '.react-email', 'src', 'app', 'preview', '[...slug]', 'page.tsx');

if (!fs.existsSync(pagePath)) {
  console.warn('⚠️  .react-email directory not found. Skipping spam check fix.');
  process.exit(0);
}

let content = fs.readFileSync(pagePath, 'utf8');

// Check if already patched
if (content.includes('// Spam check with timeout and error handling')) {
  console.log('✅ Spam check fix already applied.');
  process.exit(0);
}

const newSpamCheck = `    // Spam check with timeout and error handling for CI/build environments
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://react.email/api/check-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: serverEmailRenderingResult.prettyMarkup,
          plainText: serverEmailRenderingResult.plainText,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const responseBody = (await response.json()) as
        | { error: string }
        | SpamCheckingResult;
      if ('error' in responseBody) {
        console.warn(\`Spam check failed: \${responseBody.error}. Continuing without spam check results.\`);
        spamCheckingResult = undefined;
      } else {
        spamCheckingResult = responseBody;
      }
    } catch (error) {
      // Gracefully handle spam check failures (timeouts, network errors, etc.)
      // This is common in CI/build environments where the spam check service may be unavailable
      console.warn('Spam check unavailable or timed out. Continuing build without spam check results.', error);
      spamCheckingResult = undefined;
    }`;

// Try to find and replace the spam check code
let replaced = false;

// Pattern 1: Look for the exact pattern with throw error
if (content.includes("throw new Error(`Failed doing Spam Check")) {
  const pattern = /(\s+)(const response = await fetch\('https:\/\/react\.email\/api\/check-spam'[\s\S]*?throw new Error\(`Failed doing Spam Check[\s\S]*?spamCheckingResult = responseBody;)/;
  const match = content.match(pattern);
  if (match) {
    const indent = match[1] || '    ';
    const oldCode = match[2];
    const newCode = newSpamCheck.replace(/^    /gm, indent);
    content = content.replace(oldCode, newCode);
    replaced = true;
  }
}

// Pattern 2: More flexible - find the fetch call and the assignment
if (!replaced && content.includes("react.email/api/check-spam")) {
  // Find the section between the compatibility check and the closing brace
  const sectionPattern = /(compatibilityCheckingResults\.push\(result\);\s*\}\s*)(const response = await fetch[\s\S]*?spamCheckingResult = responseBody;\s*)(\})/;
  const sectionMatch = content.match(sectionPattern);
  if (sectionMatch) {
    const indent = '    ';
    const oldCode = sectionMatch[2];
    const newCode = newSpamCheck.replace(/^    /gm, indent);
    content = content.replace(oldCode, newCode);
    replaced = true;
  }
}

if (replaced) {
  fs.writeFileSync(pagePath, content, 'utf8');
  console.log('✅ Successfully applied spam check fix.');
} else {
  console.warn('⚠️  Could not find spam check code to patch. The file may have changed.');
  console.warn('   This is not critical - the build may still work, but spam checks may timeout.');
  // Don't exit with error - allow build to continue
  process.exit(0);
}

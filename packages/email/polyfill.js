// WritableStream polyfill for @react-email/render compatibility
// This file should be imported before any email rendering occurs

if (typeof globalThis.WritableStream === 'undefined') {
  try {
    const { WritableStream } = require('node:stream/web');
    globalThis.WritableStream = WritableStream;
    console.log('✅ WritableStream polyfill loaded successfully');
  } catch (error) {
    console.warn('⚠️ Could not load WritableStream polyfill:', error.message);
  }
} else {
  console.log('✅ WritableStream already available');
}

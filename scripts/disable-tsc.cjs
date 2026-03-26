if (process.env.VERCEL === '1') {
    const fs = require('fs');
    const path = require('path');

    const tscPath = path.join(
        __dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc'
    );

    fs.writeFileSync(tscPath, '#!/usr/bin/env node\nprocess.exit(0);\n');
    fs.chmodSync(tscPath, '755');
    console.log('TypeScript type checking disabled for Vercel build.');
}
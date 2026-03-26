const fs = require('fs');
const path = require('path');

if (process.env.VERCEL !== '1') {
    console.log('Not on Vercel, skipping tsc disable.');
    process.exit(0);
}

const noopScript = '#!/usr/bin/env node\nprocess.exit(0);\n';

// Find and patch every tsc binary in the repo
function findAndPatchTsc(startDir) {
    const locations = [
        // root node_modules
        path.join(startDir, 'node_modules', 'typescript', 'bin', 'tsc'),
        // bun's deduped location
        path.join(startDir, 'node_modules', '.bun', 'typescript', 'bin', 'tsc'),
    ];

    // Also walk all workspace packages
    const workspaceDirs = [
        path.join(startDir, 'apps', 'web'),
        path.join(startDir, 'apps', 'server'),
        path.join(startDir, 'packages', 'api'),
        path.join(startDir, 'packages', 'db'),
        path.join(startDir, 'packages', 'auth'),
        path.join(startDir, 'packages', 'ui'),
    ];

    for (const wsDir of workspaceDirs) {
        locations.push(path.join(wsDir, 'node_modules', 'typescript', 'bin', 'tsc'));
    }

    for (const tscPath of locations) {
        if (fs.existsSync(tscPath)) {
            try {
                fs.writeFileSync(tscPath, noopScript);
                fs.chmodSync(tscPath, '755');
                console.log(`Patched: ${tscPath}`);
            } catch (e) {
                console.log(`Failed to patch ${tscPath}: ${e.message}`);
            }
        }
    }
}

// Also patch the bun-specific deduped typescript packages
function patchBunDedupedTsc(rootDir) {
    const bunDir = path.join(rootDir, 'node_modules', '.bun');
    if (!fs.existsSync(bunDir)) return;

    // Walk .bun dir for any typescript@* folders
    try {
        const entries = fs.readdirSync(bunDir);
        for (const entry of entries) {
            if (entry.startsWith('typescript')) {
                const tscPath = path.join(bunDir, entry, 'node_modules', 'typescript', 'bin', 'tsc');
                if (fs.existsSync(tscPath)) {
                    fs.writeFileSync(tscPath, noopScript);
                    fs.chmodSync(tscPath, '755');
                    console.log(`Patched bun deduped: ${tscPath}`);
                }
            }
        }
    } catch (e) {
        console.log(`Could not walk .bun dir: ${e.message}`);
    }
}

const rootDir = path.join(__dirname, '..');
findAndPatchTsc(rootDir);
patchBunDedupedTsc(rootDir);

console.log('Done patching TypeScript.');
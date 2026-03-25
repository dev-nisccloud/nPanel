import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const routesDir = 'c:/Users/somuo/Desktop/Projects/nPanel/apps/web/src/routes';

walk(routesDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace @/routes/agency.something.something.types etc
    const newContent = content.replace(/@\/routes\/agency\.([a-z-./$!]+)/g, (match, p1) => {
        // p1 is something.something.types
        // Replace all dots with slashes
        const fixed = p1.replace(/\./g, '/');
        if (fixed !== p1) {
            changed = true;
            return `@/routes/agency/${fixed}`;
        }
        return match;
    });

    if (changed) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed: ${filePath}`);
    }
});

import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const routesDir = 'c:/Users/somuo/Desktop/Projects/nPanel/apps/web/src/routes';

// List of top-level agency modules that are directories
const agencyModules = [
    'ad-campaigns',
    'agency-roles',
    'clients',
    'coming-soon',
    'creative-assets',
    'creative-briefs',
    'crm',
    'dashboard',
    'domain-transfer',
    'domains',
    'domains-portfolio',
    'email-marketing',
    'finance',
    'gen-ai',
    'google-ads',
    'hosting',
    'invoices',
    'invoicing',
    'kra-etims',
    'manage-teams',
    'manage-users',
    'my-account',
    'nisc-service-orders',
    'nisc-services',
    'orders',
    'quotations',
    'reports',
    'seo-reports',
    'service-plans',
    'social-media-marketing',
    'subscriptions',
    'teams',
    'tlds',
    'transactions',
    'wordpress'
];

walk(routesDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Pattern to catch the incorrect @/routes/agency/module/
    const newContent = content.replace(/@\/routes\/agency\/([a-z-]+)\//g, (match, moduleName) => {
        if (agencyModules.includes(moduleName)) {
            changed = true;
            return `@/routes/agency.${moduleName}/`;
        }
        return match;
    });

    if (changed) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Corrected: ${filePath}`);
    }
});

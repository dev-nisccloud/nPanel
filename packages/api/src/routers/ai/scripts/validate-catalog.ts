#!/usr/bin/env tsx

/**
 * Validation script for AI Function Catalog
 * 
 * This script validates that:
 * 1. The catalog JSON file is valid and well-formed
 * 2. All function IDs follow the correct format
 * 3. All required fields are present
 * 4. No duplicate function IDs exist
 * 5. Access levels and types are valid
 */

import { loadFunctionCatalog, validateCatalog, getCatalogStats } from '../catalog-parser';
import { getCachedCatalog } from '../catalog-parser';

function main() {
    console.log('🔍 AI Function Catalog Validation\n');
    console.log('='.repeat(50));
    console.log('');

    try {
        // Load catalog
        console.log('📂 Loading catalog...');
        const catalog = loadFunctionCatalog();
        console.log(`✅ Catalog loaded successfully (v${catalog.version})`);
        console.log(`   Last updated: ${catalog.lastUpdated}`);
        console.log('');

        // Validate catalog
        console.log('🔎 Validating catalog structure...');
        const validation = validateCatalog(catalog);

        if (validation.valid) {
            console.log('✅ Catalog is valid!');
        } else {
            console.log('❌ Catalog has validation errors:');
            for (const error of validation.errors) {
                console.log(`   - ${error.functionId ? `[${error.functionId}] ` : ''}${error.message}`);
            }
        }
        console.log('');

        // Show warnings
        if (validation.warnings.length > 0) {
            console.log('⚠️  Warnings:');
            for (const warning of validation.warnings) {
                console.log(`   - ${warning.functionId ? `[${warning.functionId}] ` : ''}${warning.message}`);
            }
            console.log('');
        }

        // Show statistics
        console.log('📊 Catalog Statistics:');
        const stats = getCatalogStats(catalog);
        console.log(`   Total functions: ${stats.totalFunctions}`);
        console.log('');

        console.log('   By Category:');
        for (const [category, count] of Object.entries(stats.byCategory)) {
            console.log(`     - ${category}: ${count}`);
        }
        console.log('');

        console.log('   By Access Level:');
        for (const [access, count] of Object.entries(stats.byAccess)) {
            console.log(`     - ${access}: ${count}`);
        }
        console.log('');

        console.log('   By Type:');
        for (const [type, count] of Object.entries(stats.byType)) {
            console.log(`     - ${type}: ${count}`);
        }
        console.log('');

        // Test indexing
        console.log('🗂️  Testing catalog indexing...');
        const indexed = getCachedCatalog();
        console.log(`✅ Indexed ${indexed.byId.size} functions`);
        console.log(`   ${indexed.byCategory.size} categories`);
        console.log(`   ${indexed.byAccess.size} access levels`);
        console.log('');

        // Summary
        console.log('='.repeat(50));
        if (validation.valid) {
            console.log('✅ Validation passed!');
            process.exit(0);
        } else {
            console.log('❌ Validation failed!');
            console.log(`   ${validation.errors.length} error(s) found`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Fatal error during validation:');
        console.error(error);
        process.exit(1);
    }
}

main();

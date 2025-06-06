#!/usr/bin/env bun

import { $ } from 'bun';

console.log('🚀 Migrating database schema for Better Auth...');

try {
    // Run drizzle-kit push with automatic yes to truncation
    const result = await $`echo "Yes, I want to truncate 2 tables" | bunx drizzle-kit push --force`.quiet();
    
    if (result.exitCode === 0) {
        console.log('✅ Database schema migrated successfully!');
        console.log('⚠️  Note: User and session tables were truncated. You\'ll need to create new accounts.');
    } else {
        console.error('❌ Migration failed:', result.stderr.toString());
    }
} catch (error) {
    console.error('❌ Migration error:', error);
}

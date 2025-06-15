#!/usr/bin/env bun

/**
 * 📚 MURDEROUS HACK API DOCS
 *
 * ███╗   ███╗██╗   ██╗██████╗ ██████╗ ███████╗██████╗  ██████╗ ██╗   ██╗███████╗
 * ████╗ ████║██║   ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔═══██╗██║   ██║██╔════╝
 * ██╔████╔██║██║   ██║██████╔╝██║  ██║█████╗  ██████╔╝██║   ██║██║   ██║███████╗
 * ██║╚██╔╝██║██║   ██║██╔══██╗██║  ██║██╔══╝  ██╔══██╗██║   ██║██║   ██║╚════██║
 * ██║ ╚═╝ ██║╚██████╔╝██║  ██║██████╔╝███████╗██║  ██║╚██████╔╝╚██████╔╝███████║
 * ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝
 *
 *                              ██╗  ██╗ █████╗  ██████╗██╗  ██╗
 *                              ██║  ██║██╔══██╗██╔════╝██║ ██╔╝
 *                              ███████║███████║██║     █████╔╝
 *                              ██╔══██║██╔══██║██║     ██╔═██╗
 *                              ██║  ██║██║  ██║╚██████╗██║  ██╗
 *                              ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 *
 * Quick access to API documentation
 */
import { $ } from 'bun';

const DOCS_URL = 'http://localhost:3000/docs';
const SPEC_URL = 'http://localhost:3000/api-spec.json';

console.log('🚀 Opening Murderous Hack API Documentation...\n');

// Check if server is running
try {
    await fetch('http://localhost:3000/api/user');
    console.log('✅ Server is running');
} catch (error) {
    console.log('❌ Server is not running. Starting development server...');
    console.log('💡 Run: bun run start\n');
    process.exit(1);
}

console.log('📚 API Documentation URLs:');
console.log(`    • Interactive Docs: ${DOCS_URL}`);
console.log(`    • OpenAPI Spec:     ${SPEC_URL}\n`);

// Open documentation in browser
try {
    if (process.platform === 'win32') {
        await $`start ${DOCS_URL}`;
    } else if (process.platform === 'darwin') {
        await $`open ${DOCS_URL}`;
    } else {
        await $`xdg-open ${DOCS_URL}`;
    }
    console.log('🌐 Opened documentation in your default browser');
} catch (error) {
    console.log('⚠️  Could not open browser automatically');
    console.log(`   Please visit: ${DOCS_URL}`);
}

console.log('\n🎯 Features:');
console.log('    • Interactive API playground');
console.log('    • Try endpoints directly in browser');
console.log('    • Authentication support');
console.log('    • Custom Murderous Hack branding');
console.log('    • Export to Postman/Insomnia');

console.log('\n🔧 Development:');
console.log('    • Import OpenAPI spec into your API client');
console.log('    • All endpoints documented with examples');
console.log('    • Response schemas and error codes');
console.log('    • Authentication flow explained');

console.log('\n✨ Happy hacking! ✨');

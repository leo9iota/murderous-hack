/** @type {import('prettier').Config} */
export default {
    tabWidth: 4,
    printWidth: 100,
    singleQuote: true,
    jsxSingleQuote: true,
    overrides: [
        {
            files: '*.js',
            options: {
                tabWidth: 4,
            },
        },
        {
            files: '*.ts',
            options: {
                tabWidth: 4,
            },
        },
        {
            files: '*.jsx',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.tsx',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.yml',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.yaml',
            options: {
                tabWidth: 2,
            },
        },
    ],
    importOrder: [
        '^(react/(.*)$)|^(react$)',
        '^(hono/(.*)$)|^(hono$)',
        '^(drizzle-orm/(.*)$)|^(drizzle-orm$)',
        '^(@tanstack/react-router/(.*)$)|^(@tanstack/react-router$)',
        '^(@tanstack/(.*)$)|^(@tanstack$)',
        '',
        '<THIRD_PARTY_MODULES>',
        '',
        '^types$',
        '^@/shared/(.*)$',
        '^@/lib/(.*)$',
        '^@/hooks/(.*)$',
        '^@/components/ui/(.*)$',
        '^@/components/(.*)$',
        '^[./]',
    ],
    importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
    plugins: ['@ianvs/prettier-plugin-sort-imports'],
};

const js = require('@eslint/js');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'pkg/**',
            'extensions/chrome/dist/**',
            'coverage/**',
            '.deps/**'
        ]
    },
    {
        files: ['**/*.js', '**/*.mjs', 'tools/serve'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                browser: 'readonly',
                document: 'readonly',
                global: 'readonly',
                Node: 'readonly',
                XPathResult: 'readonly',
                window: 'readonly'
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'off',
            'no-debugger': 'off',
            'no-undef': 'off',
            'no-unused-vars': 'off'
        }
    },
    {
        files: ['extensions/chrome/**/*.js', 'extensions/chrome/**/*.mjs'],
        languageOptions: {
            sourceType: 'module'
        }
    }
];

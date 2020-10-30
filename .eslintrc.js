module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es2021: true
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    extends: ['eslint:recommended', 'prettier'],
    rules: {
        indent: ['error', 4],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'off'
    },
    overrides: [
        {
            files: ['**/*.ts'],
            parser: '@typescript-eslint/parser',
            plugins: ['@typescript-eslint'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'prettier'
            ],
            rules: {
                '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off'
            }
        }
    ]
};

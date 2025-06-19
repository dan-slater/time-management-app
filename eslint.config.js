module.exports = [
    {
        ignores: [
            'node_modules/**',
            'data/**',
            '*.json',
            '*.md',
            'Dockerfile',
            'deploy.sh',
            'nginx.conf',
            'coverage/**',
            'test-data/**'
        ]
    },
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                // Browser globals for client-side files
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                alert: 'readonly',
                taskManager: 'readonly',
                // Test globals
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly'
            }
        },
        rules: {
            'indent': ['error', 4],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'no-unused-vars': ['warn'],
            'no-console': 'off',
            'no-undef': 'error',
            'no-trailing-spaces': 'error',
            'eol-last': 'error'
        }
    }
];

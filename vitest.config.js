const path = require('node:path');

const {defineConfig} = require('vitest/config');

module.exports = defineConfig({
    resolve: {
        alias: {
            'assertive-chai': path.resolve(__dirname, 'test/assertive-chai.js')
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/setup.js'],
        include: ['test/spec/**/*_spec.js'],
        pool: 'threads',
        maxWorkers: 1,
        testTimeout: 10000
    }
});

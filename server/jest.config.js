export default {
  transform: {},
  testEnvironment: 'node',
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'services/**/*.js',
    '!scripts/**',
    '!**/*.test.js',
  ],
  coverageReporters: ['text', 'lcov'],
};
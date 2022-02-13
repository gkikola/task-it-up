module.exports = {
  env: {
    browser: true,
  },
  extends: [
    'airbnb-base',
    'plugin:compat/recommended'
  ],
  globals: {
    PACKAGE_VERSION: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
  },
  settings: {
    polyfills: [
      'Number.isFinite',
      'Object.assign',
      'URL',
    ],
  },
};

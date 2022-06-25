module.exports = {
  env: {
    browser: true,
  },
  extends: [
    'airbnb-base',
    'plugin:compat/recommended',
  ],
  globals: {
    PACKAGE_NAME: 'readonly',
    PACKAGE_VERSION: 'readonly',
    PACKAGE_AUTHOR: 'readonly',
    PACKAGE_AUTHOR_NAME: 'readonly',
    PACKAGE_AUTHOR_EMAIL: 'readonly',
    PACKAGE_AUTHOR_WEBSITE: 'readonly',
    PACKAGE_LICENSE: 'readonly',
    PACKAGE_HOMEPAGE: 'readonly',
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

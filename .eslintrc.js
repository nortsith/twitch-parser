module.exports = {
  parser: 'babel-eslint',
  plugins: ['prettier'],
  extends: ['svtek', 'prettier', 'prettier/flowtype'],
  rules: {
    'prettier/prettier': 'error',
    'flowtype/require-valid-file-annotation': [
      2,
      'never',
      {
        annotationStyle: 'line',
      },
    ],
    'no-console': 0,
  },
  overrides: [
    {
      files: ['src/**/*.test.js'],
      env: {
        jest: true,
      },
      globals: {
        fetch: false,
      },
    },
  ],
};

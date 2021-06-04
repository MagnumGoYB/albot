module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: ['standard'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'space-before-function-paren': ['error', { named: 'never' }],
    'generator-star-spacing': ['error', { before: false, after: true }]
  }
}

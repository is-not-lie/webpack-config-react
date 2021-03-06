module.exports = {
  parser:  '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    "ecmaVersion": 2019,
    "sourceType": 'module',
  },
  plugins: ['@typescript-eslint'],
  env:{
    browser: true,
    node: true,
  }
}

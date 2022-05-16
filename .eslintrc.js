module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    './.eslintrc-auto-import.json',
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'no-undef': 'warn',
    'import/no-absolute-path': 'off',
    'space-before-function-paren': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/max-attributes-per-line': ['warn', {
      singleline: 4,
      multiline: 1
    }]
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}

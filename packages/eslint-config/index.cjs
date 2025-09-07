module.exports = {
root: false,
env: { es2022: true, node: true, browser: true },
parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
plugins: ['import', 'simple-import-sort'],
extends: [
'eslint:recommended',
'plugin:import/recommended',
'plugin:import/typescript',
'prettier'
],
rules: {
'import/order': 'off',
'simple-import-sort/imports': 'warn',
'simple-import-sort/exports': 'warn',
'import/newline-after-import': 'warn'
}
}

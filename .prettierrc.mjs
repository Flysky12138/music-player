/** @type {import("prettier").Options} */
export default {
  arrowParens: 'avoid',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 150,
  semi: false,
  singleQuote: true,
  tailwindFunctions: ['cn', 'cva'],
  tailwindAttributes: ['class', 'className', '\\w+ClassName'],
  tailwindStylesheet: './src/globals.css',
  trailingComma: 'none',
  useTabs: false
}

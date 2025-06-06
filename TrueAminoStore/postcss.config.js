const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace',
    },
    ...(isProduction
      ? {
          '@fullhuman/postcss-purgecss': {
            content: [
              './client/src/**/*.{js,jsx,ts,tsx}',
              './client/index.html',
            ],
            defaultExtractor: content =>
              content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: {
              standard: ['html', 'body', /^bg-/, /^text-/, /^border-/, /^shadow-/],
              deep: [/dark$/, /dark:/],
              greedy: [/modal/, /dialog/, /tooltip/, /dropdown/, /menu/],
            },
          },
          'postcss-preset-env': {
            stage: 3,
            features: {
              'nesting-rules': true,
              'custom-properties': false,
              'color-mod-function': { unresolved: 'warn' },
            },
            autoprefixer: { grid: true },
            browsers: ['>0.2%', 'not dead', 'not op_mini all', 'last 2 versions'],
          },
          cssnano: {
            preset: [
              'advanced',
              {
                discardComments: { removeAll: true },
                reduceIdents: false,
                zindex: false,
                mergeIdents: false,
                discardUnused: false,
              },
            ],
          },
        }
      : {}),
  },
};

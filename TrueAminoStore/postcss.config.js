export default {
  plugins: {
    // TailwindCSS with optimizations
    tailwindcss: {},
    
    // Generate vendor prefixes automatically
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace'
    },
    
    // Additional optimization plugins for production
    ...(process.env.NODE_ENV === 'production' ? {
      // Remove unused CSS
      '@fullhuman/postcss-purgecss': {
        content: [
          './client/src/**/*.{js,jsx,ts,tsx}',
          './client/index.html',
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        safelist: {
          standard: ['html', 'body', /^bg-/, /^text-/, /^border-/, /^shadow-/],
          deep: [/dark$/, /dark:/],
          greedy: [/modal/, /dialog/, /tooltip/, /dropdown/, /menu/]
        }
      },
      
      // Minify CSS properties
      'postcss-preset-env': { 
        stage: 3,
        features: { 
          'nesting-rules': true,
          'custom-properties': false,
          'color-mod-function': { unresolved: 'warn' },
        },
        autoprefixer: { grid: true },
        browsers: [
          '>0.2%',
          'not dead',
          'not op_mini all',
          'last 2 versions'
        ]
      },
      
      // Optimize and minify
      cssnano: {
        preset: ['advanced', {
          discardComments: { removeAll: true },
          reduceIdents: false,
          zindex: false,
          mergeIdents: false,
          discardUnused: false,
        }]
      }
    } : {})
  },
}

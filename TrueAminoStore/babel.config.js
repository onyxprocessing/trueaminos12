/**
 * Babel configuration for TrueAminoStore
 * Optimized for modern browsers with aggressive production optimizations
 */

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          '>0.2%',
          'not dead',
          'not op_mini all',
          'last 2 versions',
          'chrome >= 80',
          'firefox >= 78',
          'safari >= 13',
          'edge >= 88',
          'ios >= 13'
        ]
      },
      useBuiltIns: 'usage',
      corejs: 3,
      bugfixes: true,
      loose: true,
    }],
    ['@babel/preset-react', {
      runtime: 'automatic',
      development: process.env.NODE_ENV !== 'production',
    }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Production-only optimizations
    ...(process.env.NODE_ENV === 'production' ? [
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
      '@babel/plugin-transform-react-constant-elements',
      '@babel/plugin-transform-react-inline-elements',
      'babel-plugin-transform-react-remove-prop-types',
      ['babel-plugin-transform-imports', {
        'lodash': {
          transform: 'lodash/${member}',
          preventFullImport: true
        },
        'react-bootstrap': {
          transform: 'react-bootstrap/lib/${member}',
          preventFullImport: true
        }
      }]
    ] : []),
    
    // Always applied optimizations
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
};
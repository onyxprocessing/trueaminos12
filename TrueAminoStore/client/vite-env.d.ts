/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string
  readonly VITE_DISABLE_HMR: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Disable HMR in production builds
declare const __VITE_IS_PRODUCTION__: boolean;
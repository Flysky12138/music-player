import { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'
const internalHost = process.env.TAURI_DEV_HOST ?? 'localhost'

export default {
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  output: 'export',
  reactCompiler: true,
  images: {
    unoptimized: true
  },
  turbopack: {
    rules: {
      '*.css': {
        as: '*.css',
        loaders: ['@tailwindcss/turbopack']
      }
    }
  }
} satisfies NextConfig

import nextVitals from 'eslint-config-next/core-web-vitals'
import { defineConfig, globalIgnores } from 'eslint/config'

import { reactConfig } from './eslint/react'

export default defineConfig([
  globalIgnores(['public/', '.next/**', 'build/**', 'next-env.d.ts', 'src-tauri/**', 'src/components/ui/**', 'src/hooks/use-mobile.ts']),

  reactConfig,
  nextVitals,

  // https://eslint.org.cn/docs/latest/rules
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // 当通过 import 加载时，禁用指定的模块
      'no-restricted-imports': [
        'error',
        {
          paths: ['next/router'],
          patterns: [
            {
              allowImportNamePattern: '^(.*Icon|LucideProps)$',
              group: ['lucide-react']
            }
          ]
        }
      ]
    }
  },

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/require-await': 'off'
    }
  }
])

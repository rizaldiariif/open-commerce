import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.convex/**',
      '.output/**',
      '.tanstack/**',
      '.vercel/**',
      '.vinxi/**',
      'convex/_generated/**',
      'dist/**',
      'node_modules/**',
      'src/routeTree.gen.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
)

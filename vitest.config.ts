import { defineConfig } from 'vitest/config'
import path from 'path'

// Unit tests target pure logic only (src/lib/**) — no React/DOM environment,
// no Supabase mocking. See TECHNICAL_REQUIREMENTS.md for what this suite
// covers and what it deliberately doesn't.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

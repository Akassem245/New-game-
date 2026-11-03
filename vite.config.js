import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves this repository under /New-game-/
  base: process.env.GITHUB_ACTIONS ? '/New-game-/' : '/',
  server: {
    host: true,
    port: 5173
  }
});

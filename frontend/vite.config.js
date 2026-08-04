import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // use relative paths so the site works when served from GitHub Pages
  plugins: [react()],
});

// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server', 
  adapter: node({
    mode: 'standalone' 
  }),
  server: {
    host: true,
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api": "https://apiweeurl.onrender.com/",
      },
    },
  },
});

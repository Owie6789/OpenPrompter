import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-dom") || id.includes("react/jsx") || id.includes("scheduler")) {
                return "vendor-react";
              }
              if (id.includes("motion") || id.includes("framer-motion")) {
                return "vendor-motion";
              }
              if (id.includes("hugeicons")) {
                return "vendor-icons";
              }
              if (id.includes("@radix-ui")) {
                return "vendor-radix";
              }
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

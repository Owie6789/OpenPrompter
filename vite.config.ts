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
            if (!id.includes("node_modules")) return;
            const n = id.replaceAll("\\", "/");
            if (n.includes("/node_modules/react/") || n.includes("/node_modules/react-dom/") || n.includes("/node_modules/scheduler/") || n.includes("/node_modules/react/jsx")) {
              return "vendor-react";
            }
            if (n.includes("/node_modules/motion/") || n.includes("/node_modules/framer-motion/") || n.includes("/node_modules/motion-dom/")) {
              return "vendor-motion";
            }
            if (n.includes("/node_modules/@hugeicons/")) {
              return "vendor-icons";
            }
            if (n.includes("/node_modules/@radix-ui/")) {
              return "vendor-radix";
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

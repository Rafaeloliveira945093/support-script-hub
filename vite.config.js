import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      // necessário no Replit
      ".replit.dev",
      "localhost",
    ],
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages. Override with VITE_BASE=/ for local preview at root.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/RealEstate-ODI-Demo/',
});

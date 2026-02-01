import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This prevents "process is not defined" error in the browser
      // and injects the API KEY securely during build time.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback for other process.env usage if necessary (usually safe to keep empty object)
      'process.env': {} 
    }
  };
});
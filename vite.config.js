import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env file from the current directory
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "process.env": {
        REACT_APP_SOCKET_URL: env.VITE_SOCKET_URL || "http://localhost:5000",
      },
    },
    server: {
      port: 3000,
    },
  };
});

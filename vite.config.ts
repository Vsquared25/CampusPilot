import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repository from /CampusPilot/.
  // Local Vite development still runs from the root path.
  base: command === "build" ? "/CampusPilot/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "drama-leslie-convert-pray.trycloudflare.com",
    ],
  },
}));

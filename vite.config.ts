import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const supabaseUrl =
    env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.STORAGE_URL || env.STORAGE_SUPABASE_URL || "";
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.STORAGE_ANON_KEY ||
    env.STORAGE_SUPABASE_ANON_KEY ||
    "";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "fenix-hero.png",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-512x512-maskable.png",
        ],
        manifest: {
          name: "Escalação Fenix",
          short_name: "Fenix",
          description: "Monte times de futebol equilibrados com sorteio inteligente.",
          theme_color: "#1c0f13",
          background_color: "#09090c",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          lang: "pt-BR",
          categories: ["sports", "utilities"],
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
          navigateFallback: "/index.html",
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    define: {
      __SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __SUPABASE_ANON_KEY__: JSON.stringify(supabaseAnonKey),
    },
  };
});

import type { MetadataRoute } from "next";

// Permite "Agregar a pantalla de inicio" en iPhone, iPad y Android: abre como app, sin barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CFS · Sistema de gestión",
    short_name: "CFS",
    description: "Sistema de gestión de Central Frutícola Sur",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f5f7f6",
    theme_color: "#06301a",
    lang: "es-CL",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

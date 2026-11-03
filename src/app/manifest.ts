import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes EduMind installable as a standalone app.
 * Served by Next.js at /manifest.webmanifest and linked automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "EduMind — تعلّم أذكى",
    short_name: "EduMind",
    description:
      "حوّل مذكراتك إلى شرح ذكي وملخصات واختبارات وخرائط ذهنية. Your study documents become an AI tutor, summaries, quizzes and mind maps.",
    lang: "ar",
    dir: "rtl",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/favicon/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "المواد",
        short_name: "المواد",
        url: "/dashboard/materials",
        icons: [{ src: "/favicon/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "المدرّس الذكي",
        short_name: "المدرّس",
        url: "/dashboard/tutor",
        icons: [{ src: "/favicon/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "الخطة الدراسية",
        short_name: "الخطة",
        url: "/dashboard/study-plan",
        icons: [{ src: "/favicon/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

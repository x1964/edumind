import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { PwaRegister } from "@/components/pwa/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const title = "EduMind   ";
const description =
  "EduMind turns your study documents into AI tutoring, smart summaries, interactive quizzes, mind maps, and personalized learning experiences. ارفع ملفاتك وافهم كل حاجة بطريقتك.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "EduMind",
  keywords: [
    "EduMind",
    "AI learning",
    "AI tutor",
    "study smarter",
    "smart summaries",
    "AI quizzes",
    "mind maps",
    "تعليم",
    "الذكاء الاصطناعي",
    "ملخصات",
    "اختبارات",
  ],
  authors: [{ name: "EduMind" }],
  creator: "EduMind",
  publisher: "EduMind",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "EduMind",
    title,
    description,
    locale: "ar_EG",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "EduMind",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  viewportFit: "cover",
};

const installPromptBootstrap = `(function(){try{if(!('serviceWorker' in navigator))return;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__edumindInstallPrompt=e;window.dispatchEvent(new Event('edumind:install-available'));});}catch(e){}})();`;

const languageBootstrap = `(function(){try{var m=document.cookie.match(/(?:^|; )${"edumind_lang"}=(en|ar)/);if(!m)return;var l=m[1];document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: languageBootstrap }} />
        <script dangerouslySetInnerHTML={{ __html: installPromptBootstrap }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-dvh flex-col">{children}</div>
        <PwaRegister />
      </body>
    </html>
  );
}

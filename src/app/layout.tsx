import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { PwaLaunchScreen } from "@/components/pwa/pwa-launch-screen";
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
    startupImage: [
      {
        url: "/splash/splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1242x2688.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-1536x2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-2048x2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  viewportFit: "cover",
};

const installPromptBootstrap = `(function(){try{if(!('serviceWorker' in navigator))return;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__edumindInstallPrompt=e;window.dispatchEvent(new Event('edumind:install-available'));});}catch(e){}})();`;

const splashBootstrap = `(function(){try{var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;var m=window.matchMedia('(max-width: 1023px)').matches;if(s||m){document.documentElement.classList.add('em-booting');window.setTimeout(function(){document.documentElement.classList.remove('em-booting');},7000);}}catch(e){}})();`;

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
        <script dangerouslySetInnerHTML={{ __html: splashBootstrap }} />
        <script dangerouslySetInnerHTML={{ __html: languageBootstrap }} />
        <script dangerouslySetInnerHTML={{ __html: installPromptBootstrap }} />
      </head>
      <body className="min-h-full overflow-x-clip bg-background text-foreground">
        <PwaLaunchScreen />
        <div className="flex min-h-dvh flex-col">{children}</div>
        <PwaRegister />
      </body>
    </html>
  );
}

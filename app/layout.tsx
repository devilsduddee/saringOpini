import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0D0D0D",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://saringopini.id"),
  title: {
    default: "Saring Opini — Platform Verifikasi Berita & Anti-Hoax Berbasis AI",
    template: "%s | Saring Opini",
  },
  description:
    "Cek dulu sebelum sebarkan. Verifikasi kebenaran tautan berita dan narasi pesan broadcast WhatsApp secara instan dengan analisis perbandingan multi-sumber AI tepercaya.",
  keywords: [
    "cek fakta",
    "anti hoax",
    "verifikasi berita",
    "saring opini",
    "fact check indonesia",
    "cek broadcast whatsapp",
    "literasi digital indonesia",
    "dewan pers",
    "cek turnbackhoax",
  ],
  authors: [{ name: "Saring Opini Team", url: "https://saringopini.id" }],
  creator: "Saring Opini",
  publisher: "Saring Opini",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Saring Opini — Platform Verifikasi Berita & Anti-Hoax",
    description:
      "Cek kebenaran berita dan broadcast WhatsApp berbasis AI multi-sumber tepercaya. Cek dulu, baru sebarkan.",
    url: "https://saringopini.id",
    siteName: "Saring Opini",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Saring Opini — Platform Verifikasi Berita & Anti-Hoax",
    description:
      "Cek kebenaran berita dan broadcast WhatsApp berbasis AI multi-sumber tepercaya. Cek dulu, baru sebarkan.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} dark bg-[#0D0D0D]`}>
      <body className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col font-sans antialiased selection:bg-[#FFD12F] selection:text-[#0D0D0D]">
        {children}
      </body>
    </html>
  );
}

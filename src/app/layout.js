import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Fitness Tracker",
  description: "Track your diet and workout plans",
  keywords: ["nextjs", "seo", "web development"],
  authors: [{ name: "Updesh Kushwaha" }],
  openGraph: {
    title: "Fitness Tracker",
    description: "Track your diet and workout plans",
    url: "https://fitness-tracker-app-2026.vercel.app/",
    siteName: "Fitness Tracker",
    images: [
      {
        url: "https://fitness-tracker-app-2026.vercel.app/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fitness Tracker",
    description: "Track your diet and workout plans",
    images: ["https://fitness-tracker-app-2026.vercel.app/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

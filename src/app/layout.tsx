import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import FloatingContact from "@/components/shared/FloatingContact";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.anandabazarbdmart.com"),
  title: {
    default: "Anandabazar BDMart — Your trusted online marketplace",
    template: "%s | Anandabazar BDMart",
  },
  description: "Shop quality products at the best prices with Anandabazar BDMart, your trusted online marketplace in Bangladesh.",
  keywords: ["anandabazar bdmart", "anandabazarbdmart", "online shopping", "ecommerce", "bangladesh", "marketplace", "best deals", "products"],
  applicationName: "Anandabazar BDMart",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Anandabazar BDMart",
    title: "Anandabazar BDMart — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Anandabazar BDMart, your trusted online marketplace in Bangladesh.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anandabazar BDMart — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Anandabazar BDMart, your trusted online marketplace in Bangladesh.",
  },
  robots: { index: true, follow: true },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Teko:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ReduxProvider>
          <ThemeProvider>
            <Toaster position="top-center" reverseOrder={false} />
            {children}
            <FloatingContact />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

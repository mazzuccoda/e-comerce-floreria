import type { Metadata } from "next";
import { Inter } from "next/font/google";
import './globals.css'

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { CartProviderRobust } from '../context/CartContextRobust';
import { I18nProvider } from '../context/I18nContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GoogleAnalytics from './components/GoogleAnalytics';
import AnalyticsProvider from './components/AnalyticsProvider';
// import CartDebugMonitor from './components/CartDebugMonitor'; // Disabled for production 

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Evita el flash de texto sin estilo
  preload: true,
});

export const metadata: Metadata = {
  title: "Florería Cristina - Ramos de flores a domicilio",
  description: "Florería y vivero especializado en ramos de flores frescas, plantas y arreglos florales. Entrega a domicilio en toda la ciudad. Calidad garantizada.",
  keywords: "florería, flores, ramos, plantas, vivero, entrega domicilio, arreglos florales, flores frescas, bouquet, decoración floral",
  authors: [{ name: "Florería Cristina" }],
  creator: "Florería Cristina",
  publisher: "Florería Cristina",
  robots: "index, follow",
  openGraph: {
    title: "Florería Cristina - Ramos de flores a domicilio",
    description: "Florería y vivero especializado en ramos de flores frescas, plantas y arreglos florales. Entrega a domicilio en toda la ciudad.",
    url: "https://floreria-cristina.com",
    siteName: "Florería Cristina",
    images: [
      {
        url: "https://floreria-cristina.com/images/floreria-cristina-og.jpg",
        width: 1200,
        height: 630,
        alt: "Florería Cristina - Flores frescas a domicilio",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Florería Cristina - Ramos de flores a domicilio",
    description: "Florería y vivero especializado en ramos de flores frescas, plantas y arreglos florales.",
    images: ["https://floreria-cristina.com/images/floreria-cristina-og.jpg"],
    creator: "@floreria_cristina",
  },
  manifest: "/manifest.json",
  icons: {
    icon: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1770509496/logo_circular_byx4zs.png',
    apple: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1770509496/logo_circular_byx4zs.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <I18nProvider>
          <AuthProvider>
            <CartProviderRobust>
              <AnalyticsProvider>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <Toaster />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer />
                  {/* <CartDebugMonitor /> */}
                </div>
              </AnalyticsProvider>
            </CartProviderRobust>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

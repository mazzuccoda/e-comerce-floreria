import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import './globals.css'

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { CartProviderRobust } from '../context/CartContextRobust';
import { I18nProvider } from '../context/I18nContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GoogleAnalytics from './components/GoogleAnalytics';
import FacebookPixel from './components/FacebookPixel';
import AnalyticsProvider from './components/AnalyticsProvider';
import LocalBusinessJsonLd from './components/LocalBusinessJsonLd';
import { getTiposFlor, getOcasiones } from '../utils/taxonomia';
// import CartDebugMonitor from './components/CartDebugMonitor'; // Disabled for production 

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Evita el flash de texto sin estilo
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriacristina.com.ar';
const OG_IMAGE = 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1770509496/logo_circular_byx4zs.png';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Florería Cristina - Ramos de flores a domicilio en Tucumán",
  description: "Florería y vivero con ramos de flores frescas, plantas y arreglos florales. Envío en Yerba Buena y San Miguel de Tucumán, o retiro en Solano Vera 480.",
  keywords: "florería, flores, ramos, plantas, vivero, entrega domicilio, arreglos florales, flores frescas, bouquet, decoración floral",
  authors: [{ name: "Florería Cristina" }],
  creator: "Florería Cristina",
  publisher: "Florería Cristina",
  robots: "index, follow",
  openGraph: {
    title: "Florería Cristina - Ramos de flores a domicilio en Tucumán",
    description: "Ramos de flores frescas, plantas y arreglos florales con envío en Yerba Buena y San Miguel de Tucumán, o retiro en tienda.",
    url: SITE_URL,
    siteName: "Florería Cristina",
    images: [
      {
        url: OG_IMAGE,
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
    title: "Florería Cristina - Ramos de flores a domicilio en Tucumán",
    description: "Ramos de flores frescas, plantas y arreglos florales con envío en Yerba Buena y San Miguel de Tucumán.",
    images: [OG_IMAGE],
    creator: "@floreria_cristina",
  },
  manifest: "/manifest.json",
  icons: {
    icon: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1770509496/logo_circular_byx4zs.png',
    apple: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1770509496/logo_circular_byx4zs.png',
  },
  other: {
    'facebook-domain-verification': '9bfo1m5fp56iebd33hvs9s8akja89k',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = headers().get('x-locale') === 'en' ? 'en' : 'es';
  const [tiposFlor, ocasiones] = await Promise.all([getTiposFlor(locale), getOcasiones(locale)]);

  return (
    <html lang={locale}>
      <head>
        <GoogleAnalytics />
        <LocalBusinessJsonLd />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        {/* Suspense: sin él, `useSearchParams` de estos componentes deja todo el
            sitio sin render en servidor */}
        <Suspense>
          <FacebookPixel />
          <AnalyticsProvider />
        </Suspense>
        <I18nProvider>
          <AuthProvider>
            <CartProviderRobust>
              <div className="flex flex-col min-h-screen">
                <Navbar tiposFlorIniciales={tiposFlor} ocasionesIniciales={ocasiones} />
                <Toaster />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                {/* <CartDebugMonitor /> */}
              </div>
            </CartProviderRobust>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

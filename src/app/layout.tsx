import type { Metadata } from 'next';
import ThemeRegistry from '@/components/ThemeRegistry';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'Mi Alfolí — Finanzas con Propósito',
  description: 'Gestiona tus finanzas personales con propósito espiritual. Traed todos los diezmos al alfolí — Malaquías 3:10',
  keywords: ['finanzas personales', 'presupuesto', 'diezmo', 'ahorro', 'Mi Alfolí'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#006064" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter, Roboto, sans-serif' }}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <ThemeRegistry>
            <ServiceWorkerRegistrar />
            {children}
          </ThemeRegistry>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

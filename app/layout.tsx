import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0C3B2E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'samnang borin shop - ដេប៉ូ សំណាង បូរិន',
  description: 'Mobile POS & Warehouse Management System (ប្រព័ន្ធគ្រប់គ្រងការលក់ទំនិញ និងស្តុកឃ្លាំង ដេប៉ូ សំណាង បូរិន)',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'សំណាងបូរិន POS',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'samnang borin shop - ដេប៉ូ សំណាង បូរិន',
    description: 'Mobile POS & Warehouse Management System (ប្រព័ន្ធគ្រប់គ្រងការលក់ទំនិញ និងស្តុកឃ្លាំង ដេប៉ូ សំណាង បូរិន)',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="km" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased min-h-screen bg-slate-900 text-slate-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

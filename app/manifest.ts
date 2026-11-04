import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'ដេប៉ូ សំណាង បូរិន - samnang borin shop',
    short_name: 'សំណាងបូរិន',
    description: 'ប្រព័ន្ធគ្រប់គ្រងការលក់ទំនិញតាមទូរស័ព្ទដៃ និងស្តុកឃ្លាំង ដេប៉ូ សំណាង បូរិន',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0C3B2E',
    theme_color: '#0C3B2E',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}

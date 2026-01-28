import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kindred Collective | The Independent Drinks Ecosystem',
  description: 'The UK\'s leading marketplace connecting independent drinks brands with suppliers, manufacturers, and service providers.',
  keywords: ['drinks', 'spirits', 'beer', 'wine', 'suppliers', 'packaging', 'ingredients', 'independent brands'],
  authors: [{ name: 'Kindred Collective' }],
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Kindred Collective | The Independent Drinks Ecosystem',
    description: 'Connect with suppliers, discover brands, and grow your drinks business.',
    type: 'website',
    locale: 'en_GB',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white font-body">
        {children}
      </body>
    </html>
  )
}

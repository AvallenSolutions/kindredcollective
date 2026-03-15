import type { Metadata } from 'next'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindredcollective.co'

export const metadata: Metadata = {
  title: 'Kindred Collective | The Independent Drinks Ecosystem',
  description: 'The UK\'s leading marketplace connecting independent drinks brands with suppliers, manufacturers, and service providers.',
  keywords: ['drinks', 'spirits', 'beer', 'wine', 'suppliers', 'packaging', 'ingredients', 'independent brands'],
  authors: [{ name: 'Kindred Collective' }],
  metadataBase: new URL(appUrl),
  openGraph: {
    title: 'Kindred Collective | The Independent Drinks Ecosystem',
    description: 'Connect with suppliers, discover brands, and grow your drinks business.',
    type: 'website',
    locale: 'en_GB',
    url: appUrl,
    siteName: 'Kindred Collective',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kindred Collective | The Independent Drinks Ecosystem',
    description: 'Connect with suppliers, discover brands, and grow your drinks business.',
  },
  icons: {
    icon: '/pineapple-logo.svg',
    apple: '/pineapple-logo.svg',
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

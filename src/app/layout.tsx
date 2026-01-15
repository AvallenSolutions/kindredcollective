import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Kindred Collective | The Independent Drinks Ecosystem',
  description: 'The UK\'s leading marketplace connecting independent drinks brands with suppliers, manufacturers, and service providers.',
  keywords: ['drinks', 'spirits', 'beer', 'wine', 'suppliers', 'packaging', 'ingredients', 'independent brands'],
  authors: [{ name: 'Kindred Collective' }],
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
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-white font-body">
        {children}
      </body>
    </html>
  )
}

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindredcollective.co'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/join'],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/settings/',
          '/community/',
          '/explore/',
          '/events/',
          '/offers/',
          '/news/',
          '/search/',
          '/onboarding/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  src: string | null
  alt: string
  fallbackLetter: string
  className?: string
  fallbackClassName?: string
}

export function BrandLogo({ src, alt, fallbackLetter, className, fallbackClassName }: BrandLogoProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <span className={cn('font-display font-bold text-gray-200', fallbackClassName)}>
        {fallbackLetter}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}

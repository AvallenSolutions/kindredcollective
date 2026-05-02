export interface VideoEmbed {
  provider: 'youtube' | 'vimeo'
  id: string
  embedUrl: string
}

export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') {
        return u.searchParams.get('v')
      }
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
        return parts[1] || null
      }
    }

    return null
  } catch {
    return null
  }
}

export function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null

    const parts = u.pathname.split('/').filter(Boolean)
    const candidate = parts[0] === 'video' ? parts[1] : parts[0]
    return candidate && /^\d+$/.test(candidate) ? candidate : null
  } catch {
    return null
  }
}

export function getVideoEmbed(url: string): VideoEmbed | null {
  const yt = getYouTubeId(url)
  if (yt) {
    return {
      provider: 'youtube',
      id: yt,
      embedUrl: `https://www.youtube.com/embed/${yt}`,
    }
  }

  const vm = getVimeoId(url)
  if (vm) {
    return {
      provider: 'vimeo',
      id: vm,
      embedUrl: `https://player.vimeo.com/video/${vm}`,
    }
  }

  return null
}

export function isSupportedVideoUrl(url: string): boolean {
  return getVideoEmbed(url) !== null
}

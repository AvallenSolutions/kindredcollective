import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Kindred Collective - The Independent Drinks Ecosystem'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#00D9FF',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            bottom: 16,
            border: '6px solid #000',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          {/* Logo box */}
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: '#1a6bff',
              border: '5px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            K
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: '-2px',
              textTransform: 'uppercase',
              color: '#000',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            Kindred Collective
          </div>

          {/* Tag line */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#000',
              color: '#fff',
              padding: '12px 32px',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            The Independent Drinks Ecosystem
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 22,
              color: '#000',
              opacity: 0.7,
              textAlign: 'center',
              maxWidth: 700,
            }}
          >
            Connect with suppliers, discover brands, and grow your drinks business
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            height: 8,
            backgroundColor: '#000',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}

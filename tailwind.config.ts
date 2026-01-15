import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Neo-Brutalist Color Palette
      colors: {
        // Primary accent colors
        cyan: {
          DEFAULT: '#00D9FF',
          50: '#E6FBFF',
          100: '#CCF7FF',
          200: '#99EEFF',
          300: '#66E6FF',
          400: '#33DDFF',
          500: '#00D9FF',
          600: '#00AECC',
          700: '#008299',
          800: '#005766',
          900: '#002B33',
        },
        coral: {
          DEFAULT: '#FF5D5D',
          50: '#FFF0F0',
          100: '#FFE1E1',
          200: '#FFC3C3',
          300: '#FFA5A5',
          400: '#FF8181',
          500: '#FF5D5D',
          600: '#FF1F1F',
          700: '#E00000',
          800: '#A30000',
          900: '#660000',
        },
        lime: {
          DEFAULT: '#CCFF00',
          50: '#F9FFE6',
          100: '#F3FFCC',
          200: '#E6FF99',
          300: '#DAFF66',
          400: '#D3FF33',
          500: '#CCFF00',
          600: '#A3CC00',
          700: '#7A9900',
          800: '#526600',
          900: '#293300',
        },
        // Semantic colors
        primary: '#00D9FF',
        secondary: '#FF5D5D',
        accent: '#CCFF00',
        success: '#CCFF00',
        warning: '#FF5D5D',
        info: '#3B82F6',
      },
      // Typography
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display sizes for Neo-Brutalist bold headings
        'display-xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      // Neo-Brutalist shadows
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-md': '6px 6px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-xl': '12px 12px 0px 0px #000000',
        // Colored shadows
        'brutal-cyan': '4px 4px 0px 0px #00D9FF',
        'brutal-coral': '4px 4px 0px 0px #FF5D5D',
        'brutal-lime': '4px 4px 0px 0px #CCFF00',
      },
      // Border widths for thick Neo-Brutalist borders
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      // Animation
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#0A0A0F',
          surface: '#111118',
          elevated: '#1A1A24',
          border: '#22222E',
        },
        brand: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
          dim: '#7C3AED1A',
        },
        status: {
          pending: '#6B7280',
          progress: '#F59E0B',
          done: '#10B981',
          delayed: '#EF4444',
        },
        assignee: {
          matheus: '#7C3AED',
          kauan: '#0EA5E9',
        },
        text: {
          primary: '#F0F0F8',
          secondary: '#9090A8',
          muted: '#5A5A70',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 0 0 1px #22222E',
        'card-hover': '0 0 0 1px #7C3AED40',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#1E1E1E',
          deep: '#141414',
          card: '#242424',
          hover: '#2e2e2e',
        },
        orange: {
          DEFAULT: '#A05500',
          light: '#C46A00',
          faint: 'rgba(160,85,0,0.08)',
          glow: 'rgba(160,85,0,0.18)',
        },
        grey: {
          dark: '#929292',
          mid: '#6a6a6a',
          light: '#D9D9D9',
          border: '#2e2e2e',
        },
        success: '#4caf7d',
        warning: '#e8a838',
        danger: '#d45f5f',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-raleway)', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
      boxShadow: {
        card: '0 8px 40px rgba(0,0,0,0.5)',
        glow: '0 0 30px rgba(160,85,0,0.25)',
      },
      keyframes: {
        toastIn: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        toastIn: 'toastIn 0.3s ease forwards',
        fadeIn: 'fadeIn 0.2s ease forwards',
        slideUp: 'slideUp 0.25s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config

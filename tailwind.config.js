/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — see CLAUDE.md
        cream: '#FAF8F5',
        clay: {
          50: '#FDF1ED',
          100: '#FADFD6',
          200: '#F4BFAE',
          300: '#EE9E86',
          400: '#E88A6D',
          500: '#E07A5F', // primary accent
          600: '#C9603F',
          700: '#A24A2E',
          800: '#7A3722',
          900: '#522516',
        },
        honey: {
          50: '#FEF9EF',
          100: '#FCF0D8',
          200: '#F8E2B4',
          300: '#F2CC8F', // secondary accent
          400: '#E9BC73',
          500: '#DFA85B',
          600: '#C08C42',
          700: '#946A31',
        },
        ink: {
          DEFAULT: '#2B2220',
          muted: '#6B5C57',
          faint: '#9A8A84',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunk: '#F4F0EA',
          line: '#E8E1D8',
        },
        sage: '#81B29A',
        dusk: '#6C7A9C',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 8vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.25rem, 5.5vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.75rem, 3.5vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.35rem, 2.5vw, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(43, 34, 32, 0.04), 0 8px 24px -12px rgba(43, 34, 32, 0.14)',
        lift: '0 2px 4px rgba(43, 34, 32, 0.05), 0 18px 40px -18px rgba(43, 34, 32, 0.24)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      },
      transitionTimingFunction: {
        bloom: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        250: '250ms',
        400: '400ms',
        600: '600ms',
      },
      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}

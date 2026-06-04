/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ── All brand tokens live here ─────────────────────────────────────────
      // To retheme the entire admin, only change values in this block.
      colors: {
        brand: {
          // Primary accent – warm amber (easy on eyes, professional)
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // ← main accent
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: {
          // Dark slate surfaces
          950: '#0a0c10',  // deepest bg
          900: '#0f1117',  // page bg
          850: '#13161e',  // sidebar bg
          800: '#181c27',  // card bg
          750: '#1e2233',  // card hover / elevated
          700: '#252a3d',  // borders
          600: '#2e3450',  // dividers
          500: '#3d4466',  // muted elements
          400: '#5a6285',  // placeholder text
          300: '#7b85a0',  // secondary text
          200: '#a0aabf',  // body text
          100: '#c8d0e0',  // primary text
          50:  '#e8ecf4',  // heading text
        },
        status: {
          success:     '#22c55e',
          successBg:   '#052e16',
          warning:     '#f59e0b',
          warningBg:   '#1c1405',
          error:       '#ef4444',
          errorBg:     '#1c0505',
          info:        '#3b82f6',
          infoBg:      '#05101c',
        },
      },
      fontFamily: {
        // ── Change fonts here to retheme typography globally ─────────────────
        display: ['Sora', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        // ── Adjust for sharper or rounder look globally ───────────────────
        DEFAULT: '8px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        pop:    '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
        glow:   '0 0 20px rgba(245,158,11,0.15)',
        inner:  'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'none' } },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // All brand colors come from CSS variables in globals.css — change the
        // brand by editing :root in globals.css (one place).
        brand: {
          DEFAULT: 'var(--brand)',
          50:  'var(--brand-50)',
          100: 'var(--brand-100)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          accent: 'var(--brand-accent)',
        },
        ink: 'var(--ink)',
        muted: 'var(--muted)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: { container: '1200px' },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#166534',
          600: '#15803d',
          700: '#14532d',
        },
        surface: '#F8FAFC',
        border: '#E2E8F0',
        body: '#0F172A',
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

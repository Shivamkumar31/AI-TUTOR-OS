/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
        surface: { DEFAULT: '#0f172a', 2: '#1e293b', 3: '#334155' },
      },
      fontFamily: { display: ['Lexend', 'sans-serif'] },
      keyframes: {
        fadeIn  : { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp : { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        bounce3 : { '0%,60%,100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        'fade-in'  : 'fadeIn .4s ease',
        'slide-up' : 'slideUp .4s ease',
        'bounce3'  : 'bounce3 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

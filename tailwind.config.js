/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '320px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.06)',
        glassBorder: 'rgba(255,255,255,0.12)',
        ink: '#E9EEFF',
        muted: '#A5B0D6'
      },
      boxShadow: {
        glow: '0 0 30px rgba(120, 120, 255, 0.35)'
      },
      borderRadius: {
        card: '20px'
      },
      backdropBlur: {
        glass: '18px'
      }
    }
  },
  plugins: []
};

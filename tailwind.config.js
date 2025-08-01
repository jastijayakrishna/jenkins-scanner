/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // brand teal palette
        brand: {
            50 : '#eef9ff',
            100: '#d6efff',
            200: '#aee0ff',
            300: '#7ad0ff',
            400: '#38b7ff',   // primary tint
            500: '#0b9dff',   // primary brand
            600: '#007ce9',
            700: '#0062c7',
            800: '#004fa1',
            900: '#003b75',
        },
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%':      { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%':      { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(20px)' },
                      to:   { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        blob: 'blob 18s ease-in-out infinite',
        'fade-in': 'fade-in 0.7s ease-in forwards',
        'slide-up': 'slide-up 0.5s 0.1s ease-out forwards',
      },
      backdropBlur: { xs: '2px' },          // tiny blur for glass
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',

  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      /*───────────────────────────────────
        Dark-optimized color palette
      ───────────────────────────────────*/
      colors: {
        // Primary dark backgrounds
        dark: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1f1f1f',
          900: '#171717',
          925: '#0f0f0f',
          950: '#0a0a0a',
        },
        
        // Apple System Blue palette
        brand: {
          50: '#F2F2F7',   // Apple System Gray 6
          100: '#E5E5EA',  // Apple System Gray 5
          200: '#D1D1D6',  // Apple System Gray 4
          300: '#C7C7CC',  // Apple System Gray 3
          400: '#AEAEB2',  // Apple System Gray 2
          500: '#007AFF',  // Apple System Blue
          600: '#0051D5',  // Apple System Blue Dark
          700: '#003D99',  // Deeper blue
          800: '#002E73',  // Dark blue
          900: '#001F4D',  // Very dark blue
          950: '#00122E',  // Navy blue
        },

        // Apple System Colors for feedback
        accent: {
          success: {
            50: '#F0FDF4',
            500: '#30D158',  // Apple System Green
            600: '#248A3D',
            700: '#1E6F32',
            800: '#185429',
            900: '#123920',
          },
          warning: {
            50: '#FFFBEB',
            500: '#FF9500',  // Apple System Orange
            600: '#E6850E',
            700: '#CC7A00',
            800: '#B36B00',
            900: '#995C00',
          },
          error: {
            50: '#FEF2F2',
            500: '#FF3B30',  // Apple System Red
            600: '#D70015',
            700: '#B80012',
            800: '#99000F',
            900: '#7A000C',
          },
        },

        // Glass effect colors
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
      },

      /*───────────────────────────────────
        Enhanced animations for dark theme
      ───────────────────────────────────*/
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.9)' },
        },
        // Apple-style fade with slight movement
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        // iOS-style slide up animation
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(24px) scale(0.96)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'slide-down': {
          from: { opacity: 0, transform: 'translateY(-24px) scale(0.96)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        // Apple-style scale in
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.92)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        // Apple-style bounce
        'apple-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' 
          },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.4)',
            transform: 'scale(1)' 
          },
          '50%': { 
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.8)',
            transform: 'scale(1.02)' 
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      animation: {
        blob: 'blob 18s ease-in-out infinite',
        // Apple timing curves (cubic-bezier(0.4, 0.0, 0.2, 1))
        'fade-in': 'fade-in 0.3s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'slide-down': 'slide-down 0.5s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards',
        'apple-bounce': 'apple-bounce 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
        glow: 'glow 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
        float: 'float 3s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
      },

      /*───────────────────────────────────
        Enhanced effects and utilities
      ───────────────────────────────────*/
      backdropBlur: { 
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(59, 130, 246, 0.1)',
        'dark': '0 10px 25px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 20px 50px rgba(0, 0, 0, 0.7)',
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Apple's 4pt spacing grid
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Apple specific spacings
        '1.5': '0.375rem', // 6px
        '2.5': '0.625rem', // 10px
        '3.5': '0.875rem', // 14px
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
        '6.5': '1.625rem', // 26px
        '7.5': '1.875rem', // 30px
      },

      // Apple Typography Scale
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        // SF Pro Display sizes
        'sf-title1': ['2.125rem', { lineHeight: '2.5rem', letterSpacing: '-0.022em', fontWeight: '700' }], // 34px
        'sf-title2': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.022em', fontWeight: '700' }],   // 28px
        'sf-title3': ['1.375rem', { lineHeight: '1.625rem', letterSpacing: '-0.022em', fontWeight: '590' }], // 22px
        'sf-headline': ['1.0625rem', { lineHeight: '1.3125rem', letterSpacing: '-0.022em', fontWeight: '590' }], // 17px
        'sf-body': ['1.0625rem', { lineHeight: '1.381rem', letterSpacing: '-0.022em', fontWeight: '400' }],     // 17px
        'sf-callout': ['1rem', { lineHeight: '1.25rem', letterSpacing: '-0.022em', fontWeight: '400' }],       // 16px
        'sf-subhead': ['0.9375rem', { lineHeight: '1.1875rem', letterSpacing: '-0.022em', fontWeight: '400' }], // 15px
        'sf-footnote': ['0.8125rem', { lineHeight: '1rem', letterSpacing: '-0.022em', fontWeight: '400' }],     // 13px
        'sf-caption1': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.022em', fontWeight: '400' }],       // 12px
        'sf-caption2': ['0.6875rem', { lineHeight: '0.8125rem', letterSpacing: '-0.022em', fontWeight: '400' }], // 11px
      },
    },
  },

  /*─────────────────────────────────────
    Safelist for dynamic classes
  ─────────────────────────────────────*/
  safelist: [
    // Dark theme gradients
    { pattern: /(from|to|via)-(blue|purple|cyan|emerald|amber|rose)-(400|500|600|700)/ },
    // Dark backgrounds
    { pattern: /bg-(gray|slate|zinc)-(800|900|950)/ },
    // Glass effects
    { pattern: /bg-white\/([0-9]|10)/ },
    // Status colors
    { pattern: /bg-(green|yellow|red|blue)-(500|600)\/([0-9]|10|20)/ },
    { pattern: /text-(green|yellow|red|blue)-(400|500)/ },
    { pattern: /border-(green|yellow|red|blue)-(500|600)\/([0-9]|10|20|30)/ },
    // Animation classes
    'animate-glow',
    'animate-pulse-glow', 
    'animate-float',
    'glass-card',
    'blob-blue',
    'blob-purple', 
    'blob-cyan',
  ],

  plugins: [
    // Custom scrollbar and Apple-level utilities plugin
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px'
          }
        },
        '.scrollbar-thumb-white\\/20': {
          '&::-webkit-scrollbar-thumb': {
            'background-color': 'rgba(255, 255, 255, 0.2)',
            'border-radius': '3px'
          }
        },
        '.scrollbar-track-transparent': {
          '&::-webkit-scrollbar-track': {
            'background-color': 'transparent'
          }
        },
        '.shadow-glow': {
          'box-shadow': '0 0 20px rgba(59, 130, 246, 0.4)'
        }
      })
    }
  ],
}

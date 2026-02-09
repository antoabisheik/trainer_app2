/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          teal: {
            DEFAULT: '#265047',  // Deep Teal
            dark: '#1a3832',     // Darker variant
            light: '#2d6b5f',    // Lighter variant
          },
          mint: {
            DEFAULT: '#a4feb7',  // Mint Green
            light: '#c4ffd0',    // Lighter variant
            dark: '#7ee594',     // Darker variant
          },
          silver: {
            DEFAULT: '#D9D9D9',  // Light Silver
            light: '#f0f0f0',    // Lighter variant
            dark: '#b8b8b8',     // Darker variant
          }
        },
      },
      fontFamily: {
        // Brand Typography
        poppins: ['Poppins', 'sans-serif'],
        futura: ['Futura', 'Poppins', 'sans-serif'],
        sans: ['Poppins', 'sans-serif'],  // Default sans
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      boxShadow: {
        // Brand-colored shadows
        'brand': '0 4px 14px 0 rgba(38, 80, 71, 0.15)',
        'brand-lg': '0 10px 40px 0 rgba(38, 80, 71, 0.2)',
        'mint': '0 4px 14px 0 rgba(164, 254, 183, 0.3)',
        'mint-lg': '0 10px 40px 0 rgba(164, 254, 183, 0.4)',
      },
    },
  },
  plugins: [],
}

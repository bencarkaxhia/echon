/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Echon Color Palette (from "The First Emotion" image)
        echon: {
          // Core blacks
          'black': '#0A0A0A',        // Background, deep space
          'shadow': '#1A1A1A',       // Depth, layering
          'wood': '#3E2723',         // Door frames, structure
          
          // Warm lights
          'candle': '#F4A460',       // Warm light, primary accent
          'gold': '#D4A574',         // Text highlights, warmth
          'root-light': '#FFD700',   // Tree light, energy
          
          // Text
          'cream': '#F5F5DC',        // Primary text
          'cream-dark': '#E8E8D0',   // Secondary text
          
          // Accents
          'burgundy': '#8B1E3F',     // Heritage, tradition
          'olive': '#5C6B47',        // Growth, nature
        },
      },
      fontFamily: {
        'serif': ['Crimson Text', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { filter: 'brightness(1) blur(0px)' },
          '100%': { filter: 'brightness(1.3) blur(2px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
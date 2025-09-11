/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Sing for Hope brand colors (preserved from original)
        harmony: '#339933',
        harmonylight: '#EFFEEF',
        harmonydark: '#226622',
        resonance: '#221F20',
        melody: '#DA4680',
        melodylight: '#FFEDF4',
        melodydark: '#932e54',
        rhythm: '#54749E',
        rhythmlight: '#EFF6FF',
        rhythmdark: '#38516a',
        sonata: '#FDD05E',
        sonatalight: '#FFF9EA',
        sonatadark: '#bf8800',
        sonatadarker: '#8e5f00',
        symphony: '#3A3F42',
        symphonylight: '#F3F3F3',
        symphonydark: '#262829',
        lightbg: '#f9fafb',
        transparent: 'transparent',
        black: '#000',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};

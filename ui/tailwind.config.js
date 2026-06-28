/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Palette borrowed from codyssey-frontend: a fixed deep-navy dark theme.
      colors: {
        'blue-5': 'hsl(245 71% 9%)',
        'blue-10': 'hsl(248 34% 18%)',
        'blue-15': 'hsl(248 26% 22%)',
        'blue-20': 'hsl(247 20% 27%)',
        'blue-30': 'hsl(248 13% 36%)',
        'blue-40': 'hsl(252 8% 63%)',
        'blue-midnight': 'hsl(247 77% 9%)',
        'blue-cosmic': 'hsl(247 69% 10%)',
        'blue-royalty': 'hsl(236 53% 45%)',
        'blue-royalty-hover': 'hsl(236 53% 41%)',
        'blue-periwinkle': 'hsl(232 67% 65%)',
        'white-whisper': 'hsl(120 3% 92%)',
        'success-green': 'hsl(155 97% 24%)',
        'error-red': 'hsl(4 76% 40%)',
      },
    },
  },
  plugins: [],
};

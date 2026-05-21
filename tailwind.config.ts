import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          success: 'var(--brand-success)',
          warning: 'var(--brand-warning)',
          danger: 'var(--brand-danger)',
        },
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--brand-primary)',
        background: 'var(--surface-1)',
        foreground: 'var(--text-primary)',
        primary: {
          DEFAULT: 'var(--brand-primary)',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT: 'var(--brand-danger)',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: 'var(--surface-3)',
          foreground: 'var(--text-secondary)',
        },
        accent: {
          DEFAULT: 'var(--brand-accent)',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: 'var(--surface-1)',
          foreground: 'var(--text-primary)',
        },
        card: {
          DEFAULT: 'var(--surface-1)',
          foreground: 'var(--text-primary)',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        brand: 'var(--shadow-brand)',
      },
      backgroundImage: {
        'brand-gradient': 'var(--brand-gradient)',
        'accent-gradient': 'var(--accent-gradient)',
        'hero-gradient': 'var(--hero-gradient)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
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
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

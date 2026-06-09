/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // New design system palette
        brand: {
          DEFAULT: '#1fb39a',
          deep: '#118b78',
          soft: '#e3f6f1',
        },
        ink: {
          DEFAULT: '#1b2433',
          2: '#384152',
        },
        primary: {
          DEFAULT: '#1fb39a',
          dark: '#118b78',
          darker: '#0d5f52',
          light: '#e3f6f1',
          ultra: '#f0faf8',
        },
        green: {
          DEFAULT: '#16a163',
          soft: '#e6f4ec',
          ink: '#0f7a4a',
        },
        purple: {
          DEFAULT: '#9b1f8c',
          soft: '#f6e8f4',
          ink: '#7d1670',
        },
        amber: {
          DEFAULT: '#b07d33',
          soft: '#f7efe0',
          ink: '#8c6322',
        },
        violet: {
          DEFAULT: '#8b5cd6',
          soft: '#efe9fb',
        },
        danger: {
          DEFAULT: '#d6536d',
          soft: '#fae9ec',
        },
        gold: {
          DEFAULT: '#b07d33',
          light: '#f7efe0',
        },
        // Semantic and neutral
        muted: '#7b8496',
        faint: '#aab0bd',
        line: {
          DEFAULT: '#e8e8ef',
          2: '#eef0f5',
        },
        surface: {
          DEFAULT: '#ffffff',
          2: '#fafafc',
        },
        bg: '#f3f3f7',
        lilac: '#f6edf6',
        ok: {
          DEFAULT: '#15924f',
          soft: '#e6f4ec',
        },
        bajo: {
          DEFAULT: '#9a6a16',
          soft: '#fbf0d6',
        },
        dark: '#0c1a2c',
        // shadcn/ui CSS variable mapping
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        display: ['"Lora"', 'serif'],
        sans: ['"Figtree"', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

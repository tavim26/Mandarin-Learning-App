import { colors, hskColors, hskUnknownColor, sm2CategoryColors, shadows } from './src/styles/tokens';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        // shadcn/ui — variabile CSS, nu se modifica
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Design system propriu — mapate din tokens.ts
        brand:   colors.primary,
        'brand-hover': colors.primaryHover,
        'app-bg': colors.background,
        'app-card': colors.card,
        error:   colors.error,
        teacher: colors.teacherAccent,
        student: colors.studentAccent,

        // Niveluri HSK — hsk-1 pana la hsk-6
        hsk: {
          1: hskColors[1],
          2: hskColors[2],
          3: hskColors[3],
          4: hskColors[4],
          5: hskColors[5],
          6: hskColors[6],
          unknown: hskUnknownColor,
        },

        // Categorii SM-2
        sm2: {
          new:      sm2CategoryColors.new,
          learning: sm2CategoryColors.learning,
          mature:   sm2CategoryColors.mature,
          due:      sm2CategoryColors.due,
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card:       shadows.card,
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
        form:       shadows.modal,
      },
    },
  },
  plugins: [],
};
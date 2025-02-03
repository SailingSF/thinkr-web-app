import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
      },
      spacing: {
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'md': '1rem',       // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
        '2xl': '3rem',      // 48px
        '3xl': '4rem',      // 64px
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#333333',
            lineHeight: '1.5',
            h1: {
              color: '#333333',
              lineHeight: '1.5',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            h2: {
              color: '#333333',
              lineHeight: '1.5',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            h3: {
              color: '#333333',
              lineHeight: '1.5',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            'ul, ol': {
              color: '#333333',
              lineHeight: '1.5',
              margin: '1em 0',
            },
            'li': {
              color: '#333333',
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'p': {
              color: '#333333',
              marginTop: '1em',
              marginBottom: '1em',
            },
            'blockquote': {
              color: '#333333',
              fontStyle: 'italic',
              borderLeftWidth: '4px',
              borderLeftColor: '#4B5563',
              paddingLeft: '1em',
              marginLeft: 0,
            },
            'code': {
              color: '#333333',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
              fontSize: '0.9em',
            },
            'pre': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              padding: '1em',
              borderRadius: '0.5em',
            },
            a: {
              color: '#8B5CF6',
              textDecoration: 'underline',
              '&:hover': {
                color: '#7C3AED',
              },
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;

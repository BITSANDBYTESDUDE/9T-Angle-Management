import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" }
      },
      borderRadius: { xl: "1rem", lg: ".75rem", md: ".5rem" },
      boxShadow: { soft: "0 12px 36px -16px rgba(18, 33, 48, .18)" },
      fontFamily: { sans: ["var(--font-inter)", "Inter", "sans-serif"] }
    }
  },
  plugins: [require("tailwindcss-animate")]
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ONYX EDITORIAL (2026-08-16, Krista-directed). Replaces the stock
        // Tailwind orange placeholder that shipped with the scaffold and was
        // never swapped ("BRAND-ASSET-PENDING"). Canonical palette:
        // Krista-OS/12-Content-Library/Brand-System/11-Onyx-Editorial-Visual-Identity-System.md
        //
        // Token VALUES are remapped; token NAMES are unchanged on purpose, so
        // no component has to be edited and nothing can break silently.
        //
        // Contrast verified 2026-08-16, not assumed. Two results decided the
        // mapping and are easy to get wrong:
        //   Teal Sapphire #087F7B on Moonstone = 4.34:1 -> FAILS body text,
        //     so links/muted use Deep Emerald #164F50 (8.28:1) instead.
        //   Paraiba #2FCFC0 on Moonstone = 1.74:1, the exact figure the brand
        //     doc lists as prohibited. Paraiba is dark-ground only.
        bg: "#F5F2EB",      // Moonstone - the warm neutral ground
        ink: "#030B14",     // Blue Black - body text (17.69:1 on Moonstone)
        primary: {
          50: "#F5F2EB",    // Moonstone - lightest wash
          100: "#D9E6EA",   // White Diamond - hairlines, light borders
          200: "#B4D8D6",
          300: "#7FC4BF",
          400: "#2FCFC0",   // Paraiba - brand accent, DARK GROUNDS ONLY
          500: "#087F7B",   // Teal Sapphire - structure, borders, hovers
          600: "#164F50",   // Deep Emerald - buttons + links (8.28:1)
          700: "#0A2E35",   // Onyx - link hover, dark surfaces (12.9:1)
          800: "#072228",
          900: "#030B14",   // Blue Black
        },
        // Pink Sapphire. Was unused by every component, which is why it is
        // safe here: it stays reserved for the single primary CTA and never
        // becomes body text or decoration, per the palette's color law.
        // Requires DARK text on it (Blue Black 4.81:1); Moonstone on pink is
        // 3.68:1 and fails, which is the trap most designs walk into.
        accent: "#F01878",
        muted: "#164F50",   // Deep Emerald - secondary text, readable at 8.28:1
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Bricolage Grotesque'", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
        article: "72ch",
      },
    },
  },
  plugins: [],
};

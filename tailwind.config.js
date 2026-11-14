/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f4f1fb",
        card: "#ffffff",
        ink: "#16142a",
        muted: "#4c4868",
        line: "#e4dff2",
        rust: "#4338ca",
        pine: "#047857",
        warn: "#9a3412",
        night: "#1b1740",
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(49, 46, 129, 0.08)",
        lift: "0 16px 40px rgba(49, 46, 129, 0.18)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        burst: {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(0.3)" },
          to: { opacity: "0", transform: "translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease both",
        float: "float 4.5s ease-in-out infinite",
        burst: "burst 0.9s ease-out both",
      },
    },
  },
  plugins: [],
}

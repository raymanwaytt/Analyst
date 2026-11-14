/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f3efe6",
        card: "#faf7f2",
        ink: "#1a1714",
        muted: "#5e584f",
        line: "#e0d6c8",
        rust: "#8d3418",
        pine: "#1d6b45",
        warn: "#8a5a12",
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(26, 23, 20, 0.04)",
      },
    },
  },
  plugins: [],
}

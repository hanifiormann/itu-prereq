/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: "#0a1128",
        bgSecondary: "#162447",
        bgPanel: "rgba(26, 42, 84, 0.7)",
        textMain: "#f8f9fa",
        textMuted: "#a0aabf",
        accentRed: "#e63946",
        accentBlue: "#4cc9f0",
        courseCompulsory: "#1f4068",
        courseElective: "#4d2c5e",
        courseCommon: "#2d6a4f",
        courseIntern: "#b35a00",
        statusPassed: "#4caf50",
        statusFailed: "#f44336",
        statusAvailable: "#ffeb3b",
        statusLocked: "#9e9e9e"
      }
    },
  },
  plugins: [],
}

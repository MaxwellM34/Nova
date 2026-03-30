/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nova: {
          50: "#f0f4ff",
          100: "#dce6ff",
          200: "#b9cdff",
          300: "#8aa8ff",
          400: "#587bff",
          500: "#3355f5",
          600: "#2037e8",
          700: "#1a2bcb",
          800: "#1b28a5",
          900: "#1c2882",
          950: "#141852",
        },
        cream: "#faf8f5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

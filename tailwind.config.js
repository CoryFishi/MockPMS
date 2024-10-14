/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      roboto: ["Roboto", "sans-serif"],
    },
    extend: {
      colors: {
        darkPrimary: "#1A1C21",
        darkNavPrimary: "#121317",
        darkNavSecondary: "#292C33",
        navPrimary: "#10141f",
        navSecondary: "#1e2538",
        border: "#444444b3",
      },
    },
  },
  plugins: [],
};

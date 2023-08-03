/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "gradient-start": "#A18CD1",
        "gradient-end": "#FBC2EB",
        "gradient-purple": "#A18CD1",
        "gradient-pink": "#FBC2EB",
      },
      height: {
        custom: "68vh", // 75% of viewport height
      },
      width: {
        custom: "82.5vw", // 80% of viewport width
      },
    },
  },
  plugins: [],
};

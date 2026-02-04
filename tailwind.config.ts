import type { Config } from "tailwindcss";

/**
 * Class Technologies Brand Configuration
 *
 * Note: Tailwind CSS v4 uses CSS-based configuration (@theme blocks in globals.css)
 * as the primary configuration method. This file is kept for reference and
 * backward compatibility with tools that expect a JS/TS config.
 *
 * Primary theme configuration is in: src/app/globals.css
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "class-navy": "#0A1849",
        "class-purple": "#4739E7",
        "class-light-purple": "#EBE9FC",
        "class-gold": "#FFBA00",
      },
      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

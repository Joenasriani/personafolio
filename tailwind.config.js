/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
    './lib/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1020',
        panel: '#11172b',
        panelSoft: '#171f38',
        text: '#edf2ff',
        muted: '#9fb0d1',
        accent: '#7c9cff',
        border: '#26314f'
      }
    }
  },
  plugins: [],
};

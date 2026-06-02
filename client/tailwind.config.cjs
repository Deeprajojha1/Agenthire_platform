module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./features/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 20% 88%)",
        background: "hsl(210 20% 98%)",
        foreground: "hsl(222 30% 12%)",
        muted: "hsl(215 16% 47%)"
      }
    }
  },
  plugins: []
};

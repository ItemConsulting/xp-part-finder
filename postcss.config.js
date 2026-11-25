const path = require("node:path");

module.exports = (ctx) => {
  // postcss-cli (npm run build:postcss) passes the file it processes. Vite (Storybook) does not, and inlines
  // @import and rebases url() itself, so it needs no plugins.
  if (!ctx.file) {
    return {};
  }

  return {
    map: ctx.options.map,
    plugins: {
      "postcss-import": {
        root: ctx.file.dirname,
        path: [path.join(__dirname, "node_modules")],
      },
      "postcss-url": {
        url: "copy",
      },
      cssnano: {},
    },
  };
};

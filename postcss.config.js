const path = require("path");

module.exports = (ctx) => {
  return {
    map: ctx.options.map,
    plugins: {
      "postcss-import": {
        root: ctx.webpackLoaderContext?.context ?? ctx.file.dirname,
        path: [path.join(__dirname, "node_modules")],
      },
      "postcss-url": {
        url: "copy",
      },
      "postcss-reporter": {
        clearReportedMessages: true,
      },
      "postcss-normalize": {},
      "postcss-nesting": {},
      autoprefixer: {},
      cssnano: {},
    },
  };
};

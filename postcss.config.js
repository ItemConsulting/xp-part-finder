const path = require("node:path");

module.exports = (ctx) => {
  return {
    map: ctx.options.map,
    plugins: {
      "postcss-import": {
        root: ctx.webpackLoaderContext?.context ?? ctx.file.dirname,
        path: [path.join(__dirname, "node_modules")],
      },
      "postcss-url": {
        // In webpack (Storybook), css-loader resolves the urls, so they only need to be
        // rebased relative to the file they were inlined into by postcss-import
        url: ctx.webpackLoaderContext ? "rebase" : "copy",
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

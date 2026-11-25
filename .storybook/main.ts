import type { StorybookConfig } from "@storybook/server-webpack5";

const config: StorybookConfig = {
  typescript: {
    check: false,
  },
  stories: ["../src/**/*.mdx", "../src/**/*.stories.tsx", "../src/**/*.stories.ts"],
  addons: [
    "@storybook/addon-links",
    {
      name: "@storybook/addon-styling-webpack",
      options: {
        rules: [
          // Replaces existing CSS rules to support PostCSS
          {
            test: /\.css$/,
            use: [
              "style-loader",
              {
                loader: "css-loader",
                options: { importLoaders: 1 },
              },
              {
                loader: "postcss-loader",
              },
            ],
          },
        ],
      },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-webpack5-compiler-swc",
    "@itemconsulting/preset-enonic-xp",
    "@storybook/addon-docs",
  ],
  staticDirs: ["../src/main/resources/assets"],
  framework: {
    name: "@storybook/server-webpack5",
    options: {},
  },
};
export default config;

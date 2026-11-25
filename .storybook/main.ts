import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@itemconsulting/storybook-framework-enonic-xp";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.ts"],
  addons: [
    {
      name: "addon-storybook-sync",
      options: {
        port: Number(process.env.WEBSTORM_ADDON_STORYBOOK_SYNC_PORT) || undefined,
      },
    },
    "@storybook/addon-links",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  staticDirs: ["../src/main/resources/assets"],
  framework: {
    name: "@itemconsulting/storybook-framework-enonic-xp",
    options: {},
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: {
        alias: [
          // main.css imports Designsystemet by its file path in node_modules, as postcss-import (used by the build)
          // does. Vite resolves through the package's "exports", which map that path somewhere else.
          {
            find: /^@digdir\/designsystemet-css\/dist\//,
            replacement: fileURLToPath(new URL("../node_modules/@digdir/designsystemet-css/dist/", import.meta.url)),
          },
        ],
      },
    }),
};

export default config;

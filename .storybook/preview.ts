import { DEFAULT_XP_SERVER, type Preview } from "@itemconsulting/xp-storybook-utils";
import "../src/main/resources/assets/styles/main.css";

const preview: Preview = {
  parameters: {
    server: {
      ...DEFAULT_XP_SERVER,
      url: process.env.STORYBOOK_SERVER_URL || DEFAULT_XP_SERVER.url,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    locale: {
      description: "Internationalization locale",
      defaultValue: "no",
      toolbar: {
        icon: "globe",
        items: [
          { value: "no", right: "🇳🇴", title: "Norsk" },
          { value: "en", right: "🇬🇧", title: "English" },
        ],
      },
    },
  },
};

export default preview;

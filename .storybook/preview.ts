/// <reference lib="dom" />
import type { Preview } from "@itemconsulting/storybook-framework-enonic-xp";
import "../src/main/resources/assets/styles/main.css";

document.documentElement.dataset.colorScheme = "auto";

const preview: Preview = {
  parameters: {
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

/// <reference lib="dom" />
import type { Preview } from "@storybook/server";
import "../src/main/resources/assets/styles/main.css";

document.documentElement.dataset.colorScheme = "auto";

const preview: Preview = {
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

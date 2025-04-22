import id from "./header.ftl";
import "./header.css";
import type { Meta, StoryObj } from "@itemconsulting/xp-storybook-utils";
import type { Header } from "./header.freemarker";

export default {
  title: "Components/Header",
  parameters: {
    layout: "fullscreen",
    server: {
      id,
      params: {
        template: `
          <div data-webtui-theme="\${theme!''}">
            \${theme!"NOPE"}
            [#include "${id}"]
          </div>
        `,
      },
    },
  },
} satisfies Meta<Header>;

export const header: StoryObj<Header> = {
  args: {
    currentAppKey: "no.item.www",
    filters: [
      {
        url: "#",
        text: "no.item.starter",
      },
      {
        url: "#",
        text: "no.item.www",
      },
    ],
  },
};

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
    },
  },
} satisfies Meta<Header>;

export const header: StoryObj<Header> = {
  args: {
    displayName: "Part finder",
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

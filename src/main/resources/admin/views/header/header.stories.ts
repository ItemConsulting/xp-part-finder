import id from "./header.ftlh";
import "./header.css";
import type { Meta, StoryObj } from "@storybook/server";
import type { Header } from "./header.freemarker";

export default {
  title: "Components/Header",
  parameters: {
    layout: "fullscreen",
    server: {
      id,
      params: {
        template: `
        <div data-color="brand1" style="background-color: var(--ds-color-base-default);">
          [#include "${id}" /]
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

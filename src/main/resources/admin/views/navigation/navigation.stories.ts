import type { Meta, StoryObj } from "@storybook/server";
import type { ComponentList } from "../../tools/part-finder/part-finder.freemarker";
import id from "./navigation.ftlh";

export default {
  title: "Components/Navigation",
  parameters: {
    server: {
      id,
      params: {
        template: `
          [#import "/admin/views/navigation/navigation.ftlh" as Navigation]
          [@Navigation.render itemLists=itemLists currentItemKey=currentItemKey currentItemType=currentItemType /]
        `,
      },
    },
  },
} satisfies Meta;

export const navigation: StoryObj<ComponentList> = {
  args: {
    currentItemKey: "no.item.starter:article-header",
    currentItemType: "PART",
    itemLists: [
      {
        title: "Parts",
        items: [
          {
            key: "no.item.starter:article-header",
            type: "PART",
            docCount: 3,
            url: "#",
          },
          {
            key: "no.item.starter:blocks-view",
            type: "PART",
            docCount: 1,
            url: "#",
          },
          {
            key: "no.item.starter:blocks-view",
            type: "PART",
            docCount: 1,
            url: "#",
            warningKey: "part-finder.missing-schema",
          },
          {
            key: "no.item.starter:blocks-view",
            type: "PART",
            docCount: 2,
            url: "#",
          },
          {
            key: "no.item.starter:blocks-view",
            type: "PART",
            docCount: 3,
            url: "#",
          },
        ],
      },
      {
        title: "Layouts",
        items: [
          {
            key: "no.item.starter:layout-1-col",
            type: "LAYOUT",
            docCount: 1,
            url: "#",
          },
          {
            key: "no.item.starter:layout-2-col",
            type: "LAYOUT",
            docCount: 0,
            url: "#",
          },
        ],
      },
      {
        title: "Blocks",
        items: [
          {
            key: "no.item.starter:blocks-cards",
            type: "BLOCK",
            docCount: 4,
            url: "#",
          },
          {
            key: "no.item.starter:blocks-legacy",
            type: "BLOCK",
            docCount: 1,
            url: "#",
            warningKey: "part-finder.missing-schema",
          },
          {
            key: "no.item.starter:blocks-map",
            type: "BLOCK",
            docCount: 0,
            url: "#",
          },
          {
            key: "no.item.starter:blocks-text",
            type: "BLOCK",
            docCount: 12,
            url: "#",
          },
        ],
      },
    ],
  },
};

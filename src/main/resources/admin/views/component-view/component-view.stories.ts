import type { Meta, StoryObj } from "@itemconsulting/xp-storybook-utils";
import type { ComponentViewParams } from "./component-view.freemarker";
import id from "./component-view.ftlh";

export default {
  title: "Components/Component View",
  parameters: {
    server: {
      id,
    },
  },
} satisfies Meta<ComponentViewParams>;

const componentArticleHeader: ComponentViewParams["currentItem"] = {
  key: "no.item.starter:article-header",
  displayName: "Article header",
  headings: [
    {
      text: "Type",
      name: "type",
      url: "#",
    },
    {
      text: "Display name",
      name: "displayName",
      url: "#",
    },

    {
      text: "Path",
      name: "_path",
      sortDirection: "ascending",
      url: "#",
    },
  ],
  projects: [
    {
      id: "mypage",
      displayName: "My Page",
      contents: [
        {
          url: "#",
          displayName: "Article",
          _path: "/testing/_templates/article",
          type: "portal:page",
        },
        {
          url: "#",
          displayName: "Article",
          _path: "/testing/_templates/article",
          type: "portal:page",
        },
        {
          url: "#",
          displayName: "Article",
          _path: "/testing/_templates/article",
          type: "portal:page",
        },
        {
          url: "#",
          displayName: "Article",
          _path: "/testing/_templates/article",
          type: "portal:page",
        },
        {
          url: "#",
          displayName: "Article",
          _path: "/testing/_templates/article",
          type: "portal:page",
        },
      ],
    },
  ],
};

export const componentView: StoryObj<ComponentViewParams> = {
  args: {
    currentItem: componentArticleHeader,
  },
};

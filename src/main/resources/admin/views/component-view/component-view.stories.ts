import id from "./component-view.ftl";
import type { Meta, StoryObj } from "@itemconsulting/xp-storybook-utils";
import { ComponentViewParams } from "./component-view.freemarker";

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
          typeIconUrl: "images/icon.svg",
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

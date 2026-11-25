import type { Meta, StoryObj } from "@storybook/server";
import { componentView } from "../../views/component-view/component-view.stories";
import { header } from "../../views/header/header.stories";
import { navigation } from "../../views/navigation/navigation.stories";
import id from "./part-finder.ftlh";

export default {
  title: "Admin/Part Finder",
  parameters: {
    layout: "fullscreen",
    server: { id },
  },
} satisfies Meta;

export const partFinder: StoryObj = {
  args: {
    title: "Part finder - Part name",
    currentAppKey: header.args?.currentAppKey,
    filters: header.args?.filters,
    itemLists: navigation.args?.itemLists,
    currentItem: componentView.args?.currentItem,
    currentItemKey: componentView.args?.currentItem?.key,
    // Leaves out the <link> and <script> elements for the built assets, which Storybook does not serve
    storybook: true,
  },
};

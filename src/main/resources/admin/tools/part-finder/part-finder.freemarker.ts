import { ComponentNavLinkList } from "/admin/views/navigation/navigation.freemarker";

export type ComponentList = {
  itemLists: ComponentNavLinkList[];
  currentItemKey?: string;
  currentItemDisplayName?: string;
  currentAppKey?: string;
};

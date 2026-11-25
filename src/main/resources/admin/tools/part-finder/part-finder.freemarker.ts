import type { ComponentNavLinkList } from "/admin/views/navigation/navigation.freemarker";

export type ComponentList = {
  itemLists: ComponentNavLinkList[];
  currentItemKey?: string;
  currentItemType?: string;
  currentAppKey?: string;
  baseAssetUrl: string;
};

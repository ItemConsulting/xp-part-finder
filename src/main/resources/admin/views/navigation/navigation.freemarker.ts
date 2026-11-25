export type ComponentNavLinkList = {
  title: string;
  items: ComponentNavLink[];
};

export type ComponentNavLink = {
  key: string;
  type: string;
  url: string;
  docCount: number;
  warningKey?: string;
};

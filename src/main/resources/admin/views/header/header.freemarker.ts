export type Header = {
  locale: string;
  title: string;
  currentAppKey: string;
  filters: Link[];
};

export type Link = {
  text: string;
  url: string;
};

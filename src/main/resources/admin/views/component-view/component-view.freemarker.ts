export type ComponentView = {
  key: string;
  displayName: string;
  projects: SimpleProject[];
  headings: Heading[];
};

export type AriaSortDirection = "ascending" | "descending";

export type SimpleProject = {
  id: string;
  displayName: string;
  contents: Usage[];
};

export type Heading = {
  text: string;
  name: string;
  url: string;
  sortDirection?: AriaSortDirection;
};

export type ComponentViewParams = {
  locale: string;
  currentItem?: ComponentView;
};

export type Usage = {
  /* Using underscore to match with database key for sorting */
  _path: string;
  url: string;
  displayName: string;
  type: string;
};

import { getToolUrl } from "/lib/xp/admin";
import { localize } from "/lib/xp/i18n";
import { queryAllRepos } from "/lib/part-finder/nodes";
import { getPartFinderUrl } from "/lib/part-finder/utils";
import type { AriaSortDirection, ComponentView, Heading } from "./component-view.freemarker";
import type { Content, SortDirection, SortDsl } from "@enonic-types/core";

const TABLE_HEADINGS = ["displayName", "type", "_path"] as const;

const ARIA_SORT_DIRECTION: Record<SortDirection, AriaSortDirection> = {
  ASC: "ascending",
  DESC: "descending",
} as const;

export function getComponentUsagesInRepo(
  component: { key: string; type: string },
  repositories: string[],
  sort: Partial<SortDsl>,
  locale: string,
): ComponentView {
  const direction = sort.direction ?? "ASC";

  const contents = queryAllRepos<Content>(repositories, {
    count: 1000,
    sort: {
      field: sort.field ?? "_path",
      direction,
    },
    filters: {
      hasValue: {
        field: `components.${component.type}.descriptor`,
        values: [component.key],
      },
    },
  }).map((content) => ({
    url: `${getToolUrl("com.enonic.app.contentstudio", "main")}/${content.repoId}/edit/${content._id}`,
    displayName: content.displayName ?? content._name,
    path: content._path,
    type: content.type,
  }));

  return {
    key: component.key,
    contents,
    headings: TABLE_HEADINGS.map(
      (name): Heading => ({
        name,
        text: localize({
          key: `part-finder.heading.${name}`,
          locale,
        }),
        url: getPartFinderUrl({
          key: component.key,
          type: component.type,
          sort: name,
          dir:
            name === sort.field
              ? // if current, use opposite direction
                direction === "ASC"
                ? "DESC"
                : "ASC"
              : (direction ?? "ASC"),
        }),
        sortDirection: sort.field === name ? ARIA_SORT_DIRECTION[direction ?? "ASC"] : undefined,
      }),
    ),
  };
}

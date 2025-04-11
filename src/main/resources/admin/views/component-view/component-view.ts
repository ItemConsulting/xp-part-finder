import { getToolUrl } from "/lib/xp/admin";
import { assetUrl } from "/lib/xp/portal";
import { list as listProjects } from "/lib/xp/project";
import { localize } from "/lib/xp/i18n";
import { queryAllRepos, type QueryAllReposResponse } from "/lib/part-finder/nodes";
import { getPartFinderUrl } from "/lib/part-finder/utils";
import type { AriaSortDirection, ComponentView, Heading, Usage } from "./component-view.freemarker";
import type { Content, SortDirection, SortDsl } from "@enonic-types/core";

const TABLE_HEADINGS: (keyof Usage)[] = ["projectId", "type", "displayName", "path"];

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
  const projectLanguages = getLanguageMap();
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
  }).map<Usage>((content) => getUsageObject(content, projectLanguages));

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

function getUsageObject(content: QueryAllReposResponse<Content>, projectLanguages: Record<string, string>): Usage {
  return {
    url: getEditContentUrl(content),
    displayName: content.displayName ?? content._name,
    path: content._path,
    type: content.type,
    projectId: content.projectId,
    projectIconUrl: getIconUrl(projectLanguages[content.projectId]),
  };
}

function getEditContentUrl(content: QueryAllReposResponse<Content>): string {
  return getContentStudioUrl(`/${content.projectId}/edit/${content._id}`);
}

function getIconUrl(language: string): string {
  return getContentStudioUrl(
    assetUrl({
      application: "com.enonic.app.contentstudio",
      path: `/images/flags/${language}.svg`,
    }),
  );
}

function getContentStudioUrl(path: string): string {
  return `${getToolUrl("com.enonic.app.contentstudio", "main")}${path}`;
}

function getLanguageMap(): Record<string, string> {
  return listProjects().reduce<Record<string, string>>((res, project) => {
    if (project.language === "en") {
      res[project.id] = "gb";
    } else if (project.language) {
      res[project.id] = project.language;
    }

    return res;
  }, {});
}

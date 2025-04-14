import { getToolUrl } from "/lib/xp/admin";
import { run } from "/lib/xp/context";
import { list as listProjects } from "/lib/xp/project";
import { query } from "/lib/xp/content";
import { localize } from "/lib/xp/i18n";
import { getPartFinderUrl, startsWith } from "/lib/part-finder/utils";
import type { AriaSortDirection, ComponentView, Heading, Usage } from "./component-view.freemarker";
import type { Content, FieldSortDsl, SortDirection, SortDsl } from "@enonic-types/core";

const CONTENT_ROOT_PATH = "/content";
const TABLE_HEADINGS: (keyof Usage)[] = ["type", "displayName", "_path"];

const ARIA_SORT_DIRECTION: Record<SortDirection, AriaSortDirection> = {
  ASC: "ascending",
  DESC: "descending",
} as const;

export function getComponentUsagesInProjects(
  component: { key: string; type: string },
  sort: Required<FieldSortDsl>,
  locale: string,
): ComponentView {
  const projects = listProjects();

  return {
    key: component.key,
    projects: projects
      .map((project) => {
        return {
          id: project.id,
          displayName: project.displayName,
          contents: getSimpleProjectContents(project.id, component, sort),
        };
      })
      .filter((project) => project.contents.length > 0),
    headings: getHeadings(component, sort, locale),
  };
}

function getSimpleProjectContents(
  projectId: string,
  component: { key: string; type: string },
  sort: Required<FieldSortDsl>,
): Usage[] {
  const res = run(
    {
      repository: `com.enonic.cms.${projectId}`,
      branch: "draft",
      principals: ["role:system.admin"],
    },
    () => {
      return query({
        count: 1000,
        sort: {
          field: sort.field ?? "_path",
          direction: sort.direction,
        },
        filters: [
          {
            hasValue: {
              field: `components.${component.type}.descriptor`,
              values: [component.key],
            },
          },
          {
            notExists: {
              field: "archivedTime",
            },
          },
        ],
      });
    },
  );

  return res.hits.map<Usage>((content) => getUsageObject(projectId, content));
}

function getHeadings(component: { key: string; type: string }, sort: Required<SortDsl>, locale: string): Heading[] {
  return TABLE_HEADINGS.map(
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
              sort.direction === "ASC"
              ? "DESC"
              : "ASC"
            : sort.direction,
      }),
      sortDirection: sort.field === name ? ARIA_SORT_DIRECTION[sort.direction] : undefined,
    }),
  );
}

function getUsageObject(projectId: string, content: Content): Usage {
  return {
    url: getEditContentUrl(projectId, content),
    displayName: content.displayName ?? content._name,
    _path: startsWith(content._path, CONTENT_ROOT_PATH)
      ? content._path.substring(CONTENT_ROOT_PATH.length)
      : content._path,
    type: content.type,
    typeIconUrl: `/admin/rest-v2/cs/schema/content/icon/${content.type}`,
  };
}

function getEditContentUrl(projectId: string, content: Content): string {
  return getContentStudioUrl(`/${projectId}/edit/${content._id}`);
}

function getContentStudioUrl(path: string): string {
  return `${getToolUrl("com.enonic.app.contentstudio", "main")}${path}`;
}

import type { FieldSortDsl, Filter, PrincipalKey, SortDirection } from "@enonic-types/core";
import { forceArray, getPartFinderUrl, groupBy, indexBy, notNullOrUndefined, startsWith } from "/lib/part-finder/utils";
import { getToolUrl } from "/lib/xp/admin";
import { get as getContext } from "/lib/xp/context";
import { localize } from "/lib/xp/i18n";
import { connect, multiRepoConnect, type Node } from "/lib/xp/node";
import type { Project } from "/lib/xp/project";
import type { AriaSortDirection, ComponentView, Heading, Usage } from "./component-view.freemarker";

/**
 * The sort that the table of usages is ordered by
 */
export type UsageSort = Required<Pick<FieldSortDsl, "field" | "direction">>;

type ContentNode = Node<{
  displayName?: string;
  type: string;
}>;

type UsageHit = {
  id: string;
  repoId: string;
};

const CONTENT_ROOT_PATH = "/content";
const TABLE_HEADINGS: (keyof Usage)[] = ["type", "displayName", "_path"];

/**
 * The maximum number of usages shown, in all projects together
 */
const MAX_USAGES = 10000;

const ARIA_SORT_DIRECTION: Record<SortDirection, AriaSortDirection> = {
  ASC: "ascending",
  DESC: "descending",
} as const;

/**
 * Lists the content matching `usageFilter` (the content using the component) in each project
 */
export function getComponentUsagesInProjects(
  component: { key: string; type: string; displayName: string },
  usageFilter: Filter,
  sort: UsageSort,
  locale: string,
  projects: Project[],
): ComponentView {
  const principals = forceArray(getContext().authInfo?.principals);
  const hitsByRepoId = queryUsageHitsByRepoId(projects.map(getRepoId), usageFilter, sort, principals);

  return {
    key: component.key,
    displayName: component.displayName,
    projects: projects
      .filter((project) => hitsByRepoId[getRepoId(project)] !== undefined)
      .map((project) => ({
        id: project.id,
        displayName: project.displayName,
        contents: getUsages(project, hitsByRepoId[getRepoId(project)], principals),
      }))
      .filter((project) => project.contents.length > 0),
    headings: getHeadings(component, sort, locale),
  };
}

/**
 * Matches the content using a part, layout or page
 */
export function getComponentUsageFilter(component: { key: string; type: string }): Filter {
  return {
    hasValue: {
      field: `components.${component.type}.descriptor`,
      values: [component.key],
    },
  };
}

/**
 * Finds the content matching the filter in all the given repos with a single query. Returns the hits of each repo that
 * has any, in the order of the sort.
 */
function queryUsageHitsByRepoId(
  repoIds: string[],
  usageFilter: Filter,
  sort: UsageSort,
  principals: PrincipalKey[],
): Record<string, UsageHit[]> {
  const hits = multiRepoConnect({
    sources: repoIds.map((repoId) => ({
      repoId,
      branch: "draft",
      principals,
    })),
  }).query({
    count: MAX_USAGES,
    sort: {
      field: sort.field,
      direction: sort.direction,
    },
    filters: [
      usageFilter,
      {
        notExists: {
          field: "archivedTime",
        },
      },
    ],
  }).hits;

  return groupBy<UsageHit>(hits, (hit) => hit.repoId);
}

/**
 * Fetches the content of the hits in a repo with a single lookup, and returns them in the order of the hits
 */
function getUsages(project: Project, hits: UsageHit[], principals: PrincipalKey[]): Usage[] {
  const nodesById = indexBy(
    forceArray(
      connect({
        repoId: getRepoId(project),
        branch: "draft",
        principals,
      }).get<ContentNode>(hits.map((hit) => hit.id)),
    ),
    (node) => node._id,
  );

  return hits
    .map((hit) => nodesById[hit.id])
    .filter(notNullOrUndefined)
    .map((node) => getUsageObject(project.id, node));
}

function getRepoId(project: Project): string {
  return `com.enonic.cms.${project.id}`;
}

function getHeadings(component: { key: string; type: string }, sort: UsageSort, locale: string): Heading[] {
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

function getUsageObject(projectId: string, content: ContentNode): Usage {
  return {
    url: getEditContentUrl(projectId, content),
    displayName: content.displayName ?? content._name,
    _path: startsWith(content._path, CONTENT_ROOT_PATH)
      ? content._path.substring(CONTENT_ROOT_PATH.length)
      : content._path,
    type: content.type,
  };
}

function getEditContentUrl(projectId: string, content: ContentNode): string {
  return getContentStudioUrl(`/${projectId}/edit/${content._id}`);
}

function getContentStudioUrl(path: string): string {
  return `${getToolUrl("com.enonic.app.contentstudio", "main")}${path}`;
}

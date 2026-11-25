import type { Request, Response, SortDirection } from "@enonic-types/core";
import { assetUrl } from "/lib/enonic/asset";
import { render } from "/lib/freemarker";
import { type AppBlocks, getAppBlocks, getBlockUsageFilter, queryBlockUsages } from "/lib/part-finder/blocks";
import { querySiteApplicationKeys } from "/lib/part-finder/nodes";
import { getComponentAsAdmin, listComponentsAsAdmin } from "/lib/part-finder/schemas";
import { find, forceArray, getPartFinderUrl, notNullOrUndefined } from "/lib/part-finder/utils";
import { LanguageRange, Locale } from "/lib/time";
import { type Application, list as listApplications } from "/lib/xp/app";
import { get as getContext } from "/lib/xp/context";
import { getSupportedLocales, localize } from "/lib/xp/i18n";
import { list as listProjects, type Project } from "/lib/xp/project";
import type { ComponentDescriptor, ComponentDescriptorType } from "/lib/xp/schema";
import {
  getComponentUsageFilter,
  getComponentUsagesInProjects,
  type UsageSort,
} from "../../views/component-view/component-view";
import type { ComponentView, ComponentViewParams } from "../../views/component-view/component-view.freemarker";
import type { Header, Link } from "../../views/header/header.freemarker";
import {
  type ComponentUsages,
  getAppUsages,
  getBlockNavLinkList,
  getComponentNavLinkList,
  type NavItemType,
  queryComponentUsages,
  withSchemaKeys,
} from "../../views/navigation/navigation";
import type { ComponentList } from "./part-finder.freemarker";

type ComponentRef = {
  key: string;
  type: ComponentDescriptorType;
};

type AppWithComponents = {
  app: Application;
  componentCount: number;
  firstComponent: ComponentRef;
  componentsByType: Record<ComponentDescriptorType, ComponentDescriptor[]>;
};

type PartFinderQueryParams = {
  params: {
    key: string;
    type: string;
    sort?: string;
    dir?: string;
  };
};

const LOCALE_DEFAULT = "en";
const COMPONENT_TYPES: ComponentDescriptorType[] = ["PART", "LAYOUT", "PAGE"];
const NO_COMPONENTS: Record<ComponentDescriptorType, ComponentDescriptor[]> = { PART: [], LAYOUT: [], PAGE: [] };
const view = resolve("part-finder.ftlh");
const componentView = resolve("../../views/component-view/component-view.ftlh");

export function get(req: Request<PartFinderQueryParams>): Response {
  const currentItemType = parseItemType(req.params.type);
  const currentItemKey = req.params.key;
  const projects = listProjects();
  const cmsRepoIds = projects.map((project) => `com.enonic.cms.${project.id}`);
  const installedApps = listAppsWithComponents(cmsRepoIds);

  const locale = getLocale(req);
  const title = localize({
    key: "part-finder.pageTitle",
    locale,
    values: forceArray(currentItemKey),
  });

  if (installedApps.length === 0) {
    return {
      status: 404,
      body: "<h1>No installed applications found</h1>",
    };
  }

  if (!currentItemKey) {
    const startComponent = getStartComponent(installedApps[0], queryComponentUsages(cmsRepoIds));

    return {
      body: undefined,
      redirect: getPartFinderUrl({
        key: startComponent.key,
        type: startComponent.type,
      }),
    };
  }

  const currentAppKey = getAppKey(currentItemKey);
  const isTurboFrameRequest = req.headers["turbo-frame"] === "content-view";
  const currentAppComponents =
    find(installedApps, (it) => it.app.key === currentAppKey)?.componentsByType ?? NO_COMPONENTS;

  // Blocks are only looked up when they are shown, in the navigation or in the component view
  const appBlocks =
    currentItemType === "BLOCK" || !isTurboFrameRequest ? getAppBlocks(currentAppKey, currentAppComponents) : undefined;

  const currentItem = currentItemType
    ? getCurrentItem({
        key: currentItemKey,
        type: currentItemType,
        appBlocks,
        sort: {
          field: req.params.sort ?? "_path",
          direction: parseSortDirection(req.params.dir) ?? "ASC",
        },
        locale,
        projects,
      })
    : undefined;

  if (!currentItem) {
    return {
      status: 404,
      body: "<h1>Component not found</h1>",
    };
  }

  // If in Turbo Frame, only render the component view
  if (isTurboFrameRequest) {
    return {
      body: wrapInHtml({
        markup: render<ComponentViewParams>(componentView, {
          locale,
          currentItem,
        }),
        title,
      }),
    };
  }

  const usages = queryComponentUsages(cmsRepoIds);
  const blockNavLinkList = appBlocks
    ? getBlockNavLinkList(
        appBlocks,
        queryBlockUsages(cmsRepoIds, appBlocks, forceArray(getContext().authInfo?.principals)),
      )
    : undefined;
  const itemLists = [...getComponentNavLinkList(usages, currentAppKey, currentAppComponents), blockNavLinkList].filter(
    notNullOrUndefined,
  );

  const filters = installedApps.map<Link>((appWithComponents) => {
    const startComponent = getStartComponent(appWithComponents, usages);

    return {
      text: appWithComponents.app.key,
      url: getPartFinderUrl({
        key: startComponent.key,
        type: startComponent.type,
      }),
    };
  });

  return {
    body: render<ComponentList & ComponentViewParams & Header>(view, {
      locale,
      title,
      filters,
      currentItemKey,
      currentItemType,
      currentAppKey,
      currentItem,
      itemLists,
      baseAssetUrl: assetUrl({
        path: "",
      }),
    }),
  };
}

/**
 * Lists the content using a component, or a block from the blocks library. Returns undefined for a block if the
 * application has no blocks, does not use them in any content type, component or mixin, or the key has no block name.
 */
function getCurrentItem({
  key,
  type,
  appBlocks,
  sort,
  locale,
  projects,
}: {
  key: string;
  type: NavItemType;
  appBlocks: AppBlocks | undefined;
  sort: UsageSort;
  locale: string;
  projects: Project[];
}): ComponentView | undefined {
  if (type === "BLOCK") {
    const blockName = key.split(":")[1];
    const block = appBlocks ? find(appBlocks.blocks, (it) => it.name === blockName) : undefined;
    const usageFilter = appBlocks ? getBlockUsageFilter(appBlocks, blockName) : undefined;

    return usageFilter
      ? getComponentUsagesInProjects(
          { key, type, displayName: block?.label ?? "" },
          usageFilter,
          sort,
          locale,
          projects,
        )
      : undefined;
  }

  return getComponentUsagesInProjects(
    {
      key,
      type,
      displayName: getComponentAsAdmin({ key, type })?.title ?? "",
    },
    getComponentUsageFilter({ key, type }),
    sort,
    locale,
    projects,
  );
}

function getLocale(req: Request): string {
  const acceptLanguage = req.headers["Accept-Language"];

  if (!acceptLanguage) {
    return LOCALE_DEFAULT;
  }
  const languageRange = LanguageRange.parse(acceptLanguage);
  return Locale.filterTags(languageRange, getSupportedLocales(["i18n/phrases"]))[0] ?? LOCALE_DEFAULT;
}

/**
 * Lists the applications used by a site that have components, with the most components first
 */
function listAppsWithComponents(repoIds: string[]): AppWithComponents[] {
  const siteApplicationKeys = querySiteApplicationKeys(repoIds);

  return listApplications()
    .filter((app) => siteApplicationKeys.indexOf(app.key.toLowerCase()) !== -1)
    .map(getAppWithComponents)
    .filter(notNullOrUndefined)
    .sort(byComponentCountDescending);
}

/**
 * Lists each component type of the application once, and derives both the number of components and the first
 * component (alphabetically, in the order parts, layouts, pages) from that. Returns undefined if it has no components.
 */
function getAppWithComponents(app: Application): AppWithComponents | undefined {
  const componentsByType = COMPONENT_TYPES.map<ComponentDescriptor[]>((type) =>
    listComponentsAsAdmin({ type, application: app.key }),
  );
  const firstComponent = componentsByType.map(getFirstAlphabetically).filter(notNullOrUndefined)[0];

  return firstComponent
    ? {
        app,
        componentCount: componentsByType.reduce((sum, components) => sum + components.length, 0),
        firstComponent,
        componentsByType: {
          PART: componentsByType[0],
          LAYOUT: componentsByType[1],
          PAGE: componentsByType[2],
        },
      }
    : undefined;
}

/**
 * The component to show when selecting an application: the first component that is used in content, or else the first
 * component in the application
 */
function getStartComponent(appWithComponents: AppWithComponents, usages: ComponentUsages): ComponentRef {
  return getFirstUsedComponent(appWithComponents, usages) ?? appWithComponents.firstComponent;
}

/**
 * Returns the first component (alphabetically, in the order parts, layouts, pages) of the application that is used in
 * content
 */
function getFirstUsedComponent(
  { app, componentsByType }: AppWithComponents,
  usages: ComponentUsages,
): ComponentRef | undefined {
  return COMPONENT_TYPES.map((type) =>
    getFirstAlphabetically(
      withSchemaKeys(getAppUsages(usages[type], app.key), componentsByType[type]).map<ComponentRef>((bucket) => ({
        key: bucket.key,
        type,
      })),
    ),
  ).filter(notNullOrUndefined)[0];
}

function getFirstAlphabetically<T extends { key: string }>(items: T[]): T | undefined {
  return items.reduce<T | undefined>(
    (first, item) => (!first || item.key.localeCompare(first.key) < 0 ? item : first),
    undefined,
  );
}

function byComponentCountDescending(a: AppWithComponents, b: AppWithComponents): number {
  return b.componentCount - a.componentCount || a.app.key.localeCompare(b.app.key);
}

function getAppKey(key: string): string {
  return key.split(":")[0];
}

function wrapInHtml({ markup, title }: { markup: string; title: string }): string {
  return `<!DOCTYPE html><html lang="en"><head><title>${escapeHtml(title)}</title></head><body>${markup}</body></html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseItemType(str: string = ""): NavItemType | undefined {
  const uppercasedStr = str.toUpperCase();

  if (uppercasedStr === "PAGE" || uppercasedStr === "LAYOUT" || uppercasedStr === "PART" || uppercasedStr === "BLOCK") {
    return uppercasedStr;
  }

  return undefined;
}

function parseSortDirection(str: string = ""): SortDirection | undefined {
  const uppercasedStr = str.toUpperCase();

  if (uppercasedStr === "ASC" || uppercasedStr === "DESC") {
    return uppercasedStr;
  }

  return undefined;
}

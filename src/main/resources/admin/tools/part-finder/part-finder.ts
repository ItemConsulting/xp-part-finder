import type { Request, Response, SortDirection } from "@enonic-types/core";
import { assetUrl } from "/lib/enonic/asset";
import { render } from "/lib/freemarker";
import { queryAllRepos } from "/lib/part-finder/nodes";
import { getComponentAsAdmin, listComponentsAsAdmin } from "/lib/part-finder/schemas";
import { flatMap, forceArray, getPartFinderUrl, notNullOrUndefined } from "/lib/part-finder/utils";
import { LanguageRange, Locale } from "/lib/time";
import { type Application, list as listApplications } from "/lib/xp/app";
import type { Site } from "/lib/xp/content";
import { getSupportedLocales, localize } from "/lib/xp/i18n";
import { list as listProjects } from "/lib/xp/project";
import type { ComponentDescriptor, ComponentDescriptorType } from "/lib/xp/schema";
import { getComponentUsagesInProjects } from "../../views/component-view/component-view";
import type { ComponentViewParams } from "../../views/component-view/component-view.freemarker";
import type { Header, Link } from "../../views/header/header.freemarker";
import {
  type ComponentUsages,
  getAppUsages,
  getComponentNavLinkList,
  queryComponentUsages,
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
};

type PartFinderQueryParams = {
  params: {
    key: string;
    type: ComponentDescriptorType;
    sort?: string;
    dir?: string;
  };
};

const LOCALE_DEFAULT = "en";
const COMPONENT_TYPES: ComponentDescriptorType[] = ["PART", "LAYOUT", "PAGE"];
const view = resolve("part-finder.ftlh");
const componentView = resolve("../../views/component-view/component-view.ftlh");

export function get(req: Request<PartFinderQueryParams>): Response {
  const currentItemType = parseComponentType(req.params.type);
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
  const currentItem = currentItemType
    ? getComponentUsagesInProjects(
        {
          key: currentItemKey,
          type: currentItemType,
          displayName:
            getComponentAsAdmin({
              key: currentItemKey,
              type: currentItemType,
            })?.displayName ?? "",
        },
        {
          field: req.params.sort ?? "_path",
          direction: parseSortDirection(req.params.dir) ?? "ASC",
        },
        locale,
      )
    : undefined;

  if (!currentItem) {
    return {
      status: 404,
      body: "<h1>Component not found</h1>",
    };
  }

  // If in Turbo Frame, only render the component view
  if (req.headers["turbo-frame"] === "content-view") {
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
  const itemLists = getComponentNavLinkList(usages, currentAppKey);

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
      currentAppKey,
      currentItem,
      itemLists,
      baseAssetUrl: assetUrl({
        path: "",
      }),
    }),
  };
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
  const sites = queryAllRepos<Site<unknown>>(repoIds, {
    count: 1000,
    filters: {
      hasValue: {
        field: "type",
        values: ["portal:site"],
      },
    },
  });

  const applicationsKeys = flatMap(sites, (site) =>
    forceArray(site.data.siteConfig).map((config) => config.applicationKey),
  );

  return listApplications()
    .filter((app) => applicationsKeys.indexOf(app.key) !== -1)
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
      }
    : undefined;
}

/**
 * The component to show when selecting an application: the first component that is used in content, or else the first
 * component in the application
 */
function getStartComponent(appWithComponents: AppWithComponents, usages: ComponentUsages): ComponentRef {
  return getFirstUsedComponent(appWithComponents.app.key, usages) ?? appWithComponents.firstComponent;
}

/**
 * Returns the first component (alphabetically, in the order parts, layouts, pages) of the application that is used in
 * content
 */
function getFirstUsedComponent(appKey: string, usages: ComponentUsages): ComponentRef | undefined {
  return COMPONENT_TYPES.map((type) =>
    getFirstAlphabetically(
      getAppUsages(usages[type], appKey).map<ComponentRef>((bucket) => ({ key: bucket.key, type })),
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

function parseComponentType(str: string = ""): ComponentDescriptorType | undefined {
  const uppercasedStr = str.toUpperCase();

  if (uppercasedStr === "PAGE" || uppercasedStr === "LAYOUT" || uppercasedStr === "PART") {
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

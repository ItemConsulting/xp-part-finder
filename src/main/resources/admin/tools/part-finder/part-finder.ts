import { render } from "/lib/tineikt/freemarker";
import { list as listApps, type Application } from "/lib/xp/app";
import { list as listRepos } from "/lib/xp/repo";
import { getSupportedLocales, localize } from "/lib/xp/i18n";
import {
  listComponents,
  type ComponentDescriptorType,
  type ComponentDescriptor,
  type ListDynamicComponentsParams,
} from "/lib/xp/schema";
import { Locale, LanguageRange } from "/lib/time";
import {
  assertIsDefined,
  forceArray,
  getPartFinderUrl,
  notNullOrUndefined,
  runAsAdmin,
  startsWith,
} from "/lib/part-finder/utils";
import { getComponentNavLinkList } from "../../views/navigation/navigation";
import { getComponentUsagesInRepo } from "../../views/component-view/component-view";
import type { ComponentList } from "./part-finder.freemarker";
import type { ComponentViewParams } from "../../views/component-view/component-view.freemarker";
import type { Header, Link } from "../../views/header/header.freemarker";
import type { Request, Response, SortDirection } from "@enonic-types/core";

type PartFinderQueryParams = {
  params: {
    key: string;
    type: ComponentDescriptorType;
    sort?: string;
    dir?: string;
  };
};

const LOCALE_DEFAULT = "en";
const view = resolve("part-finder.ftl");
const componentView = resolve("../../views/component-view/component-view.ftl");

export function get(req: Request<PartFinderQueryParams>): Response {
  const currentItemType = parseComponentType(req.params.type);
  const currentItemKey = req.params.key;
  const installedApps = listAppsWithComponents();
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
    const firstComponent = getFirstComponent(installedApps[0]);

    assertIsDefined(firstComponent);

    return {
      body: undefined,
      redirect: getPartFinderUrl({
        key: firstComponent.key,
        type: firstComponent.type,
      }),
    };
  }

  const currentAppKey = getAppKey(currentItemKey);
  const cmsRepoIds = getCMSRepoIds();
  const currentItem = currentItemType
    ? getComponentUsagesInRepo(
        {
          key: currentItemKey,
          type: currentItemType,
        },
        cmsRepoIds,
        {
          field: req.params.sort ?? "_path",
          direction: parseSortDirection(req.params.dir),
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
          currentItem,
        }),
        title,
      }),
    };
  }

  const itemLists = getComponentNavLinkList(cmsRepoIds, currentAppKey);

  const filters = installedApps.map<Link>((app) => {
    const firstComponent = getFirstComponent(app);

    return {
      text: app.key,
      url: firstComponent
        ? getPartFinderUrl({
            key: firstComponent.key,
            type: firstComponent.type,
          })
        : "",
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

function listAppsWithComponents(): Application[] {
  return runAsAdmin(() => listApps()).filter((app) => notNullOrUndefined(getFirstComponent(app)));
}

function getFirstComponent(app: Application): ComponentDescriptor | undefined {
  return (
    getFirstComponentAlphabetically({
      type: "PART",
      application: app.key,
    }) ??
    getFirstComponentAlphabetically({
      type: "LAYOUT",
      application: app.key,
    }) ??
    getFirstComponentAlphabetically({
      type: "PAGE",
      application: app.key,
    })
  );
}

function getFirstComponentAlphabetically(params: ListDynamicComponentsParams): ComponentDescriptor | undefined {
  const components = runAsAdmin(() => listComponents(params));
  components.sort((a, b) => a.key.localeCompare(b.key));
  return components[0];
}

function getAppKey(key: string): string {
  return key.split(":")[0];
}

function wrapInHtml({ markup, title }: { markup: string; title: string }): string {
  return `<!DOCTYPE html><html lang="en"><head><title>${title}</title></head><body>${markup}</body></html>`;
}

function getCMSRepoIds(): string[] {
  return runAsAdmin(() =>
    listRepos()
      .map((repo) => repo.id)
      .filter((repoId) => startsWith(repoId, "com.enonic.cms")),
  );
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

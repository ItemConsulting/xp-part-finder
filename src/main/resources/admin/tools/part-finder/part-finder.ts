import { render } from "/lib/tineikt/freemarker";
import { getToolUrl } from "/lib/xp/admin";

import { get as getContent } from "/lib/xp/content";
import { run as runInContext } from "/lib/xp/context";
import { connect as nodeConnect } from "/lib/xp/node";
import { hasRole as hasAuthRole } from "/lib/xp/auth";

import { query } from "/lib/xp/content";
import { list as listApps, type Application } from "/lib/xp/app";
import { list as listRepos } from "/lib/xp/repo";
import {
  listComponents,
  getComponent,
  type LayoutDescriptor,
  type PageDescriptor,
  type PartDescriptor,
  type ComponentDescriptorType,
} from "/lib/xp/schema";
import {
  find,
  flatMap,
  notNullOrUndefined,
  objectKeys,
  runAsAdmin,
  startsWith,
  stringAfterLast,
  unique,
} from "/lib/part-finder/utils";
import type { ComponentItem, ComponentList } from "./part-finder.freemarker";
import type { ComponentViewParams } from "/admin/views/component-view/component-view.freemarker";
import type { Header, Link } from "/admin/views/header/header.freemarker";

type Component = PartDescriptor | LayoutDescriptor | PageDescriptor;

type PartFinderQueryParams = {
  key: string;
  type: string;
};

const PART_KEY = "PART";
const LAYOUT_KEY = "LAYOUT";
const PAGE_KEY = "PAGE";

const PAGE_TITLE = "Part finder";
const view = resolve("part-finder.ftl");
const componentView = resolve("../../views/component-view/component-view.ftl");

const shouldDisplayReplacer = (currentItemType?: string) =>
  PART_KEY === currentItemType || LAYOUT_KEY === currentItemType;

export function get(req: XP.Request<PartFinderQueryParams>): XP.Response {
  const currentItemType = parseComponentType(req.params.type);
  const componentKey = req.params.key;

  const cmsRepoIds = getCMSRepoIds();

  // If in Turbo Frame, only render the component view
  if (req.headers["turbo-frame"] === "content-view" && componentKey && currentItemType) {
    const component = getComponent({
      type: currentItemType,
      key: componentKey,
    }) as Component;

    if (component) {
      const currentItem = getComponentUsagesInRepo(component, cmsRepoIds);

      return {
        body: wrapInHtml({
          markup: render<ComponentViewParams>(componentView, {
            currentItem,
            displayReplacer: shouldDisplayReplacer(currentItem?.type),
          }),
          title: `${PAGE_TITLE} - ${component.displayName}`,
        }),
      };
    }
  }

  const installedApps = runAsAdmin(() => listApps());

  const allParts = listComponentsInApplication(installedApps, PART_KEY);
  const allLayouts = listComponentsInApplication(installedApps, LAYOUT_KEY);
  const allPages = listComponentsInApplication(installedApps, PAGE_KEY);

  const parts = allParts.map((component) => getComponentUsagesInRepo(component, cmsRepoIds));
  const layouts = allLayouts.map((component) => getComponentUsagesInRepo(component, cmsRepoIds));
  const pages = allPages.map((component) => getComponentUsagesInRepo(component, cmsRepoIds));

  const allItems = parts.concat(layouts).concat(pages);

  if (!componentKey) {
    return {
      redirect: allItems[0].url,
    };
  }

  const currentItem = find(allItems, (item) => item.key === componentKey);

  const appKeysWithUsedComponents = unique(allItems.map((item) => getAppKey(item.key)));

  const filters = appKeysWithUsedComponents
    .map((appKey) => find(installedApps, (app) => app.key === appKey))
    .filter(notNullOrUndefined)
    .map<Link>((app) => ({
      text: app.key ?? "",
      url: find(allItems, (component) => startsWith(component.key, app.key))?.url ?? "",
    }));

  if (appKeysWithUsedComponents.length === 0) {
    return {
      status: 404,
      body: "<h1>No installed applications found</h1>",
    };
  }

  const currentAppKey = getAppKey(componentKey);

  const model = {
    title: `${PAGE_TITLE} - ${currentItem?.displayName}`,
    displayName: PAGE_TITLE,
    filters,
    currentItemKey: componentKey,
    currentAppKey,
    currentItem,
    displayReplacer: shouldDisplayReplacer(currentItem?.type),
    itemLists: [
      {
        title: "Parts",
        items: parts.filter((part) => startsWith(part.key, currentAppKey)),
      },
      {
        title: "Layouts",
        items: layouts.filter((layout) => startsWith(layout.key, currentAppKey)),
      },
      {
        title: "Pages",
        items: pages.filter((page) => startsWith(page.key, currentAppKey)),
      },
    ].filter((list) => list.items.length > 0),
  };

  return {
    body: render<ComponentList & ComponentViewParams & Header>(view, model),
  };
}

function getAppKey(key: string): string {
  return key.split(":")[0];
}

function getPartFinderUrl(params: PartFinderQueryParams): string {
  const queryParams = objectKeys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  return `${getToolUrl("no.item.partfinder", "part-finder")}?${queryParams}`;
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

function listComponentsInApplication(installedApps: Application[], type: ComponentDescriptorType): PartDescriptor[] {
  return runAsAdmin(() =>
    flatMap(installedApps, (app) =>
      listComponents({
        application: app.key,
        type,
      }),
    ),
  );
}

function getComponentUsagesInRepo(component: Component, repositories: string[]): ComponentItem {
  return repositories
    .map((repository) => getComponentUsages(component, repository))
    .reduce<ComponentItem>(
      (usages, componentUsage) => {
        return {
          url: componentUsage.url,
          total: usages.total + componentUsage.total,
          key: usages.key,
          type: usages.type,
          displayName: usages.displayName,
          contents: usages.contents.concat(componentUsage.contents),
        };
      },
      {
        url: "",
        total: 0,
        key: component.key,
        type: component.type,
        displayName: component.displayName,
        contents: [],
      },
    );
}

function getComponentUsages(component: Component, repository: string): ComponentItem {
  const res = runAsAdmin(
    () =>
      query({
        query: `components.${component.type}.descriptor = '${component.key}'`,
        count: 1000,
      }),
    {
      repository,
    },
  );

  const repo = stringAfterLast(repository, ".");

  return {
    total: res.total,
    key: component.key,
    type: component.type,
    displayName: component.displayName,
    url: getPartFinderUrl({
      key: component.key,
      type: component.type,
    }),
    contents: res.hits.map((hit) => ({
      url: `${getToolUrl("com.enonic.app.contentstudio", "main")}/${repo}/edit/${hit._id}`,
      displayName: hit.displayName,
      path: hit._path,
      id: hit._id,
    })),
  };
}

function parseComponentType(str: string = ""): ComponentDescriptorType | undefined {
  const uppercasedStr = str.toUpperCase();

  if (uppercasedStr === PAGE_KEY || uppercasedStr === LAYOUT_KEY || uppercasedStr === PART_KEY) {
    return uppercasedStr;
  }

  return undefined;
}

//-----------

export function post(req: XP.Request): XP.Response {
  if (!hasAuthRole("system.admin")) {
    return {
      status: 403,
      body: "FORBIDDEN",
    };
  }

  const sourceKey = (req.params.key || "").trim();
  const targetKey = (req.params.new_part_ref || "").trim();
  const componentType /*: CompType */ = ((req.params.type || "") + "").trim().toLowerCase(); /*as CompType;*/

  const targetBranch = "draft";

  const undo: boolean = !!req.params.undo;

  const targetIds = Object.keys(req.params)
    .filter((k) => k.startsWith("select-change--"))
    .map((k) => req.params[k]);

  const args: { [key: string]: string } = {
    key: sourceKey,
    new_part_ref: targetKey,
    type: componentType,
  };

  const missingArgs = Object.keys(args)
    .filter((key) => !args[key])
    .map((key) => key);
  if (missingArgs.length > 0) {
    return {
      status: 400,
      body: "BAD REQUEST. Missing POST parameters: " + JSON.stringify(missingArgs),
    };
  }

  const createEditorFunc = (oldAppKey: string, oldComponentKey: string, newAppKey: string, newComponentKey: string) => {
    const oldAppKeyDashed = oldAppKey.replace(/\./g, "-");
    const newAppKeyDashed = newAppKey.replace(/\./g, "-");

    const pathPatternString =
      "components\\." + componentType + "\\.config\\." + oldAppKeyDashed + "\\." + oldComponentKey;

    // Looks for "components.<componentType>.config.<oldAppKeyDashed>.<oldComponentKey>" or "components.<componentType>.config.<oldAppKeyDashed>.<oldComponentKey>.<something more whatever>"
    // but not "components.<componentType>.config.<oldAppKeyDashed>.<key that starts with oldComponentKey but continues before the dot or end>" or "components.<componentType>.config.<oldAppKeyDashed>.<oldComponentKey>.." etc:
    const configSearchPattern = new RegExp("^" + pathPatternString + "($|\\.(?!\\.|$))");
    const configReplacePattern = new RegExp("^(" + pathPatternString + "\\b)");
    const configReplaceTarget = "components." + componentType + ".config." + newAppKeyDashed + "." + newComponentKey;

    const editor = (oldItem /*: ContentItem */) => {

      oldItem._indexConfig.configs = oldItem._indexConfig.configs.map((config) => {
        if ((config.path || "").match(configSearchPattern)) {

          const newPath = config.path.replace(configReplacePattern, configReplaceTarget);
        }
        return config;
      });

      /* oldItem.components = */
      oldItem.components = oldItem.components.map((component) => {
        if (
          component.type === componentType &&
          component[componentType].descriptor === `${oldAppKey}:${oldComponentKey}`
        ) {

          const newComponent = {
            ...component,
            [componentType]: {
              ...component[componentType],
              descriptor: `${newAppKey}:${newComponentKey}`,
              config: {
                ...component[componentType].config,
                [newAppKeyDashed]: {
                  ...component[componentType].config[oldAppKeyDashed],
                  [newComponentKey]: component[componentType].config[oldAppKeyDashed][oldComponentKey],
                },
              },
            },
          };

          if (oldAppKeyDashed !== newAppKeyDashed) {
            delete newComponent[componentType].config[oldAppKeyDashed];
          }
          if (oldComponentKey !== newComponentKey) {
            delete newComponent[componentType].config[newAppKeyDashed][oldComponentKey];
          }
        }

        return component;
      });

      return oldItem;
    };

    return editor;
  };

  const [oldAppKey, oldComponentKey] = sourceKey.split(":");
  const [newAppKey, newComponentKey] = targetKey.split(":");
  const editor = createEditorFunc(oldAppKey, oldComponentKey, newAppKey, newComponentKey);

  const okays: { id: string; url: string; displayName: string; path: string }[] = [];
  const errors: { id: string; url: string; displayName: string; path: string; message: string }[] = [];

  const repoIds = getCMSRepoIds();
  repoIds.forEach((targetRepo) => {
    const repo = nodeConnect({
      repoId: targetRepo,
      branch: targetBranch,
    });

    const repoName = stringAfterLast(targetRepo, ".");

    runInContext(
      {
        repository: targetRepo,
        branch: targetBranch,
        principals: ["role:system.admin"],
      },
      () => {
        let i, id, item;
        for (i = 0; i < targetIds.length; i++) {
          id = targetIds[i];
          item = null;

          try {
            item = getContent({
              key: id,
            });
            if (item) {

              repo.modify({
                key: id,
                editor: editor,
              });

              okays.push({
                id,
                url: `${getToolUrl("com.enonic.app.contentstudio", "main")}/${repoName}/edit/${id}`,
                displayName: item?.displayName,
                path: item?._path,
              });
            }
          } catch (e) {
            log.error(e);
            errors.push({
              id,
              url: `${getToolUrl("com.enonic.app.contentstudio", "main")}/${repoName}/edit/${id}`,
              displayName: item?.displayName,
              path: item?._path,
              message: e instanceof Error ? e.message : "Unknown error",
            });
          }
        }
      },
    );
  });

  return {
    body:
      '<turbo-frame id="content-view">' +
      "<p>" +
      'Okidokie, you want to change "' +
      sourceKey +
      '" into "' +
      targetKey +
      '" on ' +
      targetIds.length +
      " items:</p><br /><ol><li>" +
      targetIds.join(",</li><li>") +
      "</li></ol></turbo-frame>",
  };
}

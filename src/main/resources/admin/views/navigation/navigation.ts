import { multiRepoConnect, type Aggregations, type DateBucket, type NumericBucket } from "/lib/xp/node";
import {
  ComponentDescriptorType,
  LayoutDescriptor,
  listComponents,
  PageDescriptor,
  PartDescriptor,
} from "/lib/xp/schema";
import { difference, getPartFinderUrl, runAsAdmin, startsWith } from "/lib/part-finder/utils";
import type { ComponentNavLink, ComponentNavLinkList } from "./navigation.freemarker";

type WithKey = {
  key: string;
};

export function getComponentNavLinkList(repoIds: string[], currentAppKey: string): ComponentNavLinkList[] {
  const aggregations = {
    part: {
      terms: {
        field: `components.part.descriptor`,
        size: 1000,
      },
    },
    layout: {
      terms: {
        field: `components.layout.descriptor`,
        size: 1000,
      },
    },
    page: {
      terms: {
        field: `components.page.descriptor`,
        size: 1000,
      },
    },
  } satisfies Aggregations;

  const connection = multiRepoConnect({
    sources: repoIds.map((repoId) => ({
      repoId,
      branch: "draft",
      principals: ["role:system.admin"],
    })),
  });

  const res = connection.query<typeof aggregations>({
    count: 0,
    aggregations,
    filters: {
      notExists: {
        field: "archivedTime",
      },
    },
  });

  const appFilter = (bucket: DateBucket | NumericBucket) => startsWith(bucket.key, currentAppKey);

  return [
    {
      title: "Parts",
      items: getComponentNavLinks(res.aggregations.part.buckets.filter(appFilter), currentAppKey, "PART"),
    },
    {
      title: "Layouts",
      items: getComponentNavLinks(res.aggregations.layout.buckets.filter(appFilter), currentAppKey, "LAYOUT"),
    },
    {
      title: "Pages",
      items: getComponentNavLinks(res.aggregations.page.buckets.filter(appFilter), currentAppKey, "PAGE"),
    },
  ].filter((list) => list.items.length > 0);
}

function getComponentNavLinks(
  buckets: (DateBucket | NumericBucket)[],
  application: string,
  type: ComponentDescriptorType,
): ComponentNavLink[] {
  const componentsWithSchema = runAsAdmin(() =>
    listComponents({
      type,
      application,
    }),
  );

  const unusedComponents = difference(componentsWithSchema, buckets, keysEqual).map((component) =>
    getComponentNavLink(component, type),
  );

  const componentsUsedInContent = buckets.map((componentInContent) =>
    getComponentNavLink(
      componentInContent,
      type,
      includesKey(componentsWithSchema, componentInContent) ? undefined : "part-finder.missing-schema",
    ),
  );

  const links = [...componentsUsedInContent, ...unusedComponents];

  links.sort((x, y) => x.key.localeCompare(y.key));

  return links;
}

function getComponentNavLink(
  component: DateBucket | NumericBucket | PartDescriptor | LayoutDescriptor | PageDescriptor,
  type: ComponentDescriptorType,
  warningKey?: string | undefined,
): ComponentNavLink {
  return {
    docCount: "docCount" in component ? component.docCount : 0,
    key: component.key,
    url: getPartFinderUrl({
      key: component.key,
      type,
    }),
    warningKey,
  };
}

function keysEqual(x: WithKey, y: WithKey): boolean {
  return x.key === y.key;
}

function includesKey(xs: WithKey[], y: WithKey): boolean {
  return xs.map((x) => x.key).indexOf(y.key) !== -1;
}

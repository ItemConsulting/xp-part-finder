import { listComponentsAsAdmin } from "/lib/part-finder/schemas";
import { difference, forceArray, getPartFinderUrl, indexBy, startsWith } from "/lib/part-finder/utils";
import { get as getContext } from "/lib/xp/context";
import { type Aggregations, type DateBucket, multiRepoConnect, type NumericBucket } from "/lib/xp/node";
import type { ComponentDescriptorType, LayoutDescriptor, PageDescriptor, PartDescriptor } from "/lib/xp/schema";
import type { ComponentNavLink, ComponentNavLinkList } from "./navigation.freemarker";

type WithKey = {
  key: string;
};

type UsageBucket = DateBucket | NumericBucket;

/**
 * Components used in content, by component type. Each bucket has the component key and number of content using it.
 */
export type ComponentUsages = Record<ComponentDescriptorType, UsageBucket[]>;

/**
 * Counts the usages of all components in all the given repos, with a single aggregation query
 */
export function queryComponentUsages(repoIds: string[]): ComponentUsages {
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
      repoId, // Can we check against legal projects here first?
      branch: "draft",
      principals: forceArray(getContext().authInfo?.principals),
      // principals: ["role:system.admin"],
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

  return {
    PART: res.aggregations.part.buckets,
    LAYOUT: res.aggregations.layout.buckets,
    PAGE: res.aggregations.page.buckets,
  };
}

/**
 * Returns the usage buckets of the components in an application.
 *
 * XP indexes descriptors in lowercase, so the bucket keys are lowercased (see `withSchemaKeys`).
 */
export function getAppUsages(buckets: UsageBucket[], appKey: string): UsageBucket[] {
  const prefix = `${appKey.toLowerCase()}:`;
  return buckets.filter((bucket) => startsWith(bucket.key.toLowerCase(), prefix));
}

/**
 * XP indexes descriptors in lowercase, so the keys of the usage buckets are lowercased (e.g. "my.app:mypart" instead of
 * "my.app:myPart"). Replaces each bucket key with the key of the component schema that matches it case-insensitively,
 * to restore the original casing. Buckets without a matching schema keep their key.
 */
export function withSchemaKeys(buckets: UsageBucket[], components: WithKey[]): UsageBucket[] {
  const componentsByLowerCaseKey = indexBy(components, (component) => component.key.toLowerCase());

  return buckets.map((bucket) => {
    const component = componentsByLowerCaseKey[bucket.key.toLowerCase()];
    return component ? { ...bucket, key: component.key } : bucket;
  });
}

export function getComponentNavLinkList(usages: ComponentUsages, currentAppKey: string): ComponentNavLinkList[] {
  return [
    {
      title: "Parts",
      items: getComponentNavLinks(getAppUsages(usages.PART, currentAppKey), currentAppKey, "PART"),
    },
    {
      title: "Layouts",
      items: getComponentNavLinks(getAppUsages(usages.LAYOUT, currentAppKey), currentAppKey, "LAYOUT"),
    },
    {
      title: "Pages",
      items: getComponentNavLinks(getAppUsages(usages.PAGE, currentAppKey), currentAppKey, "PAGE"),
    },
  ].filter((list) => list.items.length > 0);
}

function getComponentNavLinks(
  appUsages: UsageBucket[],
  application: string,
  type: ComponentDescriptorType,
): ComponentNavLink[] {
  const componentsWithSchema = listComponentsAsAdmin({
    type,
    application,
  });
  const buckets = withSchemaKeys(appUsages, componentsWithSchema);

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
  component: UsageBucket | PartDescriptor | LayoutDescriptor | PageDescriptor,
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

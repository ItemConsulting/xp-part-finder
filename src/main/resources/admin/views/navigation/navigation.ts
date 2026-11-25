import type { AppBlocks, BlockUsageBucket } from "/lib/part-finder/blocks";
import { difference, forceArray, getPartFinderUrl, indexBy, startsWith } from "/lib/part-finder/utils";
import { get as getContext } from "/lib/xp/context";
import { type Aggregations, type DateBucket, multiRepoConnect, type NumericBucket } from "/lib/xp/node";
import type { ComponentDescriptorType } from "/lib/xp/schema";
import type { ComponentNavLink, ComponentNavLinkList } from "./navigation.freemarker";

type WithKey = {
  key: string;
};

type WithDocCount = WithKey & {
  docCount: number;
};

/**
 * The types of items in the navigation: component types, and blocks from the blocks library
 */
export type NavItemType = ComponentDescriptorType | "BLOCK";

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
export function withSchemaKeys<Bucket extends WithKey>(buckets: Bucket[], components: WithKey[]): Bucket[] {
  const componentsByLowerCaseKey = indexBy(components, (component) => component.key.toLowerCase());

  return buckets.map((bucket) => {
    const component = componentsByLowerCaseKey[bucket.key.toLowerCase()];
    return component ? { ...bucket, key: component.key } : bucket;
  });
}

/**
 * Lists the parts, layouts and pages of the application. Pass in the components of the application, that are already
 * listed by the caller.
 */
export function getComponentNavLinkList(
  usages: ComponentUsages,
  currentAppKey: string,
  componentsByType: Record<ComponentDescriptorType, WithKey[]>,
): ComponentNavLinkList[] {
  return [
    {
      title: "Parts",
      items: getNavLinks(getAppUsages(usages.PART, currentAppKey), componentsByType.PART, "PART"),
    },
    {
      title: "Layouts",
      items: getNavLinks(getAppUsages(usages.LAYOUT, currentAppKey), componentsByType.LAYOUT, "LAYOUT"),
    },
    {
      title: "Pages",
      items: getNavLinks(getAppUsages(usages.PAGE, currentAppKey), componentsByType.PAGE, "PAGE"),
    },
  ].filter(hasItems);
}

/**
 * Lists the blocks of an application from the blocks library. Returns undefined if there are none.
 */
export function getBlockNavLinkList(
  appBlocks: AppBlocks,
  blockUsages: BlockUsageBucket[],
): ComponentNavLinkList | undefined {
  const list = {
    title: "Blocks",
    items: getNavLinks(
      blockUsages,
      appBlocks.blocks.map((block) => ({ key: `${appBlocks.appKey}:${block.name}` })),
      "BLOCK",
    ),
  };

  return hasItems(list) ? list : undefined;
}

function hasItems(list: ComponentNavLinkList): boolean {
  return list.items.length > 0;
}

/**
 * Lists both the items used in content (with a warning if they no longer have a schema) and the unused ones,
 * alphabetically
 */
function getNavLinks(usages: WithDocCount[], itemsWithSchema: WithKey[], type: NavItemType): ComponentNavLink[] {
  const buckets = withSchemaKeys(usages, itemsWithSchema);

  const unusedItems = difference(itemsWithSchema, buckets, keysEqual).map((item) => getNavLink(item, type));

  const itemsUsedInContent = buckets.map((bucket) =>
    getNavLink(bucket, type, includesKey(itemsWithSchema, bucket) ? undefined : "part-finder.missing-schema"),
  );

  return [...itemsUsedInContent, ...unusedItems].sort((x, y) => x.key.localeCompare(y.key));
}

function getNavLink(
  item: WithKey | WithDocCount,
  type: NavItemType,
  warningKey?: string | undefined,
): ComponentNavLink {
  return {
    docCount: "docCount" in item ? item.docCount : 0,
    key: item.key,
    type,
    url: getPartFinderUrl({
      key: item.key,
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

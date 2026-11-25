import { type Aggregations, multiRepoConnect } from "/lib/xp/node";

/**
 * Returns the keys of the applications that are added to a site in any of the given repos, with a single aggregation
 * query.
 *
 * XP indexes the keys in lowercase, so the returned keys are lowercased.
 */
export function querySiteApplicationKeys(repoIds: string[]): string[] {
  const aggregations = {
    applications: {
      terms: {
        field: "data.siteConfig.applicationKey",
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

  return connection
    .query<typeof aggregations>({
      count: 0,
      aggregations,
      filters: {
        hasValue: {
          field: "type",
          values: ["portal:site"],
        },
      },
    })
    .aggregations.applications.buckets.map((bucket) => bucket.key.toLowerCase());
}

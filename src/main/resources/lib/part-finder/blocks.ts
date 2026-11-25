import type { Filter, FormItem, PrincipalKey, TermsAggregation } from "@enonic-types/core";
import { listSchemasAsAdmin, type SchemaWithForm } from "/lib/part-finder/schemas";
import { flatMap, fromEntries, groupBy, indexBy, objectKeys } from "/lib/part-finder/utils";
import { multiRepoConnect } from "/lib/xp/node";
import type { ComponentDescriptor, ComponentDescriptorType } from "/lib/xp/schema";

/**
 * The "blocks" of the blocks library (lib-xp-blocks) are the options of the "blocks" OptionSet in the "blocks" form
 * fragment. Content stores the name of the selected block in `<path to the option set>._selected`.
 */
const BLOCKS_FORM_FRAGMENT_NAME = "blocks";
const BLOCKS_OPTION_SET_NAME = "blocks";

/**
 * How many times a form fragment can be included inside itself. A block can include the "blocks" form fragment again
 * (e.g. a block with columns of blocks), so allow one level of nesting, and stop there.
 */
const MAX_FORM_FRAGMENT_REPEATS = 2;

/**
 * Guards against form fragments that include each other in long chains
 */
const MAX_FORM_FRAGMENT_DEPTH = 10;

/**
 * The maximum number of buckets in each aggregation. Covers the number of content types and blocks in an application.
 */
const AGGREGATION_SIZE = 1000;

export type BlockDefinition = {
  /**
   * The name of the option, e.g. "blocks-text"
   */
  name: string;
  label: string;
};

/**
 * A field that stores the name of the selected block. A field in content data is only used for blocks by the content
 * types in `contentTypes`, while the paths of component config and mixins contain the application key, and are unique.
 */
export type BlockField = {
  field: string;
  contentTypes?: string[];
};

export type AppBlocks = {
  appKey: string;
  blocks: BlockDefinition[];
  fields: BlockField[];
};

export type BlockUsageBucket = {
  key: string;
  docCount: number;
};

type FormItemOptionSet = Extract<FormItem, { formItemType: "OptionSet" }>;

type FormWalkContext = {
  isBlocksOptionSet: (optionSet: FormItemOptionSet) => boolean;
  fragmentsByName: Record<string, SchemaWithForm>;
};

/**
 * The results of the terms aggregations in `queryBlockUsages`. The aggregations of data fields have a sub-aggregation
 * per content type.
 */
type TermsResult = {
  buckets: {
    key: string;
    docCount: number;
    blocks?: TermsResult;
  }[];
};

/**
 * Returns the blocks of an application, and the fields of its content types, components and mixins that store them.
 * Returns undefined if the application has no "blocks" form fragment.
 *
 * Lists the form fragments, content types and mixins of the application once. Pass in the components of the
 * application, that are already listed by the caller.
 */
export function getAppBlocks(
  appKey: string,
  componentsByType: Record<ComponentDescriptorType, ComponentDescriptor[]>,
): AppBlocks | undefined {
  const formFragments = listSchemasAsAdmin({ application: appKey, type: "FORM_FRAGMENT" });
  const fragmentsByName = indexFormFragments(formFragments);
  const blocksFragment = fragmentsByName[`${appKey}:${BLOCKS_FORM_FRAGMENT_NAME}`];
  const blocksOptionSet = blocksFragment
    ? findOptionSetsInForm(blocksFragment.form, BLOCKS_OPTION_SET_NAME)[0]
    : undefined;

  if (!blocksOptionSet) {
    return undefined;
  }

  const context: FormWalkContext = {
    isBlocksOptionSet: getIsBlocksOptionSet(blocksOptionSet.options.map((option) => option.name)),
    fragmentsByName,
  };
  const findBlockPaths = (form: FormItem[]): string[] => findBlocksPaths(form, context, []);

  return {
    appKey,
    blocks: blocksOptionSet.options.map((option) => ({
      name: option.name,
      label: option.label,
    })),
    fields: [
      ...getContentTypeBlockFields(listSchemasAsAdmin({ application: appKey, type: "CONTENT_TYPE" }), findBlockPaths),
      ...getComponentBlockFields(appKey, componentsByType, findBlockPaths),
      ...getMixinBlockFields(appKey, listSchemasAsAdmin({ application: appKey, type: "MIXIN" }), findBlockPaths),
    ],
  };
}

/**
 * Counts the content using each block of an application, with a single aggregation query across all the given repos.
 * The bucket keys are "<app key>:<block name>".
 *
 * Each field has its own terms aggregation, and the counts are summed. A content that uses the same block in more than
 * one field (e.g. in its data and in a part) is counted once per field.
 */
export function queryBlockUsages(
  repoIds: string[],
  appBlocks: AppBlocks,
  principals: PrincipalKey[],
): BlockUsageBucket[] {
  if (appBlocks.fields.length === 0) {
    return [];
  }

  const res = multiRepoConnect({
    sources: repoIds.map((repoId) => ({
      repoId,
      branch: "draft",
      principals,
    })),
  }).query({
    count: 0,
    aggregations: fromEntries(
      appBlocks.fields.map((field, index) => [getAggregationName(index), toAggregation(field)]),
    ),
    filters: [
      getAnyBlockFilter(appBlocks.fields),
      {
        notExists: {
          field: "archivedTime",
        },
      },
    ],
  });

  const results = res.aggregations as unknown as Record<string, TermsResult>;
  const buckets = flatMap(appBlocks.fields, (field, index) =>
    getFieldBuckets(field, results[getAggregationName(index)]),
  );
  const bucketsByKey = groupBy(buckets, (bucket) => bucket.key);

  return objectKeys(bucketsByKey).map((key) => ({
    key: `${appBlocks.appKey}:${key}`,
    docCount: bucketsByKey[key].reduce((sum, bucket) => sum + bucket.docCount, 0),
  }));
}

/**
 * Matches the content that uses the block in any of the fields of the application. Returns undefined if there is no
 * block name, or the application does not use the blocks anywhere (an empty "should" would match all content).
 */
export function getBlockUsageFilter(appBlocks: AppBlocks, blockName: string | undefined): Filter | undefined {
  return blockName && appBlocks.fields.length > 0
    ? {
        boolean: {
          should: appBlocks.fields.map((field) =>
            getBlockFieldFilter(field, { hasValue: { field: field.field, values: [blockName] } }),
          ),
        },
      }
    : undefined;
}

/**
 * Matches the content that uses any block in any of the fields
 */
function getAnyBlockFilter(fields: BlockField[]): Filter {
  return {
    boolean: {
      should: fields.map((field) => getBlockFieldFilter(field, { exists: { field: field.field } })),
    },
  };
}

/**
 * Fields in content data only match the content types that use the field for blocks
 */
function getBlockFieldFilter(field: BlockField, valueFilter: Filter): Filter {
  return field.contentTypes
    ? {
        boolean: {
          must: [{ hasValue: { field: "type", values: field.contentTypes } }, valueFilter],
        },
      }
    : valueFilter;
}

function getAggregationName(index: number): string {
  return `field${index}`;
}

/**
 * Fields in content data are counted per content type, so only the content types that use the field for blocks are
 * counted. Other content in the query (matched by another field) can have the same field for something else.
 */
function toAggregation(field: BlockField): TermsAggregation {
  const blocksAggregation: TermsAggregation = {
    terms: {
      field: field.field,
      size: AGGREGATION_SIZE,
    },
  };

  return field.contentTypes
    ? {
        terms: {
          field: "type",
          size: AGGREGATION_SIZE,
        },
        aggregations: {
          blocks: blocksAggregation,
        },
      }
    : blocksAggregation;
}

function getFieldBuckets(field: BlockField, result: TermsResult | undefined): BlockUsageBucket[] {
  const buckets = result?.buckets ?? [];
  const contentTypes = field.contentTypes;

  return contentTypes
    ? flatMap(
        buckets.filter((typeBucket) => includesIgnoreCase(contentTypes, typeBucket.key)),
        (typeBucket) => typeBucket.blocks?.buckets ?? [],
      )
    : buckets;
}

/**
 * Content data is stored in "data". Groups the content types by field, so each field is queried once.
 */
function getContentTypeBlockFields(
  contentTypes: SchemaWithForm[],
  findBlockPaths: (form: FormItem[]) => string[],
): BlockField[] {
  const fieldsWithContentType = flatMap(contentTypes, (contentType) =>
    findBlockPaths(contentType.form).map((path) => ({
      field: toSelectedField(`data.${path}`),
      contentType: contentType.name,
    })),
  );
  const contentTypesByField = groupBy(fieldsWithContentType, (item) => item.field);

  return objectKeys(contentTypesByField).map((field) => ({
    field,
    contentTypes: contentTypesByField[field].map((item) => item.contentType),
  }));
}

/**
 * Component config is stored in "components.<type>.config.<app key>.<component name>"
 */
function getComponentBlockFields(
  appKey: string,
  componentsByType: Record<ComponentDescriptorType, ComponentDescriptor[]>,
  findBlockPaths: (form: FormItem[]) => string[],
): BlockField[] {
  return flatMap(objectKeys(componentsByType), (type) =>
    flatMap(componentsByType[type], (component) =>
      findBlockPaths(component.form).map((path) => ({
        field: toSelectedField(
          `components.${type.toLowerCase()}.config.${toPropertyName(appKey)}.${toPropertyName(getName(component.key))}.${path}`,
        ),
      })),
    ),
  );
}

/**
 * Mixin data is stored in "x.<app key>.<mixin name>"
 */
function getMixinBlockFields(
  appKey: string,
  mixins: SchemaWithForm[],
  findBlockPaths: (form: FormItem[]) => string[],
): BlockField[] {
  return flatMap(mixins, (mixin) =>
    findBlockPaths(mixin.form).map((path) => ({
      field: toSelectedField(`x.${toPropertyName(appKey)}.${toPropertyName(getName(mixin.name))}.${path}`),
    })),
  );
}

function toSelectedField(optionSetPath: string): string {
  return `${optionSetPath}._selected`;
}

/**
 * XP replaces the dots in application keys and component and mixin names with dashes, when it uses them as property
 * names
 */
function toPropertyName(name: string): string {
  return name.replace(/\./g, "-");
}

/**
 * The name of a schema or component, without the application key
 */
function getName(key: string): string {
  return key.split(":")[1] ?? key;
}

function includesIgnoreCase(values: string[], value: string): boolean {
  return values.some((it) => it.toLowerCase() === value.toLowerCase());
}

/**
 * Form fragments can be included by their name with or without the application key
 */
function indexFormFragments(formFragments: SchemaWithForm[]): Record<string, SchemaWithForm> {
  return {
    ...indexBy(formFragments, (fragment) => getName(fragment.name)),
    ...indexBy(formFragments, (fragment) => fragment.name),
  };
}

/**
 * Finds the option sets with the given name in a form, also inside field sets
 */
function findOptionSetsInForm(form: FormItem[], name: string): FormItemOptionSet[] {
  return flatMap(form, (item) =>
    item.formItemType === "OptionSet" && item.name === name
      ? [item]
      : item.formItemType === "Layout"
        ? findOptionSetsInForm(item.items, name)
        : [],
  );
}

/**
 * The "blocks" option set from the form fragment, or a copy of it with some of its blocks (e.g. a form fragment for
 * front pages, that only allows some of the blocks). Option sets that have other options are not blocks.
 */
function getIsBlocksOptionSet(blockNames: string[]): (optionSet: FormItemOptionSet) => boolean {
  return (optionSet) =>
    optionSet.name === BLOCKS_OPTION_SET_NAME &&
    optionSet.options.every((option) => blockNames.indexOf(option.name) !== -1);
}

/**
 * Returns the paths (e.g. "blocks", "mySet.blocks" or "blocks.blocks-columns.blocks") of the blocks option sets in a
 * form, including the ones in included form fragments and inside other blocks
 */
function findBlocksPaths(form: FormItem[], context: FormWalkContext, fragmentStack: string[]): string[] {
  return flatMap(form, (item) => findBlocksPathsInItem(item, context, fragmentStack));
}

function findBlocksPathsInItem(item: FormItem, context: FormWalkContext, fragmentStack: string[]): string[] {
  switch (item.formItemType) {
    case "OptionSet": {
      const nestedPaths = flatMap(item.options, (option) =>
        prefixPaths(`${item.name}.${option.name}`, findBlocksPaths(option.items, context, fragmentStack)),
      );
      return context.isBlocksOptionSet(item) ? [item.name, ...nestedPaths] : nestedPaths;
    }
    case "ItemSet":
      return prefixPaths(item.name, findBlocksPaths(item.items, context, fragmentStack));
    case "Layout":
      return findBlocksPaths(item.items, context, fragmentStack);
    case "FormFragment": {
      const fragment = context.fragmentsByName[item.name];
      return fragment && canIncludeFormFragment(fragment.name, fragmentStack)
        ? findBlocksPaths(fragment.form, context, [...fragmentStack, fragment.name])
        : [];
    }
    default:
      return [];
  }
}

function canIncludeFormFragment(name: string, fragmentStack: string[]): boolean {
  return (
    fragmentStack.length < MAX_FORM_FRAGMENT_DEPTH &&
    fragmentStack.filter((it) => it === name).length < MAX_FORM_FRAGMENT_REPEATS
  );
}

function prefixPaths(prefix: string, paths: string[]): string[] {
  return paths.map((path) => `${prefix}.${path}`);
}

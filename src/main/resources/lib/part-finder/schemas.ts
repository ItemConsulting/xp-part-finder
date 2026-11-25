import type { FormItem } from "@enonic-types/core";
import { run } from "/lib/xp/context";
import {
  type GetDynamicComponentParams,
  getComponent,
  type LayoutDescriptor,
  type ListDynamicComponentsParams,
  type ListDynamicSchemasParams,
  listComponents,
  listSchemas,
  type PageDescriptor,
  type PartDescriptor,
} from "/lib/xp/schema";

/**
 * A content type, form fragment or mixin, with the fields part finder uses
 */
export type SchemaWithForm = {
  name: string;
  form: FormItem[];
};

/**
 * Lists the schemas of an application. Returns an empty list if they can not be listed (e.g. if a schema can not be
 * parsed), so the rest of the page still works.
 */
export function listSchemasAsAdmin(params: ListDynamicSchemasParams): SchemaWithForm[] {
  try {
    return run(
      {
        branch: "draft",
        principals: ["role:system.admin"],
      },
      () => listSchemas(params) as SchemaWithForm[],
    );
  } catch (e) {
    log.warning(`Could not list the schemas of type "${params.type}" in "${params.application}": ${e}`);
    return [];
  }
}

export function listComponentsAsAdmin(
  params: ListDynamicComponentsParams,
): PartDescriptor[] | LayoutDescriptor[] | PageDescriptor[] {
  return run(
    {
      branch: "draft",
      principals: ["role:system.admin"],
      ...params,
    },
    () => listComponents(params),
  );
}

export function getComponentAsAdmin(
  params: GetDynamicComponentParams,
): PartDescriptor | LayoutDescriptor | PageDescriptor | undefined {
  try {
    return run(
      {
        branch: "draft",
        principals: ["role:system.admin"],
      },
      () => getComponent(params) as PartDescriptor | LayoutDescriptor | PageDescriptor | undefined,
    );
  } catch (e) {
    log.warning(`Could not get component "${params.key}": ${e}`);
    return undefined;
  }
}

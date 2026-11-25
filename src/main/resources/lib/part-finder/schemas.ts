import { run } from "/lib/xp/context";
import {
  type GetDynamicComponentParams,
  getComponent,
  type LayoutDescriptor,
  type ListDynamicComponentsParams,
  listComponents,
  type PageDescriptor,
  type PartDescriptor,
} from "/lib/xp/schema";

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

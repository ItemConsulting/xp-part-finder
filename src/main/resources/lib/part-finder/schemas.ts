import {
  getComponent,
  listComponents,
  type LayoutDescriptor,
  type ListDynamicComponentsParams,
  type PageDescriptor,
  type PartDescriptor,
  type GetDynamicComponentParams,
} from "/lib/xp/schema";
import { run } from "/lib/xp/context";

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
  return getComponent(params) as PartDescriptor | LayoutDescriptor | PageDescriptor | undefined;
}

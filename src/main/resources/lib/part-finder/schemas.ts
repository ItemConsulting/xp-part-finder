import {
  listComponents,
  type LayoutDescriptor,
  type ListDynamicComponentsParams,
  type PageDescriptor,
  type PartDescriptor,
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

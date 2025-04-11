import { createRole, getPrincipal, type RoleKey } from "/lib/xp/auth";
import { run } from "/lib/xp/context";

export const PRINCIPAL_KEY_VIEWER: RoleKey = "role:no.item.partfinder.viewer";

run(
  {
    user: {
      idProvider: "system",
      login: "su",
    },
  },
  () => {
    if (getPrincipal(PRINCIPAL_KEY_VIEWER) === null) {
      createRole({
        displayName: "Part Finder Viewer",
        name: PRINCIPAL_KEY_VIEWER.split(":")[1],
      });

      log.info(`Created new principal: "${PRINCIPAL_KEY_VIEWER}"`);
    }
  },
);

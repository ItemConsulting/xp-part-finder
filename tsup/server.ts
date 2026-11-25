import { globSync } from "glob";
import type { Options } from ".";
import { AND_BELOW, DIR_SRC, DIR_SRC_ASSETS } from "./constants";
import { dict } from "./dict";

export default function buildServerConfig(): Options {
  const GLOB_EXTENSIONS_SERVER = "{ts,js}";
  const GLOB_CONFIG = {
    absolute: false,
    posix: true,
  };

  const FILES_SERVER = globSync(`${DIR_SRC}/${AND_BELOW}/*.${GLOB_EXTENSIONS_SERVER}`, {
    ...GLOB_CONFIG,
    ignore: globSync(`${DIR_SRC_ASSETS}/${AND_BELOW}/*.${GLOB_EXTENSIONS_SERVER}`, GLOB_CONFIG).concat(
      globSync("**/*.stories.ts"),
    ),
  });

  const SERVER_JS_ENTRY = dict(
    FILES_SERVER.map((k) => [
      k.replace(`${DIR_SRC}/`, "").replace(/\.[^.]*$/, ""), // name
      k,
    ]),
  );

  return {
    bundle: true,
    dts: false, // d.ts files are use useless at runtime
    entry: SERVER_JS_ENTRY,
    env: {
      BROWSER_SYNC_PORT: "3100",
    },
    esbuildOptions(options, _context) {
      // If you have libs with chunks, use this to avoid collisions
      options.chunkNames = "_chunks/[name]-[hash]";

      options.mainFields = ["module", "main"];
    },

    external: ["/lib/time", "/lib/freemarker", "/lib/turbo-streams", "/lib/enonic/asset", /^\/lib\/xp\//],
    format: "cjs",
    minify: false, // Minifying server files makes debugging harder
    // noExternal: [],
    platform: "neutral",

    silent: ["QUIET", "WARN"].includes(process.env.LOG_LEVEL_FROM_GRADLE || ""),

    shims: false,
    splitting: false,
    sourcemap: false,
    target: "es5",
    tsconfig: `${DIR_SRC}/tsconfig.json`,
  };
}

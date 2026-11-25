const { execSync } = require("node:child_process");
const { globSync } = require("glob");
const process = require("node:process");
const path = require("node:path");

const dir = process.argv[2];
const outDir = process.argv[3]; // destination directory

if (!dir || !outDir) {
  console.error("Usage: node tsup/build.js <srcDir> <outDir> [excludeDir]");
  process.exit(1);
}

const pattern = path.join(dir, "**/*.ts");

// Find all .ts files to build
const files = globSync(pattern, { nodir: true });

if (files.length === 0) {
  console.log(`No TypeScript files found in ${dir}. Skipping build.`);
  process.exit(0);
}

try {
  console.log(`Building TypeScript files from ${dir} → ${outDir}...`);
  execSync(`npx tsup -d "${outDir}"`, { stdio: "inherit" });
} catch (_e) {
  process.exit(1);
}

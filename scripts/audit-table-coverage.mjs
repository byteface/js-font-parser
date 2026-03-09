import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const tableFile = path.join(repoRoot, "src", "table", "Table.ts");
const factoryFile = path.join(repoRoot, "src", "table", "TableFactory.ts");

const tableSrc = fs.readFileSync(tableFile, "utf8");
const factorySrc = fs.readFileSync(factoryFile, "utf8");
const liveFactorySrc = factorySrc.split("/*")[0];

const platformMarker = tableSrc.indexOf("// Platform IDs");
const tableRegion = platformMarker >= 0 ? tableSrc.slice(0, platformMarker) : tableSrc;

const tableNameRegex = /static readonly ([A-Za-z0-9_]+)\s*=\s*0x[0-9A-Fa-f]+/g;
const defined = new Set();
for (const match of tableRegion.matchAll(tableNameRegex)) {
  defined.add(match[1]);
}

const caseRegex = /case Table\.([A-Za-z0-9_]+)\s*:/g;
const wired = new Set();
for (const match of liveFactorySrc.matchAll(caseRegex)) {
  wired.add(match[1]);
}

const definedList = Array.from(defined).sort();
const wiredList = Array.from(wired).sort();
const missing = definedList.filter(name => !wired.has(name));

console.log("Table coverage audit");
console.log(`Defined table tags: ${definedList.length}`);
console.log(`Factory-wired tags: ${wiredList.length}`);
console.log(`Missing from factory: ${missing.length}`);

if (missing.length) {
  console.log("\nMissing tags:");
  for (const tag of missing) {
    console.log(`- ${tag}`);
  }
}

console.log("\nWired tags:");
for (const tag of wiredList) {
  console.log(`- ${tag}`);
}

process.exit(missing.length ? 1 : 0);

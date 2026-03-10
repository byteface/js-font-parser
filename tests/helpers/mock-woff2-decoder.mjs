import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function decode(_bytes) {
  return fs.readFileSync(path.resolve(__dirname, "../../truetypefonts/curated/FiraSans-Regular.ttf"));
}

export default { decode };


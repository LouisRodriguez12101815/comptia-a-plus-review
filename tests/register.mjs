import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const path = resolve(root, specifier.slice(2));
      if (existsSync(path + ".ts")) return next(pathToFileURL(path + ".ts").href, context);
    }
    return next(specifier, context);
  },
});

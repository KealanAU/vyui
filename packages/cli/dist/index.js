#!/usr/bin/env node

// src/index.ts
import { parseArgs } from "util";
import { resolve as resolve3 } from "path";

// src/config.ts
import { existsSync as existsSync2, readFileSync as readFileSync2, writeFileSync } from "fs";
import { isAbsolute, join as join2, resolve } from "path";

// src/utils.ts
import { existsSync, readFileSync } from "fs";
import { spawn } from "child_process";
import { createInterface } from "readline/promises";
import { dirname, join } from "path";
var colorEnabled = (() => {
  if (process.env.FORCE_COLOR) return true;
  if (process.env.NO_COLOR) return false;
  return Boolean(process.stdout.isTTY);
})();
var wrap = (code) => (s) => colorEnabled ? `\x1B[${code}m${s}\x1B[0m` : s;
var c = {
  bold: wrap(1),
  dim: wrap(2),
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  cyan: wrap(36),
  gray: wrap(90)
};
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var log = {
  info: (m) => console.log(`${c.cyan("\u2139")} ${m}`),
  ok: (m) => console.log(`${c.green("\u2714")} ${m}`),
  warn: (m) => console.log(`${c.yellow("\u26A0")} ${m}`),
  err: (m) => console.error(`${c.red("\u2716")} ${m}`),
  step: (m) => console.log(`${c.gray("\u2502")} ${m}`)
};
async function confirm(question, fallback = true) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = (await rl.question(`${c.cyan("?")} ${question} ${c.dim(fallback ? "(Y/n)" : "(y/N)")} `)).trim().toLowerCase();
    if (!ans) return fallback;
    return ans === "y" || ans === "yes";
  } finally {
    rl.close();
  }
}
async function prompt(question, fallback) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = (await rl.question(`${c.cyan("?")} ${question} ${c.dim(`(${fallback})`)} `)).trim();
    return ans || fallback;
  } finally {
    rl.close();
  }
}
function pmFromField(value) {
  if (typeof value !== "string") return void 0;
  const name = value.split("@")[0];
  if (name === "pnpm" || name === "yarn" || name === "bun" || name === "npm") return name;
  return void 0;
}
function detectPackageManager(cwd) {
  let dir = cwd;
  for (; ; ) {
    if (existsSync(join(dir, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(dir, "yarn.lock"))) return "yarn";
    if (existsSync(join(dir, "bun.lockb")) || existsSync(join(dir, "bun.lock"))) return "bun";
    if (existsSync(join(dir, "package-lock.json"))) return "npm";
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const pm = pmFromField(pkg.packageManager);
        if (pm) return pm;
      } catch {
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "npm";
}
function installDeps(pm, deps, cwd) {
  const args = pm === "npm" ? ["install", ...deps] : ["add", ...deps];
  const command = process.platform === "win32" ? `${pm}.cmd` : pm;
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise() : reject(new Error(`${pm} ${args[0]} exited with ${code}`)));
  });
}

// src/config.ts
var CONFIG_FILE = "vyui.config.json";
var DEFAULT_REGISTRY = "https://vyui.dev/r";
var DEFAULT_STYLE = "default";
var BASE_COLORS = ["slate", "gray", "zinc", "neutral", "stone"];
var DEFAULT_BASE_COLOR = "slate";
function configPath(cwd) {
  return join2(cwd, CONFIG_FILE);
}
function parseJsonc(text) {
  let out = "";
  let inStr = false;
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inStr) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i++;
      } else if (ch === quote) {
        inStr = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
      continue;
    }
    out += ch;
  }
  out = out.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(out);
  } catch {
    return void 0;
  }
}
function detectTsconfigAlias(cwd) {
  for (const file of ["tsconfig.json", "jsconfig.json"]) {
    const p = join2(cwd, file);
    if (!existsSync2(p)) continue;
    const parsed = parseJsonc(readFileSync2(p, "utf8"));
    const paths = parsed?.compilerOptions?.paths;
    if (!paths) continue;
    for (const [key, targets] of Object.entries(paths)) {
      if (!key.endsWith("/*")) continue;
      const target = targets?.[0];
      if (!target) continue;
      const prefix = key.slice(0, -2);
      const srcDir = target.replace(/\/\*$/, "").replace(/^\.\//, "") || ".";
      return { prefix, srcDir };
    }
  }
  return void 0;
}
function hasPathsEntryForPrefix(cwd, prefix) {
  for (const file of ["tsconfig.json", "jsconfig.json"]) {
    const p = join2(cwd, file);
    if (!existsSync2(p)) continue;
    const parsed = parseJsonc(readFileSync2(p, "utf8"));
    const paths = parsed?.compilerOptions?.paths;
    if (!paths) continue;
    if (Object.keys(paths).some((k) => k === `${prefix}/*` || k === prefix)) return true;
  }
  return false;
}
function resolveRegistryBase(registry, cwd) {
  if (/^https?:\/\//.test(registry) || registry.startsWith("file:") || isAbsolute(registry)) return registry.replace(/\/$/, "");
  return resolve(cwd, registry);
}
function styleRegistry(config, cwd = process.cwd()) {
  return `${resolveRegistryBase(config.registry, cwd)}/${config.style}`;
}
function resolveStyleRegistry(cwd, flags) {
  const config = readConfig(cwd);
  const base = resolveRegistryBase(flags.registry ?? config?.registry ?? DEFAULT_REGISTRY, cwd);
  const style = flags.style ?? config?.style ?? DEFAULT_STYLE;
  return `${base}/${style}`;
}
function readConfig(cwd) {
  const p = configPath(cwd);
  if (!existsSync2(p)) return void 0;
  let value;
  try {
    value = JSON.parse(readFileSync2(p, "utf8"));
  } catch {
    throw new Error(`Invalid ${CONFIG_FILE}: expected valid JSON`);
  }
  if (!isVyuiConfig(value)) {
    throw new Error(`Invalid ${CONFIG_FILE}: missing required registry, style, baseColor, aliases, paths, or tailwind fields`);
  }
  return value;
}
function writeConfig(cwd, config) {
  writeFileSync(configPath(cwd), `${JSON.stringify(config, null, 2)}
`);
}
function defaultConfig(registry, style, srcDir, prefix, baseColor, detected) {
  const a = (sub) => `${prefix}/${sub}`;
  const p = (sub) => join2(srcDir, sub);
  return {
    $schema: "https://vyui.dev/schema.json",
    registry,
    style,
    baseColor,
    aliases: {
      components: a("components/vyui"),
      lib: a("lib/vyui"),
      theme: a("lib/vyui/theme"),
      composables: a("lib/vyui/composables"),
      utils: a("lib/vyui/utils")
    },
    paths: {
      components: p("components/vyui"),
      lib: p("lib/vyui"),
      theme: p("lib/vyui/theme"),
      composables: p("lib/vyui/composables"),
      utils: p("lib/vyui/utils")
    },
    tailwind: {
      config: detected?.tailwindConfig ?? "tailwind.config.js",
      css: detected?.css ?? join2(srcDir, "style.css")
    }
  };
}
function hasStringKeys(value, keys) {
  return isRecord(value) && keys.every((key) => typeof value[key] === "string" && value[key].length > 0);
}
function isVyuiConfig(value) {
  if (!isRecord(value)) return false;
  const categories = ["components", "lib", "theme", "composables", "utils"];
  return typeof value.registry === "string" && typeof value.style === "string" && typeof value.baseColor === "string" && hasStringKeys(value.aliases, categories) && hasStringKeys(value.paths, categories) && hasStringKeys(value.tailwind, ["config", "css"]);
}

// src/commands/init.ts
import { existsSync as existsSync5 } from "fs";
import { join as join5 } from "path";

// src/project-info.ts
import { existsSync as existsSync3, readFileSync as readFileSync3, readdirSync } from "fs";
import { join as join3, relative } from "path";
var APP_ENTRIES = ["src/index.ts", "src/main.ts", "src/index.js", "src/main.js"];
var TAILWIND_CONFIGS = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs"];
var CSS_ENTRIES = ["src/index.css", "src/style.css", "src/main.css", "src/app.css"];
function detectProject(cwd) {
  const alias = detectTsconfigAlias(cwd);
  const packageJson = existsSync3(join3(cwd, "package.json")) ? "package.json" : void 0;
  const pkg = packageJson ? readJson(join3(cwd, packageJson)) : void 0;
  const deps = {
    ...isRecord(pkg?.dependencies) ? pkg.dependencies : {},
    ...isRecord(pkg?.devDependencies) ? pkg.devDependencies : {}
  };
  const appEntry = firstExisting(cwd, APP_ENTRIES) ?? findSourceFile(cwd, /\bcreateApp\s*\(/);
  const tailwindConfig = firstExisting(cwd, TAILWIND_CONFIGS);
  const css = detectCss(cwd, appEntry);
  return {
    cwd,
    packageJson,
    appEntry,
    tailwindConfig,
    css,
    sourceDir: alias?.srcDir ?? (existsSync3(join3(cwd, "src")) ? "src" : "."),
    alias,
    isVueLynx: "vue-lynx" in deps || Boolean(appEntry && readFileSync3(join3(cwd, appEntry), "utf8").includes("vue-lynx"))
  };
}
function detectCss(cwd, appEntry) {
  if (appEntry) {
    const source = readFileSync3(join3(cwd, appEntry), "utf8");
    for (const match of source.matchAll(/import\s+['"](.+?\.css)['"]/g)) {
      const candidate = join3(appEntry, "..", match[1]);
      const normalized = relative(cwd, join3(cwd, candidate));
      if (existsSync3(join3(cwd, normalized))) return normalized;
    }
  }
  return firstExisting(cwd, CSS_ENTRIES);
}
function firstExisting(cwd, candidates) {
  return candidates.find((candidate) => existsSync3(join3(cwd, candidate)));
}
function findSourceFile(cwd, pattern) {
  const src = join3(cwd, "src");
  if (!existsSync3(src)) return void 0;
  for (const name of readdirSync(src)) {
    if (!/\.[cm]?[jt]s$/.test(name)) continue;
    const path = join3(src, name);
    if (pattern.test(readFileSync3(path, "utf8"))) return relative(cwd, path);
  }
  return void 0;
}
function readJson(path) {
  try {
    const value = JSON.parse(readFileSync3(path, "utf8"));
    return isRecord(value) ? value : void 0;
  } catch {
    return void 0;
  }
}

// src/registry.ts
import { readFileSync as readFileSync4 } from "fs";
import { pathToFileURL } from "url";
var REGISTRY_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var PACKAGE_SPEC = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*@[a-z0-9.*+^~_-]+$/i;
var FILE_TYPES = /* @__PURE__ */ new Set([
  "registry:ui",
  "registry:component",
  "registry:theme",
  "registry:lib",
  "registry:style",
  "registry:preset"
]);
async function fetchItem(registry, name) {
  assertRegistryName(name);
  const value = await fetchJson(`${registry}/${name}.json`);
  const item = parseRegistryItem(value);
  if (item.name !== name) {
    throw new Error(`registry item name mismatch: requested "${name}", received "${item.name}"`);
  }
  return item;
}
async function fetchIndex(registry) {
  const value = await fetchJson(`${registry}/index.json`);
  if (!isRecord(value) || typeof value.registry !== "string" || !Array.isArray(value.components)) {
    throw new Error("invalid registry index");
  }
  const components = value.components.map((component) => {
    if (!isRecord(component) || typeof component.name !== "string" || component.type !== "registry:ui" || !isStringArray(component.dependencies) || !isStringArray(component.registryDependencies)) {
      throw new Error("invalid registry index component");
    }
    assertRegistryName(component.name);
    assertPackageSpecs(component.dependencies);
    for (const name of component.registryDependencies) assertRegistryName(name);
    return component;
  });
  return {
    ...typeof value.$schema === "string" ? { $schema: value.$schema } : {},
    registry: value.registry,
    ...typeof value.style === "string" ? { style: value.style } : {},
    components
  };
}
async function fetchStyles(registryBase) {
  const value = await fetchJson(`${registryBase}/styles.json`);
  if (!isRecord(value) || typeof value.default !== "string" || !isStringArray(value.styles) || !value.styles.includes(value.default)) {
    throw new Error("invalid registry styles catalog");
  }
  assertRegistryName(value.default);
  for (const style of value.styles) assertRegistryName(style);
  return { default: value.default, styles: value.styles };
}
async function fetchJson(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`registry fetch failed (${res.status}): ${url}`);
    return res.json();
  }
  const file = url.startsWith("file:") ? new URL(url) : pathToFileURL(url);
  return JSON.parse(readFileSync4(file, "utf8"));
}
function assertRegistryName(name) {
  if (!REGISTRY_NAME.test(name)) {
    throw new Error(`invalid registry item name: ${JSON.stringify(name)}`);
  }
}
function parseRegistryItem(value) {
  if (!isRecord(value) || typeof value.name !== "string" || value.type !== "registry:ui" && value.type !== "registry:lib" || !isStringArray(value.dependencies) || value.registryDependencies !== void 0 && !isStringArray(value.registryDependencies) || !Array.isArray(value.files)) {
    throw new Error("invalid registry item");
  }
  assertRegistryName(value.name);
  assertPackageSpecs(value.dependencies);
  const registryDependencies = value.registryDependencies ?? [];
  for (const name of registryDependencies) assertRegistryName(name);
  return {
    name: value.name,
    type: value.type,
    dependencies: value.dependencies,
    registryDependencies,
    files: value.files.map(parseRegistryFile)
  };
}
function parseRegistryFile(value) {
  if (!isRecord(value) || typeof value.path !== "string" || typeof value.target !== "string" || typeof value.type !== "string" || !FILE_TYPES.has(value.type) || typeof value.content !== "string") {
    throw new Error("invalid registry file");
  }
  return value;
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function assertPackageSpecs(specs) {
  for (const spec of specs) {
    if (!PACKAGE_SPEC.test(spec)) {
      throw new Error(`invalid registry package specifier: ${JSON.stringify(spec)}`);
    }
  }
}
async function resolveItems(registry, names) {
  const seen = /* @__PURE__ */ new Map();
  const order = [];
  const state = /* @__PURE__ */ new Map();
  const visit = async (name) => {
    if (state.has(name)) return;
    state.set(name, "visiting");
    order.push(name);
    try {
      const item = await fetchItem(registry, name);
      seen.set(name, item);
      await Promise.all(item.registryDependencies.map(visit));
      state.set(name, "done");
    } catch (error) {
      state.delete(name);
      throw error;
    }
  };
  await Promise.all(names.map(visit));
  return order.map((name) => seen.get(name)).filter((item) => item !== void 0);
}

// src/update-project.ts
import { readFileSync as readFileSync5, writeFileSync as writeFileSync2 } from "fs";
import { join as join4 } from "path";
function planProjectUpdates(info, config) {
  const updates = [];
  const warnings = [];
  const pluginImport = `${config.aliases.lib}/plugin`;
  const styleImport = `${config.aliases.lib}/style.css`;
  const presetImport = relativePresetImport(config.tailwind.config, config.paths.lib);
  if (info.appEntry) {
    const before = readFileSync5(join4(info.cwd, info.appEntry), "utf8");
    let after = before;
    const hasVyuiBinding = /import\s+[^'"]*\bVyUI\b[^'"]*from\s+['"]/.test(after);
    if (!after.includes(pluginImport) && !hasVyuiBinding) after = insertAfterImports(after, `import { VyUI } from '${pluginImport}'`);
    if (hasVyuiBinding && !after.includes(pluginImport)) {
      warnings.push(`${info.appEntry} already imports VyUI from another package; replace that import with ${pluginImport} if migrating from @vyui/kit.`);
    }
    if (!after.includes(styleImport)) after = insertAfterImports(after, `import '${styleImport}'`);
    if (!/\.use\(\s*VyUI\b/.test(after)) {
      const appMatch = after.match(/const\s+(\w+)\s*=\s*createApp\([^\n]+\)\s*\n/);
      if (appMatch) {
        const insertion = `${appMatch[0]}${appMatch[1]}.use(VyUI)
`;
        after = after.replace(appMatch[0], insertion);
      } else {
        warnings.push(`Could not locate createApp() in ${info.appEntry}; register VyUI manually.`);
      }
    }
    if (after !== before) updates.push({ path: info.appEntry, before, after, description: "register VyUI and import its tokens" });
  } else {
    warnings.push(`Could not find the Vue-Lynx app entry; import ${pluginImport} and call app.use(VyUI) manually.`);
  }
  if (info.tailwindConfig) {
    const before = readFileSync5(join4(info.cwd, info.tailwindConfig), "utf8");
    let after = before;
    const importLine = `import vyuiPreset, { VYUI_UI_STATES } from '${presetImport}'`;
    const hasVyuiPresetBinding = /import\s+[^'"]*\bvyuiPreset\b[^'"]*from\s+['"]/.test(after);
    if (!after.includes("vyui-preset") && !hasVyuiPresetBinding) after = insertAfterImports(after, importLine);
    if (hasVyuiPresetBinding && !after.includes("vyui-preset")) {
      warnings.push(`${info.tailwindConfig} already imports a VyUI preset from another package; switch it to ${presetImport} if migrating from @vyui/kit.`);
    }
    if (!/\bvyuiPreset\b/.test(findPresetsExpression(after))) {
      if (/presets\s*:\s*\[/.test(after)) {
        after = after.replace(/presets\s*:\s*\[([^\]]*)\]/s, (full, inner) => `presets: [${inner.trim()}${inner.trim() ? ", " : ""}vyuiPreset]`);
      } else {
        warnings.push(`Could not find a presets array in ${info.tailwindConfig}; add vyuiPreset manually.`);
      }
    }
    if (!after.includes("VYUI_UI_STATES]") && after.includes("createLynxPreset()")) {
      after = after.replace("createLynxPreset()", `createLynxPreset({
  lynxUIPlugins: {
    uiVariants: {
      prefixes: defaults => ({
        ...defaults,
        ui: [...defaults.ui, ...VYUI_UI_STATES],
      }),
    },
  },
})`);
    } else if (!after.includes("...VYUI_UI_STATES") && after.includes("createLynxPreset({")) {
      if (!after.includes("lynxUIPlugins:")) {
        after = after.replace("createLynxPreset({", `createLynxPreset({
  lynxUIPlugins: {
    uiVariants: {
      prefixes: defaults => ({
        ...defaults,
        ui: [...defaults.ui, ...VYUI_UI_STATES],
      }),
    },
  },`);
      } else {
        warnings.push(`Add VYUI_UI_STATES to the existing createLynxPreset uiVariants configuration in ${info.tailwindConfig}.`);
      }
    }
    if (after !== before) updates.push({ path: info.tailwindConfig, before, after, description: "add the VyUI Tailwind preset" });
  } else {
    warnings.push(`Could not find tailwind.config.*; add ${presetImport} to your presets manually.`);
  }
  return { updates, warnings };
}
function applyProjectUpdates(plan, cwd, dryRun) {
  for (const update of plan.updates) {
    if (!dryRun) writeFileSync2(join4(cwd, update.path), update.after);
    log.step(`${dryRun ? c.cyan("plan") : c.green("edit")} ${update.path} ${c.dim(`(${update.description})`)}`);
  }
  for (const warning of plan.warnings) log.warn(warning);
}
function insertAfterImports(source, line) {
  const imports = [...source.matchAll(/^import[^\n]*\n/gm)];
  const last = imports.at(-1);
  if (!last || last.index === void 0) return `${line}
${source}`;
  const end = last.index + last[0].length;
  return `${source.slice(0, end)}${line}
${source.slice(end)}`;
}
function findPresetsExpression(source) {
  return source.match(/presets\s*:\s*\[[^\]]*\]/s)?.[0] ?? "";
}
function relativePresetImport(tailwindConfig, libPath) {
  const depth = tailwindConfig.split(/[\\/]/).length - 1;
  return `${depth === 0 ? "./" : "../".repeat(depth)}${libPath.replaceAll("\\", "/")}/vyui-preset.js`;
}

// src/write-files.ts
import { existsSync as existsSync4, mkdirSync, writeFileSync as writeFileSync3 } from "fs";
import { dirname as dirname2, isAbsolute as isAbsolute2, relative as relative2, resolve as resolve2, win32 } from "path";

// src/rewrite-imports.ts
var CATEGORY_PREFIXES = ["components", "theme", "composables", "utils", "lib"];
function rewriteImports(file, config) {
  let out = file.content;
  for (const category of CATEGORY_PREFIXES) {
    out = out.replaceAll(`@@vyui:${category}/`, `${config.aliases[category]}/`);
  }
  return out;
}

// src/write-files.ts
function destFor(file, config, projectRoot) {
  const { target, type } = file;
  switch (type) {
    case "registry:ui":
    case "registry:component":
      return safeDestination(projectRoot, config.paths.components, target);
    case "registry:theme":
      return safeDestination(projectRoot, config.paths.theme, stripPrefix(target, "theme"));
    case "registry:preset":
    case "registry:style":
      return safeDestination(projectRoot, config.paths.lib, target);
    case "registry:lib": {
      const [seg0, ...rest] = target.split("/");
      const tail = rest.join("/");
      switch (seg0) {
        case "composables":
          return safeDestination(projectRoot, config.paths.composables, tail);
        case "utils":
          return safeDestination(projectRoot, config.paths.utils, tail);
        case "theme":
          return safeDestination(projectRoot, config.paths.theme, tail);
        default:
          return safeDestination(projectRoot, config.paths.lib, target);
      }
    }
  }
}
function safeDestination(projectRoot, configuredRoot, target) {
  if (!target || target.includes("\0") || isAbsolute2(target) || win32.isAbsolute(target)) {
    throw new Error(`Unsafe registry target: ${JSON.stringify(target)}`);
  }
  const project = resolve2(projectRoot);
  const base = resolve2(project, configuredRoot);
  assertWithin(project, base, `Configured path "${configuredRoot}" escapes the project root`);
  const destination = resolve2(base, target);
  if (destination === base) {
    throw new Error(`Registry target "${target}" does not name a file`);
  }
  assertWithin(base, destination, `Registry target "${target}" escapes its destination directory`);
  return destination;
}
function assertWithin(parent, child, message) {
  const rel2 = relative2(parent, child);
  if (rel2 === ".." || rel2.startsWith(`..${win32.sep}`) || rel2.startsWith("../") || isAbsolute2(rel2)) {
    throw new Error(message);
  }
}
function stripPrefix(target, prefix) {
  return target.startsWith(`${prefix}/`) ? target.slice(prefix.length + 1) : target;
}
var VERBATIM = /* @__PURE__ */ new Set(["registry:preset", "registry:style"]);
function writeFiles(files, config, projectRoot, overwrite, dryRun = false, logSkipped = true) {
  const result = { written: [], skipped: [], planned: [] };
  for (const file of files) {
    const dest = destFor(file, config, projectRoot);
    if (existsSync4(dest) && !overwrite) {
      result.skipped.push(dest);
      if (logSkipped) log.step(`${c.yellow("skip")} ${rel(projectRoot, dest)} ${c.dim("(exists, use --overwrite)")}`);
      continue;
    }
    const rewritten = VERBATIM.has(file.type) ? file.content : rewriteImports(file, config);
    const content = rewritten.replaceAll("__VYUI_GRAY__", config.baseColor);
    if (dryRun) {
      result.planned.push(dest);
      log.step(`${c.cyan("plan")} ${rel(projectRoot, dest)}`);
      continue;
    }
    mkdirSync(dirname2(dest), { recursive: true });
    writeFileSync3(dest, content);
    result.written.push(dest);
    log.step(`${c.green("add ")} ${rel(projectRoot, dest)}`);
  }
  return result;
}
function rel(root, p) {
  return relative2(root, p);
}

// src/commands/init.ts
async function init(opts) {
  const { cwd } = opts;
  const existing = readConfig(cwd);
  let overwrite = opts.overwrite ?? false;
  if (existing && !overwrite && !opts.dryRun) {
    const go = !opts.yes && await confirm(`${configPath(cwd)} already exists. Reconfigure it?`, false);
    if (!go) {
      log.warn("Existing configuration left unchanged. Pass --overwrite to reconfigure.");
      return;
    }
    overwrite = true;
  }
  const registry = resolveRegistryBase(opts.registry ?? existing?.registry ?? DEFAULT_REGISTRY, cwd);
  let available;
  try {
    available = await fetchStyles(registry);
  } catch {
  }
  const fallbackStyle = available?.default ?? "default";
  let style = opts.style ?? fallbackStyle;
  if (!opts.style && !opts.yes && available && available.styles.length > 1) {
    style = await prompt(`Style? ${c.dim(`[${available.styles.join(", ")}]`)}`, fallbackStyle);
  }
  if (available && !available.styles.includes(style)) {
    log.err(`Unknown style "${style}". Available: ${available.styles.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  log.info(`Using style ${c.bold(style)}`);
  const project = detectProject(cwd);
  if (!project.packageJson && !opts.skipInstall) {
    throw new Error(`No package.json found in ${cwd}. Create one or pass --skip-install.`);
  }
  if (!project.isVueLynx) log.warn("Could not confirm this is a Vue-Lynx project. Continuing with generic Vue wiring.");
  if (project.appEntry) log.info(`Detected app entry ${c.cyan(project.appEntry)}`);
  if (project.tailwindConfig) log.info(`Detected Tailwind config ${c.cyan(project.tailwindConfig)}`);
  if (project.css) log.info(`Detected global CSS ${c.cyan(project.css)}`);
  const detected = project.alias ?? detectTsconfigAlias(cwd);
  if (detected) log.info(`Detected alias ${c.bold(`${detected.prefix}/*`)} \u2192 ${c.cyan(`${detected.srcDir}/`)} from tsconfig/jsconfig`);
  const defaultPrefix = detected?.prefix ?? "@";
  const defaultSrcDir = detected?.srcDir ?? (existsSync5(join5(cwd, "src")) ? "src" : ".");
  const prefix = opts.yes ? defaultPrefix : await prompt("Import alias prefix?", defaultPrefix);
  const srcDir = opts.yes ? defaultSrcDir : await prompt("Source directory?", defaultSrcDir);
  const baseColor = opts.baseColor ?? (opts.yes ? DEFAULT_BASE_COLOR : await prompt("Base gray color?", DEFAULT_BASE_COLOR));
  if (!BASE_COLORS.includes(baseColor)) {
    throw new Error(`Unknown base color "${baseColor}". Available: ${BASE_COLORS.join(", ")}`);
  }
  if (!hasPathsEntryForPrefix(cwd, prefix)) {
    log.warn(`No tsconfig/jsconfig "paths" entry found for "${prefix}/*". Imports may not resolve unless you have a matching bundler alias.`);
  }
  log.info("Fetching shared library (init payload)\u2026");
  const config = defaultConfig(registry, style, srcDir, prefix, baseColor, {
    tailwindConfig: project.tailwindConfig,
    css: project.css
  });
  const initItem = await fetchItem(styleRegistry(config), "init");
  const updatePlan = planProjectUpdates(project, config);
  log.info(opts.dryRun ? "Previewing changes\u2026" : "Applying project setup\u2026");
  writeFiles(initItem.files, config, cwd, overwrite, opts.dryRun);
  applyProjectUpdates(updatePlan, cwd, opts.dryRun ?? false);
  if (opts.dryRun) {
    log.ok("Dry run complete. No files were changed.");
    return;
  }
  if (!opts.skipInstall) {
    const pm = detectPackageManager(cwd);
    const go = opts.yes || await confirm(`Install ${initItem.dependencies.join(", ")} with ${c.bold(pm)}?`);
    if (go) {
      log.info(`Installing dependencies with ${pm}\u2026`);
      await installDeps(pm, initItem.dependencies, cwd);
      log.ok("Dependencies installed");
    }
  }
  writeConfig(cwd, config);
  log.ok(`Wrote ${c.cyan("vyui.config.json")}`);
  printNextSteps();
}
function printNextSteps() {
  log.ok("VyUI initialised.");
  console.log(`
  Add components: ${c.cyan("npx @vyui/cli add button")}
  Browse components: ${c.cyan("npx @vyui/cli list")}
`);
}

// src/commands/add.ts
async function add(opts) {
  const { cwd } = opts;
  let config = readConfig(cwd);
  if (!config) {
    if (opts.dryRun) throw new Error("No vyui.config.json found. Run `vyui init --dry-run` to preview setup first.");
    const go = opts.yes || process.stdin.isTTY && await confirm("No vyui.config.json found. Run `vyui init` now?");
    if (!go) {
      log.err("Run `vyui init` before adding components.");
      process.exitCode = 1;
      return;
    }
    await init({
      cwd,
      yes: opts.yes,
      skipInstall: opts.skipInstall,
      registry: opts.registry,
      style: opts.style,
      baseColor: opts.baseColor
    });
    config = readConfig(cwd);
    if (!config) return;
  }
  const registry = styleRegistry(config, cwd);
  log.info(`Style ${c.bold(config.style)}`);
  let names = [...new Set(opts.components.map((n) => n.toLowerCase()))];
  const index = await fetchIndex(registry);
  if (opts.all) {
    names = index.components.map((c2) => c2.name);
  }
  if (names.length === 0) {
    if (opts.yes || !process.stdin.isTTY) {
      log.err("Specify at least one component, or pass --all.");
      process.exitCode = 1;
      return;
    }
    console.log(index.components.map((component) => `  ${c.cyan("\u2022")} ${component.name}`).join("\n"));
    const answer = await prompt("Which components? (comma-separated)", "");
    names = answer.split(",").map((name) => name.trim().toLowerCase()).filter(Boolean);
    if (names.length === 0) return;
  }
  const available = index.components.map((component) => component.name);
  const unknown = names.filter((name) => !available.includes(name));
  if (unknown.length) {
    const hints = unknown.map((name) => {
      const suggestion = closest(name, available);
      return suggestion ? `"${name}" (did you mean "${suggestion}"?)` : `"${name}"`;
    });
    throw new Error(`Unknown component${unknown.length > 1 ? "s" : ""}: ${hints.join(", ")}. Available: ${available.join(", ")}`);
  }
  log.info(`Resolving ${names.join(", ")}\u2026`);
  const items = await resolveItems(registry, names);
  const resolvedNames = items.map((i) => i.name);
  const extra = resolvedNames.filter((n) => !names.includes(n));
  if (extra.length) log.info(`Pulling in dependencies: ${extra.join(", ")}`);
  const initItem = await fetchItem(registry, "init");
  const results = [writeFiles(initItem.files, config, cwd, false, opts.dryRun, false)];
  for (const item of items) {
    const requested = names.includes(item.name);
    results.push(writeFiles(item.files, config, cwd, Boolean(opts.overwrite && requested), opts.dryRun, requested));
  }
  const deps = dedupeDeps([...initItem.dependencies, ...items.flatMap((i) => i.dependencies)]);
  if (!opts.dryRun && !opts.skipInstall && deps.length) {
    const pm = detectPackageManager(cwd);
    const go = opts.yes || await confirm(`Install ${deps.join(", ")} with ${c.bold(pm)}?`);
    if (go) {
      log.info(`Installing dependencies with ${pm}\u2026`);
      await installDeps(pm, deps, cwd);
      log.ok("Dependencies installed");
    }
  }
  const written = results.reduce((total, result) => total + result.written.length, 0);
  const skipped = results.reduce((total, result) => total + result.skipped.length, 0);
  const planned = results.reduce((total, result) => total + result.planned.length, 0);
  log.ok(opts.dryRun ? `Dry run complete for ${c.bold(resolvedNames.join(", "))}: ${planned} file${planned === 1 ? "" : "s"} would be written, ${skipped} preserved.` : `Added ${c.bold(resolvedNames.join(", "))}: ${written} file${written === 1 ? "" : "s"} written, ${skipped} preserved.`);
}
function closest(input, choices) {
  let best;
  for (const name of choices) {
    const distance = levenshtein(input, name);
    if (!best || distance < best.distance) best = { name, distance };
  }
  return best && best.distance <= Math.max(2, Math.floor(input.length / 3)) ? best.name : void 0;
}
function levenshtein(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return rows[a.length][b.length];
}
function dedupeDeps(specs) {
  const byName = /* @__PURE__ */ new Map();
  for (const spec of specs) {
    const at = spec.lastIndexOf("@");
    const name = at > 0 ? spec.slice(0, at) : spec;
    const existing = byName.get(name);
    if (existing === void 0) {
      byName.set(name, spec);
    } else if (existing !== spec) {
      const existingRange = existing.slice(name.length + 1) || "(unpinned)";
      const newRange = spec.slice(name.length + 1) || "(unpinned)";
      log.warn(`Conflicting versions for ${c.bold(name)}: keeping ${c.bold(existingRange)}, ignoring ${newRange}.`);
    }
  }
  return [...byName.values()].sort();
}

// src/index.ts
var HELP = `${c.bold("vyui")} \u2014 add @vyui/kit styled components to your project

${c.bold("Usage")}
  vyui init [options]
  vyui add <component...> [options]
  vyui list [query] [options]
  vyui search [query] [options]
  vyui view <component...> [options]
  vyui info [options]
  vyui styles [options]

${c.bold("Commands")}
  init                 Set up vyui.config.json + shared library files
  add <component...>   Copy components (and their dependencies) into the project
  list [query]         List or search available components
  search [query]       Alias for list
  view <component...>  Print registry component source before installing
  info                 Show detected project and VyUI configuration
  styles               List the styles available in the registry

${c.bold("Options")}
  --registry <url>     Registry base URL (default https://vyui.dev/r)
  --style <name>       Style to use (init; default from the registry)
  --base-color <name>  Neutral/gray palette (init; e.g. slate, zinc, stone)
  --all                Add every component in the registry (add)
  --overwrite          Overwrite files that already exist
  --skip-install       Don't install npm dependencies
  --dry-run            Preview changes without writing files or installing
  --json               Emit machine-readable output (info)
  -y, --yes            Accept defaults / skip prompts
  --cwd <dir>          Run against another directory
  -h, --help           Show this help
`;
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      registry: { type: "string" },
      style: { type: "string" },
      "base-color": { type: "string" },
      all: { type: "boolean" },
      overwrite: { type: "boolean" },
      "skip-install": { type: "boolean" },
      "dry-run": { type: "boolean" },
      json: { type: "boolean" },
      yes: { type: "boolean", short: "y" },
      cwd: { type: "string" },
      help: { type: "boolean", short: "h" }
    }
  });
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return;
  }
  const cwd = resolve3(values.cwd ?? process.cwd());
  const common = {
    cwd,
    yes: values.yes,
    overwrite: values.overwrite,
    skipInstall: values["skip-install"],
    dryRun: values["dry-run"]
  };
  switch (command) {
    case "init":
      await init({ ...common, registry: values.registry, style: values.style, baseColor: values["base-color"] });
      break;
    case "add":
      await add({
        ...common,
        components: rest,
        all: values.all,
        registry: values.registry,
        style: values.style,
        baseColor: values["base-color"]
      });
      break;
    case "list":
    case "search": {
      const registry = resolveStyleRegistry(cwd, { registry: values.registry, style: values.style });
      const index = await fetchIndex(registry);
      const query = rest.join(" ").toLowerCase();
      const components = index.components.filter((component) => !query || component.name.includes(query));
      if (!components.length) throw new Error(`No components found${query ? ` for "${query}"` : ""}.`);
      log.info(`${components.length} component${components.length === 1 ? "" : "s"} in ${c.dim(registry)}:`);
      for (const component of components) {
        const deps = component.registryDependencies.length ? c.dim(` \u2192 ${component.registryDependencies.join(", ")}`) : "";
        console.log(`  ${c.cyan("\u2022")} ${component.name}${deps}`);
      }
      break;
    }
    case "view": {
      if (!rest.length) throw new Error("Specify at least one component to view.");
      const registry = resolveStyleRegistry(cwd, { registry: values.registry, style: values.style });
      for (const name of rest) {
        const item = await fetchItem(registry, name.toLowerCase());
        console.log(c.bold(`
# ${item.name}`));
        for (const file of item.files) {
          console.log(c.cyan(`
--- ${file.target} ---
`));
          console.log(file.content);
        }
      }
      break;
    }
    case "info": {
      const project = detectProject(cwd);
      const config = readConfig(cwd);
      const output = { project, config: config ?? null };
      if (values.json) {
        console.log(JSON.stringify(output, null, 2));
        break;
      }
      console.log(`${c.bold("Project")}
  directory:       ${cwd}
  Vue-Lynx:        ${project.isVueLynx ? "yes" : "not detected"}
  app entry:       ${project.appEntry ?? "not detected"}
  Tailwind config: ${project.tailwindConfig ?? "not detected"}
  global CSS:      ${project.css ?? "not detected"}
  import alias:    ${project.alias ? `${project.alias.prefix}/* \u2192 ${project.alias.srcDir}/*` : "not detected"}

${c.bold("VyUI")}
  initialized:     ${config ? "yes" : "no"}
  style:           ${config?.style ?? "\u2014"}
  base color:      ${config?.baseColor ?? "\u2014"}
  registry:        ${config?.registry ?? DEFAULT_REGISTRY}`);
      break;
    }
    case "styles": {
      const config = readConfig(cwd);
      const registry = resolveRegistryBase(values.registry ?? config?.registry ?? DEFAULT_REGISTRY, cwd);
      const current = config?.style;
      const { default: def, styles } = await fetchStyles(registry);
      log.info(`Styles available at ${c.dim(registry)}:`);
      for (const s of styles) {
        const tags = [s === def ? c.dim("(default)") : "", s === current ? c.green("(current)") : ""].filter(Boolean).join(" ");
        console.log(`  ${c.cyan("\u2022")} ${s} ${tags}`);
      }
      break;
    }
    default:
      log.err(`Unknown command: ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}
main().catch((err) => {
  log.err(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});

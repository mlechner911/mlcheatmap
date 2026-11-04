// Renders the handbook figures from the commands in demo/generate.sh, adjusted for reading in the
// handbook column, and writes the new aspect ratios into the chapters. Needs a built dist/.
//
// Usage: node book/generate-images.mjs [output directory, default book/images]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const COLUMN_WIDTH = 648; // Width of the handbook column in pixels.
const TARGET_FONT = 12; // Label size a reader should see, in pixels.
const MAX_FONT = 24;
const MIN_ANGLE = 22;
const COMPOSITE_MAX_FONT = 18; // Vertical weekday labels sit two rows apart and collide above this.
const DARK_ZERO = "--zero-color=#1e293b"; // Pushes itself in front of the data on a white page.

const outDir = process.argv[2] ?? "book/images";
mkdirSync(outDir, { recursive: true });

const script = readFileSync("demo/generate.sh", "utf8");
const commands = new Map();
for (const [, body, name] of script.matchAll(
  /node "\$SCRIPT_DIR\/generator\.js" \\\n([\s\S]*?)--out="\$OUTPUT_DIR\/([\w.-]+)\.svg"/g,
)) {
  const args = body
    .split("\n")
    .map((line) => line.trim().replace(/\s*\\$/, ""))
    .filter(Boolean)
    .map((arg) => arg.replace(/="(.*)"$/, "=$1"));
  commands.set(name, args);
}

function adjust(args) {
  const joined = args.join(" ");
  const isStyled = joined.includes("--row-label-");
  const isComposite = /preset=(sixmonths-split|multimonth)/.test(joined);
  const hasNegativeSurface = joined.includes("preset=mesh-terrain");
  const isSurface = !hasNegativeSurface && /preset=month-mesh|shape=mesh/.test(joined);
  const angle = Number(/--angle=(\d+)/.exec(joined)?.[1] ?? 30);

  const result = args.filter((arg) => arg.replace(/"/g, "") !== DARK_ZERO && !arg.startsWith("--label-pos="));
  result.push("--no-title"); // The caption says it, and scaling makes a fixed title too big or too small.
  // Labels behind tall bars get hidden. On a surface, labels in front would lie on top of it.
  if (!isComposite) result.push(`--label-pos=${isSurface ? "behind" : "front"}`);
  // At a flat angle the rows sit too close for their labels.
  if (angle < MIN_ANGLE) {
    result.splice(result.findIndex((arg) => arg.startsWith("--angle=")), 1, `--angle=${MIN_ANGLE}`);
  }
  // Badges stay upright, plain labels run along the axis.
  if (!joined.includes("--row-label-bg")) result.push("--label-mode=axis");
  // Composites are crowded: month names only, and every other weekday, in a larger size.
  if (isComposite) result.push("--month-labels-only", "--row-label-interval=2");
  else result.push("--col-label-interval=auto", "--clear-negative-labels");
  if (isStyled) result.push("--padding=48"); // Their labels are wider than the layout assumes.
  return result;
}

function measure(svg) {
  const [, width, height] = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(svg).map(Number);
  const fonts = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((match) => Number(match[1]));
  const smallest = fonts.length > 0 ? Math.min(...fonts) : Number.POSITIVE_INFINITY;
  // The handbook scales every figure to the column, up as well as down.
  return { width, height, shown: smallest * (COLUMN_WIDTH / width) };
}

const figures = readdirSync("book/images")
  .filter((file) => file.endsWith(".svg"))
  .map((file) => file.slice(0, -".svg".length))
  .filter((name) => commands.has(name));
const ratios = new Map();

for (const name of figures) {
  const args = commands.get(name);
  if (!args) throw new Error(`No command for ${name} in demo/generate.sh`);
  const out = join(outDir, `${name}.svg`);
  let font = 6;
  let result;
  while (true) {
    // A fixed size in a figure's own label style has to grow along, or it stays the smallest text.
    const sized = adjust(args).map((arg) =>
      arg.startsWith("--row-label-font-size=") ? `--row-label-font-size=${font}` : arg,
    );
    execFileSync("node", ["demo/generator.js", ...sized, `--label-font-size=${font}`, `--out=${out}`], {
      stdio: "ignore",
    });
    result = measure(readFileSync(out, "utf8"));
    const limit = /preset=(sixmonths-split|multimonth)/.test(args.join(" ")) ? COMPOSITE_MAX_FONT : MAX_FONT;
    if (result.shown >= TARGET_FONT || font >= limit) break;
    font += 1;
  }
  ratios.set(name, result.width / result.height);
  console.log(`${name}: font ${font}, shown ${result.shown.toFixed(1)}px, ${Math.round(result.width)}x${Math.round(result.height)}`);
}

// The figure for the date chapter uses the preset the way its readers would.
const { presets } = await import(pathToFileURL(resolve("dist/presets.es.js")).href);
const september = Array.from({ length: 30 }, (_, i) => ({
  date: `2026-09-${String(i + 1).padStart(2, "0")}`,
  value: Math.round(14 + 6 * Math.sin(i / 3) + (i % 7 >= 5 ? -4 : 2)),
}));
const grid = presets.aggregateCalendarMonth(september, { year: 2026, month: 8, startOfWeek: 1, weekLabel: (week) => `Week ${week}` });
for (let font = 6; font <= MAX_FONT; font += 1) {
  const svg = grid.render({ colorScheme: "emerald", labelFontSize: font });
  const result = measure(svg.replace(/<text[^>]*font-weight="bold"[^>]*>.*?<\/text>/g, ""));
  if (result.shown >= TARGET_FONT || font === MAX_FONT) {
    writeFileSync(join(outDir, "calendar_month_september.svg"), svg);
    ratios.set("calendar_month_september", result.width / result.height);
    console.log(`calendar_month_september: font ${font}, shown ${result.shown.toFixed(1)}px`);
    break;
  }
}

if (outDir === "book/images") {
  for (const language of ["en", "de"]) {
    const dir = join("book", language, "chapters");
    for (const file of readdirSync(dir)) {
      const path = join(dir, file);
      const text = readFileSync(path, "utf8").replace(
        /(images\/([\w.-]+)\.svg" style="width:100%;aspect-ratio:)[\d.]+/g,
        (match, start, name) => (ratios.has(name) ? `${start}${ratios.get(name).toFixed(3)}` : match),
      );
      writeFileSync(path, text);
    }
  }
}

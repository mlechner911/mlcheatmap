/**
 * The handbook: code that does not run would teach readers wrong usage.
 */
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const workDir = mkdtempSync(resolve('node_modules/.book-snippets-'));
afterAll(() => rmSync(workDir, { recursive: true, force: true }));

const IMPORT = /^import .*;$/gm;

function chapter(language: string, file: string): string {
  return readFileSync(join('book', language, 'chapters', file), 'utf8');
}

describe.each(['en', 'de'])('handbook %s', (language) => {
  const files = readdirSync(join('book', language, 'chapters')).filter((file) => file.endsWith('.md'));

  it.each(files)('%s only shows figures that exist', (file) => {
    for (const [, name] of chapter(language, file).matchAll(/images\/([\w.-]+\.svg)/g)) {
      expect(existsSync(join('book/images', name)), name).toBe(true);
    }
  });

  const withCode = files.filter((file) => chapter(language, file).includes('```typescript'));

  it.each(withCode)('%s runs from top to bottom', async (file) => {
    const blocks = [...chapter(language, file).matchAll(/```typescript\n([\s\S]*?)```/g)].map((m) => m[1]);
    const imports = new Set(blocks.flatMap((block) => block.match(IMPORT) ?? []));
    const bodies = blocks.map((block) => block.replace(IMPORT, '').trim());
    // A chapter may show a call on a `grid` from an earlier chapter.
    const needsGrid = bodies.some((body) => /\bgrid\./.test(body)) && !/\b(const|let) grid\b/.test(bodies.join('\n'));
    const source = [
      ...(needsGrid
        ? [`import { HeatmapGrid } from ${JSON.stringify(resolve('src/index.ts'))};`, 'const grid = new HeatmapGrid(2, 2);']
        : []),
      ...[...imports].map((line) =>
        line
          .replace("'mlc-isometric-heatmap/presets'", JSON.stringify(resolve('src/presets.ts')))
          .replace("'mlc-isometric-heatmap'", JSON.stringify(resolve('src/index.ts'))),
      ),
      // Blocks build on earlier ones, but may reuse names like `grid`.
      ...bodies.map((body, index) => (index === 0 ? body : `{\n${body}\n}`)),
    ].join('\n');
    const target = join(workDir, `${language}-${file.replace(/\W+/g, '-')}.ts`);
    writeFileSync(target, source);
    await expect(import(/* @vite-ignore */ target)).resolves.toBeDefined();
  });
});

describe('the date chapter', () => {
  it.each(['en', 'de'])('leads with calendars from dates in %s', (language) => {
    const text = chapter(language, '05_zeitreihen.md');
    expect(text).toContain('aggregateCalendarMonth');
    expect(text).toContain('calendar_month_september.svg');
    expect(text).toContain('play.mlcgo.eu/isometric-heatmap/calendar-month');
  });
});

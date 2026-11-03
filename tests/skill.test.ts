/**
 * The agent skill: an example that no longer runs would teach assistants wrong code.
 */
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const root = resolve('skills/mlc-isometric-heatmap');
const files = [
  join(root, 'SKILL.md'),
  ...readdirSync(join(root, 'references')).map((name) => join(root, 'references', name)),
];
const workDir = mkdtempSync(resolve('node_modules/.skill-snippets-'));
afterAll(() => rmSync(workDir, { recursive: true, force: true }));

describe('SKILL.md', () => {
  const text = readFileSync(join(root, 'SKILL.md'), 'utf8');

  it('has the frontmatter agents read', () => {
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? '';
    expect(frontmatter).toMatch(/^name: mlc-isometric-heatmap$/m);
    const description = /^description: (.*)$/m.exec(frontmatter)?.[1] ?? '';
    expect(description.length).toBeGreaterThan(50);
    expect(description.length).toBeLessThanOrEqual(1024);
  });

  it('links only to files that exist', () => {
    for (const [, target] of text.matchAll(/\]\(([^)#]+\.md)\)/g)) {
      expect(existsSync(resolve(dirname(join(root, 'SKILL.md')), target)), target).toBe(true);
    }
  });
});

describe('code examples', () => {
  const examples = files.flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/```ts\n([\s\S]*?)```/g)].map((match, index) => ({
      name: `${file.split('/').pop()} #${index + 1}`,
      code: match[1],
    })),
  );

  it('exist', () => {
    expect(examples.length).toBeGreaterThanOrEqual(5);
  });

  it.each(examples)('$name runs and draws an SVG', async ({ name, code }) => {
    const redirected = code
      .replaceAll('"mlc-isometric-heatmap/presets"', JSON.stringify(resolve('src/presets.ts')))
      .replaceAll('"mlc-isometric-heatmap"', JSON.stringify(resolve('src/index.ts')));
    const file = join(workDir, `${name.replace(/\W+/g, '-')}.ts`);
    writeFileSync(file, `${redirected}\nexport const result = typeof svg === "undefined" ? svgs : svg;\n`);
    const { result } = await import(/* @vite-ignore */ file);
    expect(String(result)).toContain('<');
  });
});

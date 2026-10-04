import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const json = async (path) => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));
const text = async (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('repository contract freezes independent Arena identity and provenance', async () => {
  const pkg = await json('package.json');
  assert.equal(pkg.name, '@whitechronos/arena-mcp-runtime');
  assert.equal(pkg.version, '1.2.0');
  assert.equal(pkg.engines.node, '>=22 <23');

  const runtime = await json('runtime-contract.json');
  assert.equal(runtime.contract_version, 'whitechronos-runtime/v1');
  assert.equal(runtime.component, 'arena');
  assert.equal(runtime.component_version, '1.2.0');
  assert.equal(runtime.plugin_name, 'github-arena');
  assert.deepEqual(runtime.tool_contract, [
    'arena_plan', 'arena_cards', 'arena_rubric', 'arena_review_checklist'
  ]);

  const source = await json('provenance/source-lock.json');
  assert.equal(source.source_repository, 'WhiteChronos/ChatGPT');
  assert.equal(source.source_commit, 'ef3b5fd77ab96dc3c0950725cd6f5c57b49a8988');
  assert.equal(source.source_path, 'plugins/github-arena');
  assert.equal(source.source_plugin_version, '1.1.0');
  assert.equal(source.upstream_repository, 'https://github.com/Jakeschincariol/arena-skill');
  assert.equal(source.upstream_license, 'MIT');

  const license = await text('LICENSE');
  assert.match(license, /MIT License/);
});

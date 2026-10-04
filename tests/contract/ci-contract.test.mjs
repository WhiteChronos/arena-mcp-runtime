import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('CI verifies the independent Arena runtime without deployment or live-host claims', async()=>{
  const text=await readFile(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');
  for(const required of [
    'npm ci',
    'npm test',
    'node scripts/generate-compat-manifests.mjs --check',
    'node scripts/healthcheck-stdio.mjs',
    'node scripts/healthcheck-http.mjs',
    'node scripts/check-skill-package.mjs'
  ]) assert.ok(text.includes(required),`missing CI command: ${required}`);
  assert.equal(text.includes('deploy'),false);
  assert.equal(text.includes('LIVE_VERIFIED'),false);
  assert.equal(text.includes('host discovery'),false);
});

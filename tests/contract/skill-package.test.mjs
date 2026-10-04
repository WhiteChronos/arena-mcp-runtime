import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const skill = new URL('../../skills/github-arena/', import.meta.url);
test('GitHub Arena skill is self-contained in the independent repository', async()=>{
  const text=await readFile(new URL('SKILL.md',skill),'utf8');
  assert.match(text,/^---\nname: github-arena\n/m);
  assert.doesNotMatch(text,/WhiteChronos\/ChatGPT\/plugins\/github-arena/);
  assert.match(text,/Never claim that independent agents ran unless the runtime actually executed them\./);
  await access(new URL('agents/openai.yaml',skill));
  for(const p of ['references/upstream.md','references/chatgpt-adaptation.md','references/rubric.md','references/codex-global.md','scripts/arena_review.py','scripts/install_codex_global.py']) await access(new URL(p,skill));
});

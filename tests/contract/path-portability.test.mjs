import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('stdio healthcheck works when plugin root contains spaces', async()=>{
  const root=await mkdtemp(join(tmpdir(),'arena runtime '));
  await cp('scripts/healthcheck-stdio.mjs',join(root,'scripts/healthcheck-stdio.mjs'),{recursive:false});
  await cp('src',join(root,'src'),{recursive:true});
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  const run=spawnSync(process.execPath,['scripts/healthcheck-stdio.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);
  const payload=JSON.parse(run.stdout.trim());
  assert.equal(payload.tools_list,'PASS');
});

#!/usr/bin/env node
import { access, readFile, mkdtemp } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const skillRoot=resolve('skills/github-arena');
const skillMd=await readFile(resolve(skillRoot,'SKILL.md'),'utf8');
if(!skillMd.startsWith('---\n')) throw new Error('SKILL.md frontmatter missing');
if(!/^---\nname: github-arena\n/m.test(skillMd)) throw new Error('Skill name must remain github-arena');
if(!/^description:\s*>-/m.test(skillMd)) throw new Error('Skill description missing');
for(const p of [
  'agents/openai.yaml','references/upstream.md','references/chatgpt-adaptation.md',
  'references/rubric.md','references/codex-global.md','scripts/arena_review.py','scripts/install_codex_global.py'
]) await access(resolve(skillRoot,p));
if(skillMd.includes('WhiteChronos/ChatGPT/plugins/github-arena')) throw new Error('Skill contains legacy runtime path dependency');
const out=await mkdtemp(join(tmpdir(),'arena-skill-package-'));
const zip=spawnSync('zip',['-qr',join(out,'skill.zip'),'github-arena'],{cwd:resolve('skills'),encoding:'utf8'});
if(zip.status!==0) throw new Error(zip.stderr||zip.stdout||'zip failed');
const list=spawnSync('unzip',['-t',join(out,'skill.zip')],{encoding:'utf8'});
if(list.status!==0) throw new Error(list.stderr||list.stdout||'zip verification failed');
process.stdout.write(JSON.stringify({skill:'github-arena',package:'PASS',output:join(out,'skill.zip')})+'\n');

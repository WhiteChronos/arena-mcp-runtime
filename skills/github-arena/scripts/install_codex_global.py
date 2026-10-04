#!/usr/bin/env python3
from __future__ import annotations
import argparse, os, shutil
from pathlib import Path
START='<!-- GITHUB_ARENA_GLOBAL_START -->'; END='<!-- GITHUB_ARENA_GLOBAL_END -->'
BLOCK=f'''{START}\n## Global Arena quality layer\n\nApply the installed `github-arena` Skill before finalizing Codex work.\n\n- Use Micro Arena by default: evidence-first, constraint-first, edge-cases-first, built-to-last.\n- Escalate to Review Arena for complex or high-impact work.\n- Use Full Arena only when explicitly requested.\n- Preserve more specific project instructions.\n{END}\n'''
def main():
    p=argparse.ArgumentParser(); p.add_argument('--codex-home'); p.add_argument('--dry-run',action='store_true'); a=p.parse_args()
    home=Path(a.codex_home or os.environ.get('CODEX_HOME') or Path.home()/'.codex').expanduser().resolve(); src=Path(__file__).resolve().parents[1]; dst=home/'skills'/'github-arena'; agents=home/'AGENTS.md'
    if not a.dry_run:
        dst.parent.mkdir(parents=True,exist_ok=True); shutil.rmtree(dst,ignore_errors=True); shutil.copytree(src,dst,ignore=shutil.ignore_patterns('__pycache__','*.pyc','.DS_Store'))
        old=agents.read_text(encoding='utf-8') if agents.exists() else ''
        if START in old and END in old:
            before,rest=old.split(START,1); _,after=rest.split(END,1); new=before.rstrip()+'\n\n'+BLOCK+after.lstrip('\n')
        else: new=(old.rstrip()+'\n\n' if old.rstrip() else '')+BLOCK
        agents.parent.mkdir(parents=True,exist_ok=True); agents.write_text(new,encoding='utf-8')
    print(f'CODEX_HOME={home}'); print(f'skill={dst}'); print(f'agents={agents}')
    return 0
if __name__=='__main__': raise SystemExit(main())

#!/usr/bin/env python3
"""Refresh coverage, select the next batch, and write a Codex-ready current task."""
from __future__ import annotations
import argparse, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(*args):
    subprocess.run([sys.executable, *map(str,args)], cwd=ROOT, check=True)


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--size',type=int,default=40)
    ap.add_argument('--max-complexity',type=int,default=45)
    ap.add_argument('--include-partial',action='store_true')
    args=ap.parse_args()
    run(ROOT/'tools/script_coverage.py')
    cmd=[ROOT/'tools/select_script_batch.py','--size',str(args.size),'--max-complexity',str(args.max_complexity)]
    if args.include_partial: cmd.append('--include-partial')
    run(*cmd)
    cov=json.loads((ROOT/'data/script_coverage.json').read_text(encoding='utf-8'))
    batch=json.loads((ROOT/'data/next_script_batch.json').read_text(encoding='utf-8'))
    lines=[
      '# Codex Current Autobuild Task','',
      'Read `AGENTS.md` and `docs/CODEX_AUTOBUILD.md` before editing.','',
      f'Current coverage counts: `{cov["counts"]}`.','',
      f'Implement/review this batch of **{batch["selected_count"]}** candidates:',''
    ]
    for i,c in enumerate(batch['cards'],1):
        lines.append(f"{i}. {c['name']} (code={c.get('code')}, kind={c.get('kind')}, static complexity={c.get('complexity_score')})")
    lines += [
      '', 'Rules for each candidate:',
      '- Verify historical 1103 behavior before implementation. Modern `carddata.json` text may reflect later errata.',
      '- Inspect analogous local scripts and prefer common engine primitives over card-name engine patches.',
      '- ADS/EDOPro/Project Ignis may be consulted for behavior/timing concepts only; never copy source code.',
      '- If behavior cannot be represented accurately, mark `ENGINE_GAP` in `data/script_status_overrides.json` with a precise missing primitive and continue to the next card.',
      '- Do not mark a coarse `AUTO_DECK_TABLE` entry complete until it is replaced/reviewed accurately.',
      '- Add focused tests. A card is not complete merely because a script registration exists.',
      '', 'Batch completion sequence:',
      '1. Run focused tests while developing.',
      '2. Run `python tools/check.py`.',
      '3. Run `python tools/build_acode.py data/carddata.json`.',
      '4. Run `python tools/autobuild_cycle.py --size 40` to refresh coverage and prepare the next batch.',
      '5. Record a checkpoint changelog/test report. If git is available, commit the checkpoint.',
      '6. Continue with the newly generated `docs/CODEX_CURRENT_TASK.md` unless an unrecoverable environment failure occurs.',
      '', 'Never trade correctness for a higher coverage number.'
    ]
    (ROOT/'docs/CODEX_CURRENT_TASK.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('wrote docs/CODEX_CURRENT_TASK.md')

if __name__=='__main__': main()

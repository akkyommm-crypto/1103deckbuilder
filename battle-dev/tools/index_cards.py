#!/usr/bin/env python3
"""Regenerate the combined card implementation index (legacy + Unified + helpers + partial auto table)."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(ROOT/'tools/script_coverage.py')],cwd=ROOT,check=True)
cov=json.loads((ROOT/'data/script_coverage.json').read_text(encoding='utf-8'))
rows=[]
for c in cov['cards']:
    if c['registrations'] or c['auto_table']:
        impl=[]
        for r in c['registrations']:
            impl.append(f"{r['kind']} @ `{r['source']}:{r['line']}`")
        if c['auto_table'] and not c['registrations']:
            impl.append('AUTO_DECK_TABLE (partial)')
        rows.append((c['name'],c['status'],'<br>'.join(impl)))
rows.sort(key=lambda x:x[0])
out=['# Card Script Index','',f"Registered/auto-table names: **{len(rows)}**",'', '| Card | Status | Implementation |','|---|---|---|']
for name,status,impl in rows:
    out.append(f"| {name.replace('|','&#124;')} | {status} | {impl} |")
(ROOT/'docs'/'CARD_INDEX.md').write_text('\n'.join(out)+'\n',encoding='utf-8')
print(len(rows))

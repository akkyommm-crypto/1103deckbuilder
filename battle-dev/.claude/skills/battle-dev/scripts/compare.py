"""Summarize measured unit records without estimating missing usage. Read-only."""
import argparse
from collections import defaultdict
import json
import math
from pathlib import Path
from statistics import median

TOKEN_FIELDS = ('input', 'output', 'cache_read', 'cache_creation')

def number(x):
    return type(x) in (int, float) and math.isfinite(x) and x >= 0

def usage_rows(r):
    u = r.get('usage') or {}
    rows = u.get('by_model') or []
    if u.get('includes_all_agents') is not True or not u.get('source') or not rows:
        return None
    if any(not x.get('model') or any(not number(x.get(k)) for k in TOKEN_FIELDS) for x in rows):
        return None
    return rows

def summarize(records):
    groups = defaultdict(list)
    seen = set()
    for r in records:
        if r.get('example') is True:
            continue
        unit = r.get('unit')
        if not unit or unit in seen:
            raise ValueError('Missing or duplicate unit ID')
        seen.add(unit)
        if r.get('category') not in ('reuse', 'engine', 'ui') or r.get('mode') not in ('opus-only', 'mixed'):
            raise ValueError(f'{unit}: invalid category/mode')
        if r.get('outcome') not in ('accepted', 'failed', 'waiting', 'paused'):
            raise ValueError(f'{unit}: invalid outcome')
        if r['outcome'] == 'accepted' and (type(r.get('gate_exit')) is not int or r['gate_exit'] != 0):
            raise ValueError(f'{unit}: accepted requires a recorded gate_exit=0')
        groups[(r['category'], r['mode'], r.get('workflow_profile') or 'legacy-mixed-v2')].append(r)   # v3: profiles are counted separately
    out = []
    for (category, mode, profile), rows in sorted(groups.items()):
        accepted = sum(r['outcome'] == 'accepted' for r in rows)
        finished = all(r['outcome'] in ('accepted', 'failed') for r in rows)
        measured = [usage_rows(r) for r in rows]
        complete_usage = all(m is not None for m in measured)
        model_totals = defaultdict(lambda: {k: 0 for k in TOKEN_FIELDS})
        for models in measured:
            for m in models or []:
                for k in TOKEN_FIELDS:
                    model_totals[m['model']][k] += m[k]
        total = sum(sum(t.values()) for t in model_totals.values())
        durations = [r['elapsed_minutes'] for r in rows if number(r.get('elapsed_minutes'))]
        out.append({'category': category, 'mode': mode, 'workflow_profile': profile, 'units': len(rows), 'accepted': accepted,
                    'failed': sum(r['outcome'] == 'failed' for r in rows),
                    'unfinished': sum(r['outcome'] in ('waiting', 'paused') for r in rows),
                    'measured_units': sum(m is not None for m in measured),
                    'measured_tokens_by_model': dict(model_totals),
                    'tokens_per_accepted_unit': total / accepted if complete_usage and finished and accepted else None,
                    'median_elapsed_minutes': median(durations) if durations else None,
                    'timed_units': len(durations),
                    'rework_cycles': sum(r['rework_cycles'] for r in rows) if all(number(r.get('rework_cycles')) for r in rows) else None,
                    'later_defects': sum(r['later_defects'] for r in rows) if all(number(r.get('later_defects')) for r in rows) else None})
    return {'groups': out, 'note': 'Tokens are not cost or subscription quota. Missing is null. Failed work is included; unfinished or unmeasured groups have no per-accepted ratio. Compare similar scopes; small samples are not proof.'}

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('directory', type=Path)
    a = ap.parse_args()
    if not a.directory.is_dir():
        ap.error('record directory does not exist')
    records = [json.loads(p.read_text(encoding='utf-8-sig')) for p in sorted(a.directory.glob('*.json'))]
    print(json.dumps(summarize(records), ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()

"""Read-only coverage/card/log summary. Does not run a build or claim a gate passed."""
import argparse
from collections import Counter
import json
from pathlib import Path
import re

def read_text(path):
    raw = path.read_bytes()
    return raw.decode('utf-16' if raw.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig', errors='replace')

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root', required=True, type=Path)
    ap.add_argument('--card', help='Exact card name')
    ap.add_argument('--log', type=Path, help='Absolute path or path relative to root')
    a = ap.parse_args()
    root = a.root.resolve()
    result = {'root': str(root)}
    coverage = root / 'data/script_coverage.json'
    if coverage.exists():
        c = json.loads(read_text(coverage))
        cards = c.get('cards', [])
        actual = dict(Counter(x['status'] for x in cards))
        declared = c.get('counts', {})
        consistent = len(cards) == c.get('total_db_cards') and all(actual.get(k, 0) == declared.get(k, 0) for k in set(actual) | set(declared))
        result['coverage'] = {'total': len(cards), 'counts': actual, 'counts_consistent': consistent, 'freshness': 'not checked against source; not a gate result'}
        if a.card:
            hits = [x for x in cards if x['name'] == a.card]
            result['card'] = [{'name': x['name'], 'status': x['status'], 'reason': x.get('reason', ''), 'registrations': x.get('registrations', [])[:4], 'tests': x.get('tests', [])[:5], 'total_test_files': len(x.get('tests', []))} for x in hits]
            if not hits:
                result['card_note'] = 'No exact match'
    else:
        result['coverage'] = 'missing'
    if a.log:
        path = a.log if a.log.is_absolute() else root / a.log
        lines = read_text(path).splitlines()
        markers = [int(m.group(1)) for line in lines if (m := re.fullmatch(r'\s*GATE_EXIT\s*=\s*(-?\d+)\s*', line))]
        bad = [(i, line) for i, line in enumerate(lines) if re.search(r'^FAIL\b|Traceback|\b(?:ReferenceError|TypeError|SyntaxError|AssertionError|Error):', line)]
        context = set()
        for i, _ in bad[:6]:
            context.update(range(max(0, i-1), min(len(lines), i+3)))
        result['log'] = {'path': str(path.resolve()), 'pass_lines': sum(bool(re.match(r'^PASS\b', x)) for x in lines), 'fail_lines': sum(bool(re.match(r'^FAIL\b', x)) for x in lines), 'gate_exit_markers': markers, 'completion': 'marker recorded; verify source identity and diagnostics' if len(markers) == 1 else 'unknown: missing or multiple exit markers', 'diagnostic_lines': len(bad), 'first_diagnostics': [f'{i+1}: {lines[i][:600]}' for i in sorted(context)], 'note': 'Caught legacy exceptions require baseline evidence; this tool does not classify them as harmless.'}
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()

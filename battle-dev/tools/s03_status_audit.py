"""S03 status audit: compare current coverage with the frozen System02 coverage.

Only status changes declared in data/s03_status_changes.json are allowed. A declared
promotion to TESTED must keep a real registration under cards/ and be seen by every
listed dedicated test file. Historical Astra01/02 audits stay pinned to their fixtures.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
base = json.loads((ROOT / 'data/system02_final_coverage.json').read_text(encoding='utf8'))
cur = json.loads((ROOT / 'data/script_coverage.json').read_text(encoding='utf8'))
decl = json.loads((ROOT / 'data/s03_status_changes.json').read_text(encoding='utf8'))['changes']

rows_b = {r['name']: r for r in base['cards']}
rows_c = {r['name']: r for r in cur['cards']}
assert set(rows_b) == set(rows_c), 'Card pool changed'
assert cur['total_db_cards'] == 4996, cur['total_db_cards']

changes = {n: (rows_b[n]['status'], rows_c[n]['status']) for n in rows_b if rows_b[n]['status'] != rows_c[n]['status']}
declared = {d['name']: d for d in decl}
unexpected = sorted(set(changes) - set(declared))
missing = sorted(set(declared) - set(changes))
assert not unexpected, ('off-target status changes', {n: changes[n] for n in unexpected})
assert not missing, ('declared changes not observed', missing)
for name, d in declared.items():
    assert changes[name] == (d['from'], d['to']), (name, changes[name], d)
    if d['to'] == 'TESTED':
        regs = [str(r['source']).replace('\\', '/') for r in rows_c[name]['registrations']]
        assert regs and all(r.startswith('cards/') for r in regs), (name, regs)
        tests = {str(t).replace('\\', '/') for t in rows_c[name]['tests']}
        for t in d['tests']:
            assert t in tests, (name, t, sorted(tests))
            assert (ROOT / t).exists(), t

delta = {k: cur['counts'].get(k, 0) - base['counts'].get(k, 0) for k in set(base['counts']) | set(cur['counts'])}
report = {
    'baseline_fixture': 'data/system02_final_coverage.json',
    'baseline_counts': base['counts'],
    'current_counts': cur['counts'],
    'delta': {k: v for k, v in sorted(delta.items()) if v},
    'status_changes': [{'name': n, 'before': b, 'after': a, 'unit': declared[n]['unit']} for n, (b, a) in sorted(changes.items())],
    'off_target_status_changes': 0,
    'card_pool_total': cur['total_db_cards'],
}
(ROOT / 'data/s03_status_audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
for item in [f'{len(changes)} declared status changes observed', 'off-target status changes = 0',
             'promoted cards keep cards/ registrations', 'promoted cards seen by declared tests', 'TOTAL = 4996']:
    print('PASS S03 coverage: ' + item)
print(json.dumps(report['delta'], ensure_ascii=False, sort_keys=True))

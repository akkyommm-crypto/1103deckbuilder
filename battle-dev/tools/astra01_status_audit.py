"""Frozen System01 scope: compare generated coverage with verified Cycle66."""
import argparse, json, sys, zipfile, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TARGETS=['ドラグニティ－ドゥクス','ザ・キックマン','トラックロイド','凶悪犯－チョップマン','ドラグニティ－レギオン']
BASE=ROOT/'data/astra01_baseline_status.json'
if '--initialize' in sys.argv:
    archive=Path(sys.argv[sys.argv.index('--initialize')+1])
    assert hashlib.sha256(archive.read_bytes()).hexdigest()=='83a5ceba6a66c6f3cd7afb6946a4a45311018bc67d70aa5cd834faa3dea8e034'
    with zipfile.ZipFile(archive) as z:
        def original(suffix):
            return z.read(next(n for n in z.namelist() if n.endswith(suffix)))
        cov=json.loads(original('data/script_coverage.json'))
        BASE.write_text(json.dumps({'counts':cov['counts'],'cards':{r['name']:r['status'] for r in cov['cards']}},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        history=ROOT/'docs/history';history.mkdir(exist_ok=True)
        (history/'test_auto_cycle09_cycle66.js.txt').write_bytes(original('tools/test_auto_cycle09.js'))
    p=ROOT/'data/script_status_overrides.json';o=json.loads(p.read_text(encoding='utf8'))
    for name in TARGETS:
        old=o['cards'].get(name,{})
        o['cards'][name]={'status':'TESTED','reason':'Astra System 01: complete card branches exercised through real DUEL activation, chain, choice and processor paths; see tools/test_astra01_cards.js and tools/test_astra01_primitive.js.',
                         'historical_status_cycle66':cov and next(r['status'] for r in cov['cards'] if r['name']==name),
                         'historical_reason_cycle66':old.get('reason',''),
                         'tests':['tools/test_astra01_cards.js','tools/test_astra01_primitive.js']}
    p.write_text(json.dumps(o,ensure_ascii=False,indent=1)+'\n',encoding='utf8')
    print('Frozen baseline and five targeted overrides written. Regenerate coverage before audit.')
    sys.exit(0)
ap=argparse.ArgumentParser()
ap.add_argument('--coverage', default=str(ROOT/'data/script_coverage.json'))
args=ap.parse_args()
before=json.loads(BASE.read_text(encoding='utf8'))
after=json.loads(Path(args.coverage).read_text(encoding='utf8'))
rows={r['name']:r for r in after['cards']}
changes=[{'name':n,'before':s,'after':rows[n]['status']} for n,s in before['cards'].items() if s!=rows[n]['status']]
assert set(rows)==set(before['cards']),'Card pool changed'
assert {r['name'] for r in changes}==set(TARGETS),changes
assert all(rows[n]['status']=='TESTED' for n in TARGETS)
assert after['counts']['ENGINE_GAP']==617 and after['counts']['TESTED']==2047 and after['counts']['NOT_STARTED']==1308
for n in TARGETS:
    assert any('F9_astra_system01.js' in str(r) for r in rows[n]['registrations']),(n,rows[n]['registrations'])
    assert not any('tools/' in str(r) or 'fixture' in str(r).lower() for r in rows[n]['registrations']),n
report={'baseline':before['counts'],'current':after['counts'],'status_changes':changes,
        'off_target_status_changes':[],'registration_misses':[], 'fixture_false_positive_registrations':[],
        'card_pool_unchanged':True,'targets':{n:rows[n]['registrations'] for n in TARGETS}}
(ROOT/'data/astra01_status_audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for item in ['exactly five status changes','no off-target status changes','all five real registrations present','no fixture registrations','4996-card pool unchanged']:
    print('PASS Astra01 coverage: '+item)
print(json.dumps(report['current'],ensure_ascii=False))

"""System02 scope audit: only Brandistock and Tryce may move to TESTED.
S03 pins this historical audit to the frozen System02 coverage via --coverage;
current changes are checked by tools/s03_status_audit.py."""
import argparse, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TARGETS={'ドラグニティ－ブランディストック','閃光の双剣－トライス'}
SYSTEM01={'ドラグニティ－ドゥクス','ザ・キックマン','トラックロイド','凶悪犯－チョップマン','ドラグニティ－レギオン'}
ap=argparse.ArgumentParser()
ap.add_argument('--coverage', default=str(ROOT/'data/script_coverage.json'))
args=ap.parse_args()
before=json.loads((ROOT/'data/astra02_baseline_coverage.json').read_text(encoding='utf8'))
after=json.loads(Path(args.coverage).read_text(encoding='utf8'))
rows_before={r['name']:r for r in before['cards']}
rows_after={r['name']:r for r in after['cards']}
assert set(rows_before)==set(rows_after),'Card pool changed'
changes=[{'name':n,'before':rows_before[n]['status'],'after':rows_after[n]['status']} for n in rows_before if rows_before[n]['status']!=rows_after[n]['status']]
assert {c['name'] for c in changes}==TARGETS,changes
assert rows_after['ドラグニティ－ブランディストック']['status']=='TESTED'
assert rows_after['閃光の双剣－トライス']['status']=='TESTED'
assert after['counts'].get('TESTED')==2049 and after['counts'].get('ENGINE_GAP')==616 and after['counts'].get('NOT_STARTED')==1307 and after['total_db_cards']==4996
for n in TARGETS:
    regs=rows_after[n]['registrations']
    tests=rows_after[n]['tests']
    assert any(str(r['source']).replace('\\','/')=='cards/H0_astra_system02.js' for r in regs),(n,regs)
    norm_tests=[str(t).replace('\\','/') for t in tests]
    assert any(t in ('tools/test_astra02_cards.js','tools/test_astra02_attack_limit.js') for t in norm_tests),(n,tests)
for n in SYSTEM01:
    assert rows_after[n]['status']=='TESTED',n
report={'baseline':before['counts'],'current':after['counts'],'status_changes':changes,
        'off_target_status_changes':0,'fixture_false_positives':0,'registration_misses':0,
        'protected_changes':0,'card_pool_total':after['total_db_cards']}
(ROOT/'data/astra02_status_audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for item in ['exactly two status changes','off-target status changes = 0','fixture false positives = 0','registration misses = 0','protected changes = 0','TOTAL = 4996']:
    print('PASS Astra02 coverage: '+item)
print(json.dumps(report['current'],ensure_ascii=False,sort_keys=True))

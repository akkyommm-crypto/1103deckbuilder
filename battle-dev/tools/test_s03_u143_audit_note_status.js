/* S03-U143: status honesty. A card script whose own auditNote says that a part of its text is not automated / manual / left
   for a later stage must not be TESTED: data/script_status_overrides.json pins it to PARTIAL (with a reason) until the part is
   implemented. Found: 6 cards were TESTED with such notes (真六武衆－シエン, 六武衆－ヤイチ, 六武衆－ザンジ, 魔法都市エンディミオン,
   マシンナーズ・ギアフレーム, マシンナーズ・フォートレス). */
const fs=require('fs'),path=require('path');
const harness=require('./astra_harness');
const ROOT=path.resolve(__dirname,'..');
const ov=JSON.parse(fs.readFileSync(path.join(ROOT,'data','script_status_overrides.json'),'utf8')).cards||{};
/* the harness runs the code in its own VM context, so the overrides are embedded as JSON */
harness('const ov='+JSON.stringify(ov)+';'+String.raw`
const ADMIT=/未自動化|未実装|次段階|手動|未対応|省略/;
const admitted=Object.entries(CARD_SCRIPTS).filter(([n,sc])=>sc&&typeof sc.auditNote==='string'&&ADMIT.test(sc.auditNote)).map(([n])=>n);
ok('scripts whose auditNote admits a missing / manual part: found',admitted.length>=3,JSON.stringify(admitted));
const bad=admitted.filter(n=>!(ov[n]&&(ov[n].status==='PARTIAL'||ov[n].status==='ENGINE_GAP')&&String(ov[n].reason||'').length>40));
ok('each of them is pinned to PARTIAL / ENGINE_GAP with a reason (not TESTED)',bad.length===0,JSON.stringify(bad));
['魔法都市エンディミオン','マシンナーズ・ギアフレーム','マシンナーズ・フォートレス'].forEach(n=>
  ok('pinned: '+n,ov[n]&&ov[n].status==='PARTIAL'&&/S03-U143/.test(ov[n].reason||'')));
/* S03-U173 unlocked: the optional destruction substitute is implemented (engine/1ZV, the controller chooses at the destruction;
   tools/test_s03_u173_destroy_substitute.js). The pin is gone and the auditNote no longer admits a missing part. */
const UNLOCKED_U173=['真六武衆－シエン','六武衆－ヤイチ','六武衆－ザンジ'];
UNLOCKED_U173.forEach(n=>
  ok('unlocked (S03-U173): '+n,!ov[n]&&!ADMIT.test(CARD_SCRIPTS[n].auditNote||'')&&!!CARD_SCRIPTS[n].destroySubstituteS03));
`);

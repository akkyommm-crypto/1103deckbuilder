const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const ov=JSON.parse(fs.readFileSync(path.join(ROOT,'data','script_status_overrides.json'),'utf8')).cards;
/* LeaveField primitive(System v9) で解消。当時 ENGINE_GAP だった記録として残す。 */
const leaveUnlocked=["蘇りし魂","闇次元の解放"];/* StatModifier primitive(System v14) で解消。当時 ENGINE_GAP だった記録として残す。 */const statUnlocked=['カラテマン','グレート・スピリット','シンクロ・ギフト'];/* Position primitive(System v10) で解消。当時 ENGINE_GAP だった記録として残す。 */const positionUnlocked=['ガジェット・ドライバー'];
const reviewed=["虹の引力","虹の行方","裁きの光","銀幕の鏡壁","鎖付き爆弾","D・クロックン","E－HERO ヘル・ブラット","おとり人形","おジャマ・カントリー","アポカテクイル","イグザリオン・ユニバース","インセクト・プリンセス","インフェルニティ・ネクロマンサー","エキセントリック・ボーイ","エレメント・ザウルス","エレメント・ドラゴン","エンペラー・ストゥム","カラクリ粉","ガーディアン・トライス","グリード・クエーサー","コアキメイル・フルバリア","ゴースト王－パンプキング－","ゴーレム","システム・ダウン","ジェルエンデュオ","ジャンク・ディフェンダー"];
const classAUnlocked=['D・ビデオン'];let fail=0;
/* CODEX-C07: summon-batch events + canonical identity + deterministic hidden-pile actions made the old gap stale. */
for(const name of ['連鎖除外']){const okC07=!ov[name];console.log((okC07?'PASS ':'FAIL ')+'CODEX-C07 unlocked '+name);if(!okC07)fail++;}
/* P26 Control primitive で解禁し、実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const p26Unlocked=['ガスタの疾風 リーズ'];
for(const name of p26Unlocked){const okP26=!ov[name];console.log((okP26?'PASS ':'FAIL ')+'P26 unlocked '+name);if(!okP26)fail++;}

for(const name of reviewed){
  const x=ov[name];
  const ok=!!x&&x.status==='ENGINE_GAP'&&typeof x.reason==='string'&&x.reason.includes(':')&&x.reason.length>=80;
  console.log((ok?'PASS ':'FAIL ')+'batch41 precise ENGINE_GAP '+name);
  if(!ok) fail++;
}
for(const name of ['E－HERO マリシャス・エッジ','インヴェルズ・マディス',...classAUnlocked]){const okA=!ov[name];console.log((okA?'PASS ':'FAIL ')+'Class A unlocked '+name);if(!okA)fail++;}
for(const name of leaveUnlocked){
  const ok2=!ov[name];
  console.log((ok2?"PASS ":"FAIL ")+"Leave unlocked "+name);
  if(!ok2) fail++;
}for(const name of positionUnlocked){const ok8=!ov[name];console.log((ok8?'PASS ':'FAIL ')+'Position unlocked '+name);if(!ok8)fail++;}/* DestructionProtection primitive(System v21) で解消。当時 ENGINE_GAP だった記録として残す。 */for(const name of ['キャッスル・ゲート']){const okP21=!ov[name];console.log((okP21?'PASS ':'FAIL ')+'Protection unlocked '+name);if(!okP21)fail++;}for(const name of statUnlocked){const okD=!ov[name];console.log((okD?'PASS ':'FAIL ')+'Stat unlocked '+name);if(!okD)fail++;}

/* Class A bulk（既存engineのみ・貫通）で実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const pierceUnlocked=['クロスソード・ハンター','インフェルニティ・ドワーフ'];
for(const name of pierceUnlocked){const okPB=!ov[name];console.log((okPB?'PASS ':'FAIL ')+'Class A pierce unlocked '+name);if(!okPB)fail++;}
if(fail)process.exit(2);

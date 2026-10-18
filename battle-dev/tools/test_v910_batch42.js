const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const ov=JSON.parse(fs.readFileSync(path.join(ROOT,'data','script_status_overrides.json'),'utf8')).cards;
/* Token primitive(System v11) で解消。当時 ENGINE_GAP だった記録として残す。 */
const tokenUnlocked=["スネークポット"];/* CharacteristicOverride primitive(System v17) で解消。当時 ENGINE_GAP だった記録として残す。 */const charUnlocked=['スペア・ジェネクス'];/* Activation primitive(System v12) で解消。当時 ENGINE_GAP だった記録として残す。 */const activationUnlocked=['ナチュル・トライアンフ'];
const reviewed=["スカル・コンダクター","スペースタイムポリス","ターボ・シンクロン","ディストラクター","デンジャラスマシン TYPE－6","ドラグニティ－パルチザン","ナイルの恵み","バーサーク・デッド・ドラゴン","パペット・キング","フリント・アタック","ポセイドン・オオカブト"];
let fail=0;for(const name of reviewed){const x=ov[name];const ok=!!x&&x.status==='ENGINE_GAP'&&x.reason.includes(':')&&x.reason.length>=80;console.log((ok?'PASS ':'FAIL ')+'batch42 precise ENGINE_GAP '+name);if(!ok)fail++;}for(const name of tokenUnlocked){const okT=!ov[name];console.log((okT?"PASS ":"FAIL ")+"Token unlocked "+name);if(!okT)fail++;}for(const name of activationUnlocked){const okB=!ov[name];console.log((okB?'PASS ':'FAIL ')+'Activation unlocked '+name);if(!okB)fail++;}/* P23 materialFilter で解禁し、実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */for(const name of ['ソーラー・ジェネクス']){const okP23=!ov[name];console.log((okP23?'PASS ':'FAIL ')+'P23 unlocked '+name);if(!okP23)fail++;}/* DestructionProtection primitive(System v21) で解消。当時 ENGINE_GAP だった記録として残す。 */for(const name of ['ブラックポータン']){const okP21=!ov[name];console.log((okP21?'PASS ':'FAIL ')+'Protection unlocked '+name);if(!okP21)fail++;}for(const name of charUnlocked){const okG=!ov[name];console.log((okG?'PASS ':'FAIL ')+'Characteristic unlocked '+name);if(!okG)fail++;}
/* S03-U238: the level-up event (engine/00 onLevelUpS03) and level-based base stats made フォーチュンレディ・アーシー TESTED; its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */const levelUpUnlocked=['フォーチュンレディ・アーシー'];for(const name of levelUpUnlocked){const okLU=!ov[name];console.log((okLU?'PASS ':'FAIL ')+'level-up event unlocked '+name);if(!okLU)fail++;}
for(const name of ['ドラグニティ－ブラックスピア','フレムベル・アーチャー','マザー・ブレイン','ライトロード・エンジェル ケルビム']){const okA=!ov[name];console.log((okA?'PASS ':'FAIL ')+'Class A unlocked '+name);if(!okA)fail++;}

/* Class A bulk（既存engineのみ・貫通）で実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const pierceUnlocked=['ツイン・ブレイカー','ライオ・アリゲーター'];
for(const name of pierceUnlocked){const okPB=!ov[name];console.log((okPB?'PASS ':'FAIL ')+'Class A pierce unlocked '+name);if(!okPB)fail++;}

/* Class A bulk（既存engineのみ・攻撃対象トリガー／2回攻撃付与）で実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const attackUnlocked=['マッド・デーモン'];
for(const name of attackUnlocked){const okAB=!ov[name];console.log((okAB?'PASS ':'FAIL ')+'Class A attack unlocked '+name);if(!okAB)fail++;}

/* READY25 batch1（既存engineのみ） で実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const ready25UnlockedB1=['ピラミッドパワー'];
for(const name of ready25UnlockedB1){const okX=!ov[name];console.log((okX?'PASS ':'FAIL ')+'ready25UnlockedB1 '+name);if(!okX)fail++;}
if(fail)process.exit(2);
/* S03-U432: implemented and tested; its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */['マンモス・ゾンビ','ブレイドナイト'].forEach(n=>{const okU=!ov[n];console.log((okU?'PASS ':'FAIL ')+'U432 unlocked '+n);if(!okU)process.exitCode=2;});
/* S03-U435: implemented and tested; its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */['ニュート','ゼロ・ガードナー'].forEach(n=>{const okU=!ov[n];console.log((okU?'PASS ':'FAIL ')+'U435 unlocked '+n);if(!okU)process.exitCode=2;});
/* S03-U441: implemented and tested; its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */['リグラス・リーパー'].forEach(n=>{const okU=!ov[n];console.log((okU?'PASS ':'FAIL ')+'U441 unlocked '+n);if(!okU)process.exitCode=2;});

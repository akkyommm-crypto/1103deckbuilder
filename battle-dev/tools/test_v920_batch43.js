const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const ov=JSON.parse(fs.readFileSync(path.join(ROOT,'data','script_status_overrides.json'),'utf8')).cards;
const reviewed=["レインボー・ヴェール","レベルダウン!?","ヴェノム・ショット","儀式の檻","反目の従者","召喚雲","大進化薬","暗黒界の導師 セルリ","武闘円舞","死王リッチーロード"];
/* Counter primitive(System v22) で解消。当時 ENGINE_GAP だった記録として残す。 */const counterUnlocked=['古代遺跡コードA'];const classAUnlocked=['執念の剣','守護神の矛','心眼の鉾'];let fail=0;for(const name of reviewed){const x=ov[name];const ok=!!x&&x.status==='ENGINE_GAP'&&x.reason.includes(':')&&x.reason.length>=80;console.log((ok?'PASS ':'FAIL ')+'batch43 precise ENGINE_GAP '+name);if(!ok)fail++;}for(const name of counterUnlocked){const okC22=!ov[name];console.log((okC22?'PASS ':'FAIL ')+'Counter unlocked '+name);if(!okC22)fail++;}/* P23 materialFilter で解禁し、実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */for(const name of ['凛天使クイーン・オブ・ローズ']){const okP23=!ov[name];console.log((okP23?'PASS ':'FAIL ')+'P23 unlocked '+name);if(!okP23)fail++;}for(const name of classAUnlocked){const okA=!ov[name];console.log((okA?'PASS ':'FAIL ')+'Class A unlocked '+name);if(!okA)fail++;}
/* Class A bulk（既存engineのみ・貫通）で実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const pierceUnlocked=['天空騎士パーシアス','地獄将軍・メフィスト'];
/* S03-U214: 「墓地へ送られるモンスターは墓地へは行かず除外される」 (engine/1ZZG graveToBanishS03) で実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const graveRedirectUnlocked=['次元の裂け目'];
for(const name of graveRedirectUnlocked){const okGR=!ov[name];console.log((okGR?'PASS ':'FAIL ')+'grave redirect unlocked '+name);if(!okGR)fail++;}
/* S03-U242: 宝玉の氾濫 made TESTED (S03-U240 placement + mass send / bounded summon); its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */for(const name of ['宝玉の氾濫']){const okCF=!ov[name];console.log((okCF?'PASS ':'FAIL ')+'crystal flood unlocked '+name);if(!okCF)fail++;}
for(const name of pierceUnlocked){const okPB=!ov[name];console.log((okPB?'PASS ':'FAIL ')+'Class A pierce unlocked '+name);if(!okPB)fail++;}

/* READY25 batch2（既存engineのみ） で実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
const ready25UnlockedB2=['氷結界の輸送部隊','太陽の神官'];
for(const name of ready25UnlockedB2){const okX=!ov[name];console.log((okX?'PASS ':'FAIL ')+'ready25UnlockedB2 '+name);if(!okX)fail++;}
/* S03-U180: the 剣闘獣 common mechanism (engine/1ZZ; tools/test_s03_u180_gladiators.js) implements it. 当時 ENGINE_GAP だった記録として残す。 */
const gladiatorUnlockedU180=['剣闘獣トラケス'];
/* S03-U181: 剣闘獣オクタビウス (engine/1ZZ; tools/test_s03_u181_gladiators2.js). */
gladiatorUnlockedU180.push('剣闘獣オクタビウス');
for(const name of gladiatorUnlockedU180){const okG=!ov[name];console.log((okG?'PASS ':'FAIL ')+'gladiatorUnlockedU180 '+name);if(!okG)fail++;}
/* S03-U266: ワンショット・ブースター TESTED (Normal Summon success record + battle record); its old precise-gap check becomes this one. */
for(const name of ['ワンショット・ブースター','ヴェノム・スワンプ']){const okW=!ov[name];console.log((okW?'PASS ':'FAIL ')+'U266 unlocked '+name);if(!okW)fail++;}
if(fail)process.exit(2);
/* S03-U435: implemented and tested; its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */['創世竜','同族感電ウィルス'].forEach(n=>{const okU=!ov[n];console.log((okU?'PASS ':'FAIL ')+'U435 unlocked '+n);if(!okU)process.exitCode=2;});
/* S03-451: implemented and tested; its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */['暗黒界の魔神 レイン'].forEach(n=>{const okU=!ov[n];console.log((okU?'PASS ':'FAIL ')+'451 unlocked '+n);if(!okU)process.exitCode=2;});
/* S03-452: implemented and tested; its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */['墓掘りグール','奇跡の発掘'].forEach(n=>{const okU=!ov[n];console.log((okU?'PASS ':'FAIL ')+'452 unlocked '+n);if(!okU)process.exitCode=2;});

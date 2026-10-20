const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const stateSrc=fs.readFileSync(path.join(ROOT,'engine','00_state_actions.js'),'utf8');
const procSrc=fs.readFileSync(path.join(ROOT,'engine','30_processor_chain_battle.js'),'utf8');
const legalSrc=fs.readFileSync(path.join(ROOT,'engine','40_legal_script_engine.js'),'utf8');
const expSrc=fs.readFileSync(path.join(ROOT,'cards','36_1103_expansion_v340.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'build_manifest.json'),'utf8'));
const allCards=manifest.map(x=>x.path).filter(x=>x.startsWith('cards/')&&x.endsWith('.js'))
  .map(x=>fs.readFileSync(path.join(ROOT,x),'utf8')).join('\n');
const rows=[];
const assert=(name,v,detail='')=>{rows.push({name,ok:!!v,detail}); if(!v) throw new Error(name+(detail?' '+detail:''));};
const names=[...allCards.matchAll(/defineScript\(\s*["']([^"']+)["']/g)].map(m=>m[1]);
const added=[
 '真六武衆－キザン','真六武衆－カゲキ','真六武衆－ミズホ','六武衆のご隠居','六武衆の露払い','紫炎の狼煙','六武衆の荒行','真六武衆－エニシ','紫炎の足軽','六武衆推参!',
 '天空の宝札','ヘカテリス','緑光の宣告者','紫光の宣告者','コーリング・ノヴァ','裁きの代行者 サターン',
 'E・HERO オーシャン','E・HERO フォレストマン','E・HERO ボルテック','E・HERO レディ・オブ・ファイア'
];
assert('defineScriptは220枚以上',names.length>=220,'count='+names.length);
assert('v3.4.0追加20枚が全て登録',added.every(n=>names.includes(n)),'added='+added.filter(n=>names.includes(n)).length);
assert('スクリプト名に重複なし',new Set(names).size===names.length,'unique='+new Set(names).size);

// 中央FX_SPECIAL_SUMMONで「このターン特殊召喚不可」を保証。
vm.runInThisContext(stateSrc,{filename:'00_state_actions.js'});
CARD_DB=[{n:'テスト天使',k:'m',atk:1000,def:1000,lv:4,ra:'天使',at:'光',ex:false,st:['効果']}];
globalThis.dbOf=c=>CARD_DB[c?.id]||{};
globalThis.CARD_SCRIPTS={};
{
 const g=newGame(); gameState=g; const c={id:0,owner:0,face:'up',pos:'atk'}; g.players[0].grave=[c];
 g.players[0].temporaryFlags.noSpecialSummon=true;
 applyAction(g,{type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:0,pos:'atk',reason:'restriction test'});
 assert('特殊召喚不可フラグは墓地蘇生も止める',g.players[0].mz.length===0&&g.players[0].grave[0]===c);
 delete g.players[0].temporaryFlags.noSpecialSummon;
 applyAction(g,{type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:0,pos:'atk',reason:'allowed test'});
 assert('制約が無ければ特殊召喚できる',g.players[0].mz.length===1&&g.players[0].mz[0]===c);
}

{
 const g=newGame(); gameState=g;
 applyAction(g,{type:'RESERVE_ADD',player:0,name:'荒行test',at:'endPhase',kind:'destroyUids',uids:[123],flagKey:'v340EndDestroyTurn'});
 assert('予約効果はflagKeyを保持する',g.reserved.length===1&&g.reserved[0].flagKey==='v340EndDestroyTurn',JSON.stringify(g.reserved[0]));
}
assert('Battle Phase禁止の共通判定',/function battlePhaseForbiddenV340\([\s\S]*?temporaryFlags\.noBattlePhase/.test(procSrc));
assert('Main1の次へは効果でBattle不可ならEndへ',/gameState\.phase==='main1' && battlePhaseForbiddenV340\(gameState\)\) return 'end'/.test(procSrc));
assert('遅延破壊はカード別flagKeyに対応',/const flagKey=r\.flagKey\|\|'rabbitEndDestroyTurn'/.test(procSrc));
assert('召喚手順も特殊召喚不可を事前拒否',/strictSummonProcedureLegality[\s\S]*?temporaryFlags && gameState\.players\[p\]\.temporaryFlags\.noSpecialSummon/.test(legalSrc));
assert('特殊召喚失敗時に誤イベントを出さない',/const h=locateCard\(before\);[\s\S]*?h\.zone==='mz'/.test(legalSrc));
assert('荒行はUID予約でエンド破壊',/defineScript\("六武衆の荒行"[\s\S]*?v340ScheduleEndDestroy/.test(expSrc));
assert('天空の宝札は特殊召喚・Battle両制約',/defineScript\("天空の宝札"[\s\S]*?noSpecialSummon[\s\S]*?noBattlePhase/.test(expSrc));
assert('緑光は魔法の発動無効',/defineScript\("緑光の宣告者"[\s\S]*?d\.k!=='s'[\s\S]*?negatePreviousChainLinkV2/.test(expSrc));
assert('紫光は罠の発動無効',/defineScript\("紫光の宣告者"[\s\S]*?d\.k!=='t'[\s\S]*?negatePreviousChainLinkV2/.test(expSrc));
assert('ボルテックは戦闘ダメージ後に除外HEROを蘇生',/defineScript\("E・HERO ボルテック"[\s\S]*?dsTiming:'after'[\s\S]*?API\.specialSummon\(ctx\.player,'banish'/.test(expSrc));
console.log(rows.map(x=>'PASS '+x.name+(x.detail?' — '+x.detail:'')).join('\n'));

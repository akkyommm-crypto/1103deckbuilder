const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const stateSrc=fs.readFileSync(path.join(ROOT,'engine','00_state_actions.js'),'utf8');
const procSrc=fs.readFileSync(path.join(ROOT,'engine','30_processor_chain_battle.js'),'utf8');
const legalSrc=fs.readFileSync(path.join(ROOT,'engine','40_legal_script_engine.js'),'utf8');
const coreSrc=fs.readFileSync(path.join(ROOT,'cards','00_generic_core.js'),'utf8');
const karaSrc=fs.readFileSync(path.join(ROOT,'cards','10_themes_a.js'),'utf8');
const ctrlSrc=fs.readFileSync(path.join(ROOT,'cards','20_control_counter.js'),'utf8');
const expSrc=fs.readFileSync(path.join(ROOT,'cards','37_1103_expansion_v350.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'build_manifest.json'),'utf8'));
const allCards=manifest.map(x=>x.path).filter(x=>x.startsWith('cards/')&&x.endsWith('.js'))
  .map(x=>fs.readFileSync(path.join(ROOT,x),'utf8')).join('\n');
const rows=[];
const assert=(name,v,detail='')=>{rows.push({name,ok:!!v,detail}); if(!v) throw new Error(name+(detail?' '+detail:''));};
const names=[...allCards.matchAll(/defineScript\(\s*["']([^"']+)["']/g)].map(m=>m[1]);
const added=[
 '真六武衆－シエン','六武衆の師範','六武衆－ヤイチ','六武衆－ザンジ','邪帝ガイウス','風帝ライザー','黄泉ガエル','鬼ガエル','粋カエル','バトルフェーダー','トラゴエディア','ブラック・ローズ・ドラゴン','XX－セイバー フォルトロール','XX－セイバー エマーズブレイド','X－セイバー エアベルン','XX－セイバー ヒュンレイ','マシンナーズ・ギアフレーム','マシンナーズ・フォートレス','BF－暁のシロッコ','BF－アーマード・ウィング'
];
assert('defineScriptは240種類以上',new Set(names).size>=240,'unique='+new Set(names).size);
assert('v3.5.0追加20枚が全て登録',added.every(n=>names.includes(n)),'added='+added.filter(n=>names.includes(n)).length);
assert('スクリプト名に重複なし',new Set(names).size===names.length,'total='+names.length);
assert('System Version 4.8.0',/systemVersion:"4\.8\.0"/.test(stateSrc));

// 中央「場を離れたら除外」: 墓地送り・バウンス・デッキ戻しを直接実行して確認。
vm.runInThisContext(stateSrc,{filename:'00_state_actions.js'});
globalThis.CARD_SCRIPTS={};
globalThis.effectNegated=()=>false;
CARD_DB=[{n:'テストフェーダー',k:'m',atk:0,def:0,lv:1,ra:'悪魔',at:'闇',ex:false,st:['効果']}];
globalThis.dbOf=c=>CARD_DB[c?.id]||{};
{
 const g=newGame(); gameState=g; const c={id:0,owner:0,face:'up',pos:'atk',banishWhenLeavesField:true}; g.players[0].mz=[c];
 applyAction(g,{type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'test',byDestroy:false});
 assert('場を離れたら除外：墓地送りを置換',g.players[0].grave.length===0&&g.players[0].banish[0]===c);
 assert('除外後に残存フラグはリセット',!c.banishWhenLeavesField);
}
{
 const g=newGame(); gameState=g; const c={id:0,owner:0,face:'up',pos:'atk',banishWhenLeavesField:true}; g.players[0].mz=[c];
 applyAction(g,{type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'test'});
 assert('場を離れたら除外：バウンスを置換',g.players[0].hand.length===0&&g.players[0].banish[0]===c);
}
{
 const g=newGame(); gameState=g; const c={id:0,owner:0,face:'up',pos:'atk',banishWhenLeavesField:true}; g.players[0].mz=[c];
 applyAction(g,{type:'FX_RETURN_DECK',player:0,zone:'mz',index:0,reason:'test'});
 assert('場を離れたら除外：デッキ戻しを置換',g.players[0].deck.length===0&&g.players[0].banish[0]===c);
}

assert('ゾンビキャリアにbanish-on-leave実処理',/defineScript\("ゾンビキャリア"[\s\S]*?banishWhenLeavesField(?:=|',)true/.test(coreSrc));
assert('Endymionは魔法解決後カウンター監視',/defineScript\("魔法都市エンディミオン"[\s\S]*?spellCounterOnSpellResolve/.test(coreSrc));
assert('Endymionは破壊カードのカウンター移送',/collectDestroyedSpellCounters:true/.test(coreSrc)&&/function v350TransferDestroyedSpellCounters/.test(stateSrc));
assert('発動時点のEndymion UIDをチェーンに保存',/spellCounterObserverUids/.test(procSrc)&&/v350ApplySpellCounterObservers/.test(procSrc));
assert('効果無効でも発動成立なら魔力カウンター対象',/発動無効でなければ、効果無効でも/.test(procSrc));
assert('無零怒②は表示形式変更イベントで1ドロー',/defineScript\("カラクリ大将軍 無零怒"[\s\S]*?onKarakuriPositionChange[\s\S]*?API\.draw\(ctx\.player,1\)/.test(karaSrc));
assert('カラクリ表示変更通知を共通化',/function notifyKarakuriPositionChangeV350/.test(ctrlSrc)&&/notifyKarakuriPositionChangeV350/.test(legalSrc));
assert('特殊通常召喚method condition対応',/typeof m\.condition==='function'/.test(fs.readFileSync(path.join(ROOT,'engine','70_summon_procedures.js'),'utf8')));
assert('シエンは相手魔法罠の発動無効',/defineScript\("真六武衆－シエン"[\s\S]*?negatePreviousChainLinkV2/.test(expSrc));
assert('バトルフェーダーはSS後Battle終了＋除外フラグ',/defineScript\("バトルフェーダー"[\s\S]*?banishWhenLeavesField(?:=|',)true[\s\S]*?v350EndBattlePhase/.test(expSrc));
assert('トラゴエディアは手札枚数×600',/defineScript\("トラゴエディア"[\s\S]*?hand\.length[\s\S]*?600/.test(expSrc));
assert('ブラックローズはS召喚時全体破壊',/defineScript\("ブラック・ローズ・ドラゴン"[\s\S]*?destroyAll\('mz'[\s\S]*?destroyAll\('sz'[\s\S]*?destroyAll\('field'/.test(expSrc));
assert('帝2種はアドバンス召喚判定',/defineScript\("邪帝ガイウス"[\s\S]*?tributeCount/.test(expSrc)&&/defineScript\("風帝ライザー"[\s\S]*?tributeCount/.test(expSrc));
assert('黄泉ガエルはS/T無しのStandby蘇生',/defineScript\("黄泉ガエル"[\s\S]*?onStandbyPhase/.test(expSrc));
assert('X-Saber 4枚登録', ['XX－セイバー フォルトロール','XX－セイバー エマーズブレイド','X－セイバー エアベルン','XX－セイバー ヒュンレイ'].every(n=>names.includes(n)));
assert('粋カエルはS素材候補から除外',/cannotSynchroMaterial:true/.test(expSrc)&&/kind==='synchro'[\s\S]*?cannotSynchroMaterial/.test(fs.readFileSync(path.join(ROOT,'engine','20_effect_primitives_ex.js'),'utf8')));
assert('ブラックローズ②まで自動化',/defineScript\("ブラック・ローズ・ドラゴン"[\s\S]*?v360Rose2Turn[\s\S]*?API\.changePosition[\s\S]*?modAtk/.test(expSrc));
assert('ヒュンレイは3枚まで選択',/defineScript\("XX－セイバー ヒュンレイ"[\s\S]*?chosen\.length>=3[\s\S]*?selectedTargets\.slice/.test(expSrc));

console.log(rows.map(x=>'PASS '+x.name+(x.detail?' — '+x.detail:'')).join('\n'));

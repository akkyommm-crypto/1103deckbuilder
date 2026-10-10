const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const stateSrc=fs.readFileSync(path.join(ROOT,'engine','00_state_actions.js'),'utf8');
const expSrc=fs.readFileSync(path.join(ROOT,'cards','35_1103_expansion.js'),'utf8');
const allCards=fs.readdirSync(path.join(ROOT,'cards')).filter(x=>x.endsWith('.js'))
  .map(x=>fs.readFileSync(path.join(ROOT,'cards',x),'utf8')).join('\n');
vm.runInThisContext(stateSrc,{filename:'00_state_actions.js'});

const rows=[];
const assert=(name,v,detail='')=>{rows.push({name,ok:!!v,detail}); if(!v) throw new Error(name+(detail?' '+detail:''));};

// 1) 明示スクリプト総数と今回の16枚。
const names=[...allCards.matchAll(/defineScript\(\s*["']([^"']+)["']/g)].map(m=>m[1]);
const added=[
 'ならず者傭兵部隊','D.D.アサイラント','墓守の偵察者','墓守の末裔','墓守の石版','墓守の番兵','墓守の呪術師','墓守の長槍兵',
 'BF－疾風のゲイル','BF－黒槍のブラスト','BF－月影のカルート','BF－蒼炎のシュラ','黒い旋風','BF－極北のブリザード','落とし穴','天罰'
];
assert('defineScript総数は220枚以上（v3.3.0の16枚も維持）', names.length>=220, 'count='+names.length);
assert('v3.3.0追加16枚が全て登録', added.every(n=>names.includes(n)), 'added='+added.filter(n=>names.includes(n)).length);

// 2) 貫通ダメージの共通エンジンを実戦計算で確認。
CARD_DB = [
 {n:'墓守の長槍兵',k:'m',atk:1500,def:1000,lv:4,ex:false,st:['効果']},
 {n:'テスト守備',k:'m',atk:500,def:1000,lv:4,ex:false,st:['通常']},
 {n:'BF－極北のブリザード',k:'m',atk:1300,def:0,lv:2,ex:false,st:['チューナー','効果']},
 {n:'BF－黒槍のブラスト',k:'m',atk:1700,def:800,lv:4,ex:false,st:['効果']},
];
globalThis.dbOf=c=>(c&&c.token)?c.token:(CARD_DB[c?.id]||{});
globalThis.battleDestroyConfirmed=c=>!!(c&&c.battleDestroyed);
globalThis.CARD_SCRIPTS={
 '墓守の長槍兵':{continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage(info){
   if(info.atkCard!==info.self || !info.defCard || info.defCard.pos!=='def') return 0;
   return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
 }}},
 'BF－極北のブリザード':{cannotSpecialSummon:true},
 'BF－黒槍のブラスト':{}
};
{
 const g=newGame(); gameState=g;
 const a={id:0,owner:0,controller:0,face:'up',pos:'atk'};
 const d={id:1,owner:1,controller:1,face:'up',pos:'def'};
 g.players[0].mz=[a]; g.players[1].mz=[d];
 applyAction(g,{type:'ATTACK',player:0,atkIdx:0,target:0});
 assert('墓守の長槍兵の貫通500ダメージ',g.players[1].lp===7500,'lp='+g.players[1].lp);
}

// 3) 「特殊召喚できない」をカード個別UIではなく共通FX_SPECIAL_SUMMONで保証。
{
 const g=newGame(); gameState=g;
 const blizzard={id:2,owner:0,face:'up',pos:'atk'};
 g.players[0].grave=[blizzard];
 applyAction(g,{type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:0,pos:'def',reason:'死者蘇生テスト'});
 assert('極北のブリザードは死者蘇生でも特殊召喚不可',g.players[0].mz.length===0&&g.players[0].grave[0]===blizzard);
 const bora={id:3,owner:0,face:'up',pos:'atk'}; g.players[0].grave.push(bora);
 applyAction(g,{type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:1,pos:'atk',reason:'通常特殊召喚テスト'});
 assert('特殊召喚可能モンスターは従来通り特殊召喚',g.players[0].mz.length===1&&g.players[0].mz[0]===bora);
}

// 4) 重要宣言を静的保証。
assert('ゲイルはチェーンに乗らない自己特殊召喚手順',/defineScript\("BF－疾風のゲイル"[\s\S]*?summonProcedure:/.test(expSrc));
assert('カルートはダメージステップ合法',/defineScript\("BF－月影のカルート"[\s\S]*?damageStepLegal:true/.test(expSrc));
assert('シュラはリクルート先の効果を無効',/defineScript\("BF－蒼炎のシュラ"[\s\S]*?API\.negate/.test(expSrc));
assert('墓守の石版はネクロバレーを無視',/defineScript\("墓守の石版"[\s\S]*?ignoresNecrovalley:true/.test(expSrc));
assert('天罰は発動無効としてチェーンリンクを無効化',/defineScript\("天罰"[\s\S]*?negatePreviousChainLinkV2\('天罰',true,'activation'\)/.test(expSrc));

console.log(rows.map(x=>'PASS '+x.name+(x.detail?' — '+x.detail:'')).join('\n'));

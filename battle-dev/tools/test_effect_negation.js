const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const stateSrc=fs.readFileSync(path.join(ROOT,'engine','00_state_actions.js'),'utf8');
const procSrc=fs.readFileSync(path.join(ROOT,'engine','30_processor_chain_battle.js'),'utf8');
const cardSrc=fs.readFileSync(path.join(ROOT,'cards','00_generic_core.js'),'utf8');

// State helpers are already Node-testable in this project.
vm.runInThisContext(stateSrc,{filename:'00_state_actions.js'});

// Pull only the chain-link resolver, avoiding browser-only UI startup code.
const a=procSrc.indexOf('function resolveOnePreparedLinkV27(link){');
const b=procSrc.indexOf('\nfunction processChainEndV30()',a);
if(a<0||b<0) throw new Error('resolveOnePreparedLinkV27 not found');
vm.runInThisContext(procSrc.slice(a,b),{filename:'resolveOnePreparedLinkV27.js'});

globalThis.CARD_DB=[
  {n:'異次元の女戦士',k:'m',ex:false,atk:1500,def:1600,lv:4,st:['効果']},
  {n:'テスト攻撃モンスター',k:'m',ex:false,atk:1800,def:1000,lv:4,st:['通常']},
];
globalThis.dbOf=c=>(c&&c.token)?c.token:(CARD_DB[c?.id]||{});
globalThis.CARD_SCRIPTS={};
globalThis.RESOLUTION_SUMMON_BATCH_V2=[];
globalThis.flushResolutionSummonBatchV2=()=>{};
globalThis.reconcileProcedureBaseStats=()=>{};
globalThis.afterPreparedResolve=()=>{};
globalThis.preparedChainContext=link=>({card:findCardByUid(link.uid)?.card||null,player:link.player,selectedTargets:[]});
globalThis.findCardByUid=uid=>{
  for(let p=0;p<2;p++){
    for(const zone of ['mz','grave','hand','banish','ex']){
      const arr=gameState.players[p][zone]||[];
      const index=arr.findIndex(c=>c&&c.uid===uid);
      if(index>=0) return {p,zone,index,card:arr[index]};
    }
  }
  return null;
};

const rows=[];
const assert=(name,v,detail='')=>{rows.push({name,ok:!!v,detail});if(!v)throw new Error(name+(detail?' '+detail:''));};

// 1) 個別無効（ヴェーラー/聖杯）を受けた状態でフィールド発動した効果は、発動自体は成立しても解決しない。
{
  const g=newGame(); gameState=g; g.turn=3;
  const lady={id:0,uid:1001,owner:1,controller:1,face:'up',pos:'atk',negatedUntilTurn:3};
  g.players[1].mz=[lady];
  let resolved=0;
  CARD_SCRIPTS['異次元の女戦士']={resolve(){resolved++;}};
  resolveOnePreparedLinkV27({name:'異次元の女戦士',uid:1001,player:1,from:'mz',prepared:true,
    sourceNegatedAtActivation:true,activationNegated:false,effectNegated:false,negated:false});
  assert('効果無効中でも発動リンクは作れるが効果は適用されない',resolved===0,'resolved='+resolved);
}

// 2) 発動後にコスト等で場を離れても、個別無効状態でフィールド発動した効果は無効のまま。
{
  const g=newGame(); gameState=g; g.turn=4;
  const lady={id:0,uid:1002,owner:1,face:'up',pos:'atk'}; // reset後を模擬: negated flagは消えている
  g.players[1].grave=[lady];
  let resolved=0;
  CARD_SCRIPTS['異次元の女戦士']={resolve(){resolved++;}};
  resolveOnePreparedLinkV27({name:'異次元の女戦士',uid:1002,player:1,from:'mz',prepared:true,
    sourceNegatedAtActivation:true,activationNegated:false,effectNegated:false,negated:false});
  assert('発動時個別無効のスナップショットを保持する',resolved===0,'resolved='+resolved);
}

// 3) 無効でなければ通常解決する。
{
  const g=newGame(); gameState=g; g.turn=5;
  const lady={id:0,uid:1003,owner:1,controller:1,face:'up',pos:'atk'};
  g.players[1].mz=[lady];
  let resolved=0;
  CARD_SCRIPTS['異次元の女戦士']={resolve(){resolved++;}};
  resolveOnePreparedLinkV27({name:'異次元の女戦士',uid:1003,player:1,from:'mz',prepared:true,
    sourceNegatedAtActivation:false,activationNegated:false,effectNegated:false,negated:false});
  assert('通常状態の異次元の女戦士は効果解決する',resolved===1,'resolved='+resolved);
}

// 4) カードスクリプト自体のタイミング/ヴェーラー修正を静的に保証。
assert('異次元の女戦士はダメージ計算後(after)に発動',
  /defineScript\("異次元の女戦士"[\s\S]{0,260}dsTiming:"after"/.test(cardSrc));
assert('ヴェーラーは相手Main Phase限定',cardSrc.includes('相手のメインフェイズにのみ発動できます'));
assert('ヴェーラーは手札→墓地をコストで払う',/defineScript\("エフェクト・ヴェーラー"[\s\S]*?cost\(ctx, done\)[\s\S]*?API\.discard/.test(cardSrc));
assert('ヴェーラーはターン終了時までの無効',/defineScript\("エフェクト・ヴェーラー"[\s\S]*?negatedUntilTurn(?: = |',)gameState\.turn/.test(cardSrc));

console.log(rows.map(x=>'PASS '+x.name+(x.detail?' — '+x.detail:'')).join('\n'));

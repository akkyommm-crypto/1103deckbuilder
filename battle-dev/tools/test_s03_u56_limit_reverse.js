/* S03-U56 リミット・リバース.
   Requirement: Debris fixed-list routes must no longer expose Limit Reverse only
   as activateSetManual. The set continuous trap needs a DUEL activation path and
   replay-safe links to its revived monster. */
const harness=require('./astra_harness');

harness(String.raw`
function fresh(){resetA();gameState.activePlayer=0;gameState.phase='main1';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function auditNow(){const pkg=v41ReplayPackage(gameState);return {pkg,audit:v44ReplayAuditPackage(pkg)};}
function answerFirst(){
  const pc=pendingChoiceV49(gameState);
  if(!pc||!pc.candidates||!pc.candidates.length)throw new Error('choice missing');
  return answerChoiceV49([pc.candidates[0].key]);
}
function resolveTopPrepared(){
  const link=gameState.chain[gameState.chain.length-1];
  act({type:'CHAIN_RESOLVE_TOP'});
  if(link) resolveOnePreparedLinkV27(link);
}
function activateLimitReverse(){
  const okPrep=prepareDuelActivation('リミット・リバース',0,'sz',0,{noPriority:true});
  answerFirst();
  resolveTopPrepared();
  return okPrep;
}

/* A. Set Limit Reverse is a scripted DUEL activation, not activateSetManual. */
fresh();
const lr=mk('リミット・リバース',0,'down','atk');
lr.setTurn=gameState.turn-1;
const bulb=mk('グローアップ・バルブ',0,'up','atk');
const lyla=mk('ライトロード・マジシャン ライラ',0,'up','atk');
gameState.players[0].sz=[lr];
gameState.players[0].grave=[bulb,lyla];
baselineA();
const ids=getLegalZoneActions(0,'sz',0).map(a=>a.id);
ok('U56: set リミット・リバース offers scripted activateSet instead of activateSetManual',
  ids.includes('activateSet')&&!ids.includes('activateSetManual'),JSON.stringify(ids));

/* B. Activation revives one own GY monster with ATK 1000 or less in Attack Position and creates mutual leave links. */
const prepared=activateLimitReverse();
const revived=gameState.players[0].mz[0];
ok('U56: リミット・リバース activation prepares and revives a <=1000 ATK monster in attack position',
  prepared===true&&revived===bulb&&zoneOf(bulb)==='mz'&&bulb.pos==='atk'&&zoneOf(lr)==='sz',
  JSON.stringify({prepared,bulb:zoneOf(bulb),pos:bulb.pos,lr:zoneOf(lr)}));
ok('U56: リミット・リバース links itself and the revived monster through v9 JSON state',
  s03LimitReverseWatches(lr,bulb.uid)&&s03LimitReverseWatches(bulb,lr.uid)&&!s03LimitReverseWatches(lr,lyla.uid),
  JSON.stringify({lr:API.linkState(lr),bulb:API.linkState(bulb)}));
let r=auditNow();
ok('U56: リミット・リバース activation and link actions replay cleanly',
  r.audit.ok&&r.audit.count===r.pkg.actions.length,JSON.stringify(r.audit));

/* C. If the revived monster becomes Defense Position, both it and Limit Reverse are destroyed. */
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,pos:'def',reason:'fixture defense'});
const ev=evs('onPositionChange')[0];
const handlers=collectHandlers('onPositionChange',ev).filter(x=>x.name==='リミット・リバース');
ok('U56: リミット・リバース is offered when its linked monster becomes Defense Position',
  handlers.length===1,JSON.stringify(handlers.map(x=>({name:x.name,zone:x.zone,index:x.index}))));
act({type:'EVENT_DEQUEUE_V31'});
prepareDuelActivation('リミット・リバース',handlers[0].p,handlers[0].zone,handlers[0].index,
  {event:ev,eventName:'onPositionChange',ignoreTiming:true,noPriority:true});
resolveTopPrepared();
ok('U56: linked monster Defense Position destroys both monster and リミット・リバース',
  zoneOf(bulb)==='grave'&&zoneOf(lr)==='grave',
  JSON.stringify({bulb:zoneOf(bulb),lr:zoneOf(lr)}));
r=auditNow();
ok('U56: Defense Position destruction branch replays cleanly',
  r.audit.ok&&r.audit.count===r.pkg.actions.length,JSON.stringify(r.audit));

/* D. Mutual leave link destroys Limit Reverse when the revived monster leaves. */
fresh();
const lr2=mk('リミット・リバース',0,'up','atk');
const veiler=mk('エフェクト・ヴェーラー',0,'up','atk');
gameState.players[0].sz=[lr2];
gameState.players[0].grave=[veiler];
baselineA();
activateLimitReverse();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'fixture destroy revived',byDestroy:true});
ok('U56: if the revived monster is destroyed, リミット・リバース is destroyed by the mutual link',
  zoneOf(veiler)==='grave'&&zoneOf(lr2)==='grave',
  JSON.stringify({veiler:zoneOf(veiler),lr:zoneOf(lr2)}));

/* E. Mutual leave link destroys the revived monster when Limit Reverse leaves the field. */
fresh();
const lr3=mk('リミット・リバース',0,'up','atk');
const dandy=mk('ダンディライオン',0,'up','atk');
gameState.players[0].sz=[lr3];
gameState.players[0].grave=[dandy];
baselineA();
activateLimitReverse();
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'fixture remove trap',byDestroy:false});
ok('U56: if リミット・リバース leaves the field, the revived monster is destroyed by the mutual link',
  zoneOf(lr3)==='grave'&&zoneOf(dandy)==='grave',
  JSON.stringify({lr:zoneOf(lr3),dandy:zoneOf(dandy)}));
`);

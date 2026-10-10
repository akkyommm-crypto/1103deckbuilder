/* S03-U142: 未来融合－フューチャー・フュージョン — the delayed Fusion Summon at the 2nd own Standby Phase asks face-up ATK or DEF
   (it was always ATK). Setup and drivers from the U59 test. Real DUEL path through the processor, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
let POS_S03='atk';
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const h=findCardByUid(c.uid);return h&&h.zone;}
function graveNames(p){return gameState.players[p].grave.map(nm);}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function szNames(p){return gameState.players[p].sz.map(nm);}
function fresh(){
  resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';
}
function drive(){
  for(let i=0;i<600;i++){
    { const qS03=pendingChoiceV49(gameState); if(qS03 && /表示形式/.test(qS03.title||'')){ __choicePickV49(qS03.candidates.findIndex(c=>c.value===POS_S03)); continue; } }
    if(pendingChoiceV49(gameState)) return 'choice';
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    return 'idle';
  }
  return 'loop';
}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
/* 現フェイズから次のターンのスタンバイフェイズまで進める（相手ターンでも自分ターンでも共通）。
   main1→main2 は直接遷移できず battle を経由する必要がある。guard は無限ループでの
   OOM を避けるための安全弁（両プレイヤーのデッキが尽きる等、進行できない場合は即エラーにする）。 */
function advanceToNextStandby(){
  let guard=0;
  while(gameState.phase!=='end'){
    if(++guard>12) throw new Error('advanceToNextStandby stuck at phase='+gameState.phase);
    if(gameState.phase==='draw') phase('standby');
    else if(gameState.phase==='standby') phase('main1');
    else if(gameState.phase==='main1') phase('battle');
    else if(gameState.phase==='battle') phase('main2');
    else if(gameState.phase==='main2') phase('end');
    else break;
  }
  requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  requestProcessorV27(PROCESSOR_V27.DRAW,{});drive();
  phase('standby');
}
function pickUid(uid){
  const q=pendingChoiceV49(gameState);
  if(!q) return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);
  if(i<0) return false;
  __choicePickV49(i);
  return true;
}
/* 複数選択（min>1 または max>1）はトグル（__choicePickV49）だけでは確定しない。
   ui/11_choice_ui_v49.js の実装どおり、選び終えてから __choiceCommitV49() で確定する。 */
function pickUids(uids){
  uids.forEach(uid=>{
    const cur=pendingChoiceV49(gameState);
    if(!cur) return;
    const i=cur.candidates.findIndex(c=>c.uid===uid);
    if(i>=0) __choicePickV49(i);
  });
  if(pendingChoiceV49(gameState)) __choiceCommitV49();
}
function choiceUids(){const q=pendingChoiceV49(gameState);return q?q.candidates.map(c=>c.uid):[];}
function choiceTitle(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function dragunityBoard(){
  const ff=mk('未来融合－フューチャー・フュージョン',0);
  const fgd=mk('F・G・D',0);
  const d1=mk('青眼の白龍',0),d2=mk('青眼の白龍',0),d3=mk('青眼の白龍',0);
  const d4=mk('真紅眼の黒竜',0),d5=mk('真紅眼の黒竜',0),d6=mk('真紅眼の黒竜',0);
  const filler=Array.from({length:12},()=>mk('ワイト',0));
  gameState.players[0].hand=[ff];
  gameState.players[0].ex=[fgd];
  gameState.players[0].deck=[d1,d2,d3,d4,d5,d6].concat(filler);
  gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));   /* opponent also draws every turn while we wait */
  return {ff,fgd,dragons:[d1,d2,d3,d4,d5,d6],filler};
}
`;

function scenario(pos){ return COMMON+String.raw`
fresh();
POS_S03='${pos}';
let B=dragunityBoard();
baselineA();
duelActivateFromHand(0);drive();
pickUids(B.dragons.slice(0,5).map(c=>c.uid));drive();
for(let i=0;i<4;i++) advanceToNextStandby();
const f=gameState.players[0].mz.find(c=>c.uid===B.fgd.uid);
ok('${pos}: at the 2nd own Standby Phase F・G・D is Fusion Summoned in face-up ${pos==='def'?'Defense':'Attack'} Position',
  !!f&&f.face==='up'&&f.pos==='${pos}'&&f.specialSummonKind==='fusion',JSON.stringify(f&&{pos:f.pos,kind:f.specialSummonKind}));
audit('${pos}');
API.destroy(findCardByUid(B.ff.uid),'test');drive();flushDeferredEventsV2();drive();
ok('${pos}: still linked — destroying 未来融合 also destroys F・G・D',zoneOf(B.ff)==='grave'&&zoneOf(B.fgd)!=='mz',JSON.stringify({ff:zoneOf(B.ff),fgd:zoneOf(B.fgd)}));
`;}
harness(scenario('def'));
harness(scenario('atk'));

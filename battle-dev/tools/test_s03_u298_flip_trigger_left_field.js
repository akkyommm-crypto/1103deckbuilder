/* S03-U298: a mandatory Flip trigger of a monster that left the field before the trigger was stacked (S03 R1 random-policy sweep, tg_gadget / worm, seed 0x531b004d).
   P0 Normal Summons; P1 chains 激流葬; P0 chains W星雲隕石 (flips P1's face-down ワーム・カルタロス face-up by effect); the chain resolves, 激流葬 destroys every monster.
   The Flip effect is treated as activated on the field (1103 ruling, already used when the SEGOC list is built: treatAsField → logicalZone 'mz'), so ワーム・カルタロス is
   offered in the forced group although it is in the Graveyard. Picking it was refused ("この場所・タイミングで発動できる効果がありません") because eventPickV2 judged the
   card in the Graveyard (no logicalZone): a forced group cannot be skipped, so the duel stopped for ever.
   A: the trigger is offered, picked, stacked, resolves (the choice adds a 「ワーム」 to the hand), the duel is not stuck. Real DUEL path, Replay-audited.
   B: the same with the Flip trigger of a monster that stays on the field (control, unchanged).
   C: save / resume while the forced group is open keeps the trigger pickable. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x298f1a01;
  gameState.players[0].deck=Array.from({length:6},()=>mk('ワイト',0));
  gameState.players[1].deck=[mk('ワーム・ゼクス',1)].concat(Array.from({length:6},()=>mk('ワイト',1)));}
/* answers: p1 activates 激流葬 in the summon window, p0 chains W星雲隕石; everything else passes. stopAtEvt: return when the forced group is open */
function drive(opt){opt=opt||{};for(let i=0;i<400;i++){
  if(pc()){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE&&EVT_V2_STATE.eventName!=='onFlip'){const st=EVT_V2_STATE,g=st.groups[st.rank]||[],k=g.findIndex(c=>c.name==='激流葬');if(opt.respond&&k>=0&&gameState.chain.length===0)eventPickV2(k);else if(g.length&&st.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){if(opt.stopAtEvt)return 'evt';const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length&&st.rank<2){const n=gameState.chain.length;eventPickV2(0);if(!gameState.chain.length&&EVT_V2_STATE===st&&g.length&&!pc())return 'stuck';}else if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){
    const p=gameState.chainWindow.priority,rs=getChainResponsesV2(p)||[];
    const want=rs.find(r=>(p===1&&r.db.n==='激流葬'&&!gameState.chain.length)||(p===0&&r.db.n==='W星雲隕石'&&gameState.chain.length===1));
    if(want&&opt.respond){duelActivateResponseV2(p,want.zone,want.index);continue;}
    chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){
    const p=(w.payload.priority===0||w.payload.priority===1)?w.payload.priority:gameState.activePlayer,rs=pointResponsesV27(p,w.payload)||[];
    const want=rs.find(r=>(p===1&&r.db.n==='激流葬')||(opt.own&&p===0&&r.db.n==='W星雲隕石'));
    if(want&&opt.respond&&!opt.used){opt.used=true;pointActivateV27(p,want.zone,want.index);continue;}
    pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function setup(keepOnField){
  fresh();
  const summoned=mk('ワイト',0),kart=mk('ワーム・カルタロス',1,'down','def'),gk=mk('激流葬',1,'down'),wn=mk('W星雲隕石',0,'down');
  gk.setTurn=4;wn.setTurn=4;
  gameState.players[0].hand=[summoned];gameState.players[0].sz=[wn];gameState.players[1].mz=[kart];gameState.players[1].sz=keepOnField?[]:[gk];
  baselineA();return {summoned,kart,gk,wn};
}
ok('the Worm pool of ワーム・カルタロス is not empty',(function(){fresh();return u52WormSearchPool(1).length>0;})());

/* ===== A: the monster is destroyed after it was flipped, before its Flip trigger is stacked ===== */
{
  const s=setup(false);
  doNormalSummon(0,'atk');
  const r=drive({respond:true,stopAtEvt:true});
  const st=EVT_V2_STATE;
  ok('A: the chain (激流葬, W星雲隕石) resolved: ワーム・カルタロス is in the Graveyard',z(s.kart)==='grave'&&gameState.chain.length===0,JSON.stringify({r,z:z(s.kart),chain:gameState.chain.length}));
  ok('A: the forced group offers ワーム・カルタロス (Flip effect treated as activated on the field)',!!st&&st.eventName==='onFlip'&&st.groups[st.rank].some(c=>c.name==='ワーム・カルタロス'),JSON.stringify({evt:st&&st.eventName,rank:st&&st.rank}));
  const handBefore=gameState.players[1].hand.length;
  const r2=drive({});
  ok('A: picking it works: no refusal toast, the duel is not stuck',r2!=='stuck'&&!TOASTS.some(t=>/この場所・タイミングで発動できる効果がありません/.test(t))&&!EVT_V2_STATE,JSON.stringify({r2,toasts:TOASTS.slice(-3)}));
  ok('A: the Flip effect resolved: a 「ワーム」 was added to P1\'s hand',gameState.players[1].hand.some(c=>cardName(c)==='ワーム・ゼクス')&&gameState.players[1].hand.length===handBefore+1,JSON.stringify(gameState.players[1].hand.map(c=>cardName(c))));
  ok('A: nothing is left pending',!pc()&&!gameState.chain.length&&!EVT_V2_STATE);
  audit('A');
}

/* ===== B: control — without 激流葬 the Flip monster stays on the field and its trigger works as before ===== */
{
  const s=setup(true);
  doNormalSummon(0,'atk');
  const r=drive({respond:true,own:true,stopAtEvt:true});
  const handBefore=gameState.players[1].hand.length;
  const r2=drive({});
  ok('B: ワーム・カルタロス flipped by W星雲隕石 stays on the field',z(s.kart)==='mz'&&r2!=='stuck',JSON.stringify({r,r2,z:z(s.kart)}));
  ok('B: its Flip effect is activated and resolves',gameState.players[1].hand.some(c=>cardName(c)==='ワーム・ゼクス'),JSON.stringify(gameState.players[1].hand.map(c=>cardName(c))));
  audit('B');
}

/* ===== C: save / resume while the forced group is open ===== */
{
  const s=setup(false);
  doNormalSummon(0,'atk');
  drive({respond:true,stopAtEvt:true});
  const open=!!EVT_V2_STATE;
  saveDuel();
  const raw=localStorage.getItem(DUEL_SAVE_KEY);
  ok('C: the forced group was open and a save exists',open&&!!raw);
  resetA();EVT_V2_STATE=null;
  const resumed=offerResumeDuel();
  const st=EVT_V2_STATE;
  ok('C: resume restores the forced group with ワーム・カルタロス',resumed!==false&&!!st&&st.groups[st.rank].some(c=>c.name==='ワーム・カルタロス'),JSON.stringify({resumed,rank:st&&st.rank}));
  const r2=drive({});
  ok('C: after the resume the trigger resolves and the duel is not stuck',r2!=='stuck'&&gameState.players[1].hand.some(c=>cardName(c)==='ワーム・ゼクス'),JSON.stringify({r2,hand:gameState.players[1].hand.map(c=>cardName(c))}));
  audit('C');
}
`);

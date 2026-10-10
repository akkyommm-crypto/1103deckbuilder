/* S03-U296: a save taken while a chain link is resolving and its effect has a legacy choice open (魔轟神レイヴン: 「手札を任意の枚数捨てる」, answered
   one card at a time) resumes by resolving that link again from its start: the choice opens again, the answers finish the effect, the chain ends and the
   once-per-turn use is counted once. Before: the choice was dropped and the link stayed half-resolved (the cost/limit spent, the effect never applied,
   the processor gone). Real DUEL path, fresh VM, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function drive(){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function pick(uid){const q=pc();if(!q)throw Error('no choice');const k=q.candidates.findIndex(x=>x.uid===uid);if(k<0)throw Error('uid '+uid+' not offered');__choicePickV49(k);}
`;
const first=harness(COMMON+String.raw`
resetA();
gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5329604;
const rv=mk('魔轟神レイヴン',0),h1=mk('ワイト',0),h2=mk('はにわ',0);
gameState.players[0].mz=[rv];gameState.players[0].hand=[h1,h2];
gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
baselineA();
duelActivateFromZone(0,'mz',0);
let r=drive();
const q=pc();
ok('VM1: the link resolves into the legacy discard choice (a resolution-time wait is recorded with its start seq)',r==='choice'&&!!q&&q.legacy===true&&/レイヴン/.test(q.title||'')&&!!(q.meta&&q.meta.resolutionWaitS03)&&q.meta.resolutionWaitS03.startSeq!=null
  &&gameState.processorWaiting&&gameState.processorWaiting.type==='SOLVE_CHAIN',JSON.stringify({r,title:q&&q.title,meta:q&&q.meta,w:gameState.processorWaiting&&gameState.processorWaiting.type}));
audit('VM1');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U={rv:rv.uid,h1:h1.uid,h2:h2.uid};
`);
if(!first.__RAW){console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
else{
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  const q=pc();
  ok('VM2: the resume resolves the link again — the discard choice is open again and the hand is untouched',r&&!!q&&/レイヴン/.test(q.title||'')&&zoneOf(U.h1)==='hand'&&zoneOf(U.h2)==='hand'&&gameState.processorWaiting&&gameState.processorWaiting.type==='SOLVE_CHAIN',
    JSON.stringify({r,title:q&&q.title,h1:zoneOf(U.h1),h2:zoneOf(U.h2),w:gameState.processorWaiting&&gameState.processorWaiting.type,toasts:TOASTS.slice(-3)}));
  audit('VM2 right after the resume');
  /* discard ワイト (1st answer), then はにわ, then finish */
  if(pc())pick(U.h1);
  let d=drive();
  let steps=0;
  while(d==='choice'&&steps++<6){const q2=pc();const k=q2.candidates.findIndex(x=>x.uid===U.h2);if(k>=0&&zoneOf(U.h2)==='hand'){__choicePickV49(k);}else{__choicePickV49(Math.max(0,q2.candidates.findIndex(x=>/終了|完了|以上|決定/.test(x.label||''))));}d=drive();}
  ok('VM2: the effect finishes — the chosen cards are discarded, the chain is over, nothing is pending and the processor is free',zoneOf(U.h1)==='grave'&&d==='idle'&&gameState.chain.length===0&&!pc()&&!gameState.processorPaused,
    JSON.stringify({h1:zoneOf(U.h1),h2:zoneOf(U.h2),d,chain:gameState.chain.length,paused:gameState.processorPaused,pc:pc()&&pc().title}));
  ok('VM2: 魔轟神レイヴン got +400 ATK for each of the two discarded cards (the effect was applied once)',(()=>{const h=findCardByUid(U.rv);return !!h&&curATK(h.card)===dbOf(h.card).atk+800;})(),
    JSON.stringify({atk:(()=>{const h=findCardByUid(U.rv);return h?curATK(h.card):null;})()}));
  audit('VM2 after the effect');
  `);
}

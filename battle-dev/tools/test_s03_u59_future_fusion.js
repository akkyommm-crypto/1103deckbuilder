/* S03-U59 未来融合－フューチャー・フュージョン — the pre-errata (2011) card, scripted from data/carddata.json's
   own `e0` field (independently confirmed against a live yugioh-wiki.net fetch; see cards/HF_claude_s03_u59_future_fusion.js
   for the full source note). Known real-duel gap on the fixed Dragunity list (data/r1_lists/known_gaps_v1.json). */
const harness=require('./astra_harness');
const COMMON=String.raw`
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
    { const qS03=pendingChoiceV49(gameState); if(qS03 && /表示形式/.test(qS03.title||'')){ __choicePickV49(0); continue; } }   /* S03-U142: the new position question (answered ATK, as before) */
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

/* ===== A. full cycle: activation reveals F・G・D, sends a real 5-of-6 material choice, and the delayed
   Fusion Summon happens exactly at the 2nd own Standby Phase after activation (not the 1st, and unchained). ===== */
const first=harness(COMMON+String.raw`
fresh();
let B=dragunityBoard();
baselineA();
duelActivateFromHand(0);
ok('A: activating 未来融合－フューチャー・フュージョン creates a chain link with no pending choice yet',
  gameState.chain.length===1&&gameState.chain[0].name==='未来融合－フューチャー・フュージョン'&&!pendingChoiceV49(gameState),
  JSON.stringify({chain:gameState.chain.map(l=>l.name)}));
drive();
ok('A: resolution opens a real material choice for exactly 5-of-6 qualifying Dragon-type monsters (not an arbitrary auto-pick)',
  /F・G・D/.test(choiceTitle()||'')&&choiceUids().length===6,
  JSON.stringify({title:choiceTitle(),cands:choiceUids().length}));
const chosen=B.dragons.slice(0,5), left=B.dragons[5];
pickUids(chosen.map(c=>c.uid));
drive();
ok('A: the 5 chosen Dragons go to the GY as an effect (not a cost); the 6th stays in the Deck; the card stays on the field as a Continuous Spell',
  chosen.every(c=>zoneOf(c)==='grave')&&zoneOf(left)==='deck'&&zoneOf(B.ff)==='sz'&&szNames(0).includes('未来融合－フューチャー・フュージョン'),
  JSON.stringify({grave:graveNames(0),left:zoneOf(left),ff:zoneOf(B.ff)}));
ok('A: F・G・D itself is untouched (still in the Extra Deck) — only confirmed, not summoned, at activation',
  gameState.players[0].ex.some(c=>c.uid===B.fgd.uid),JSON.stringify({ex:gameState.players[0].ex.map(nm)}));
{
  /* real-duel probe R1 0x59310001 first 1, turn 8: getLegalZoneActions offers "⚡ 効果を発動" (duelActivateFromZone)
     for any face-up card with a resolve() — without a guard this let the AI driver re-activate the already-resolved
     未来融合 a second time from the field and double-send materials. */
  const szIdx=gameState.players[0].sz.findIndex(c=>c.uid===B.ff.uid);
  const actions=getLegalZoneActions(0,'sz',szIdx).map(a=>a.id);
  const L=strictScriptLegality('未来融合－フューチャー・フュージョン',0,'sz',szIdx);
  ok('A: once resolved and sitting face-up on the field, 未来融合－フューチャー・フュージョン is never offered as a re-activatable effect',
    !actions.includes('effect')&&!L.ok,JSON.stringify({actions,L}));
}
const scheduled=(gameState.scheduledV7||[]).find(e=>e&&e.handler==='s03u59.future-fusion-summon'&&e.args&&e.args.uid===B.ff.uid);
ok('A: the Fusion Summon is scheduled for the 2nd own Standby Phase after activation (turn+4), journaled in gs.scheduledV7',
  !!scheduled&&scheduled.turnAbs===gameState.turn+4,JSON.stringify({scheduled,turn:gameState.turn}));
audit('A after material choice');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);

advanceToNextStandby();  /* turn+1: opponent's Standby */
ok('A: nothing happens at the opponent-side Standby Phase in between',gameState.players[0].mz.length===0,JSON.stringify({turn:gameState.turn}));
advanceToNextStandby();  /* turn+2: my 1st own Standby Phase after activation */
ok('A: F・G・D is NOT Special Summoned at the 1st own Standby Phase (the 1st/2nd split is the post-2016 errata, not the 2011 card)',
  gameState.players[0].mz.length===0&&gameState.players[0].ex.some(c=>c.uid===B.fgd.uid),
  JSON.stringify({mz:mzNames(0),ex:gameState.players[0].ex.map(nm),turn:gameState.turn}));
advanceToNextStandby();  /* turn+3: opponent's Standby again */
advanceToNextStandby();  /* turn+4: my 2nd own Standby Phase after activation */
ok('A: F・G・D is Special Summoned from the Extra Deck at the 2nd own Standby Phase, with no chain link (unchained scheduled action)',
  mzNames(0).includes('F・G・D')&&!gameState.players[0].ex.some(c=>c.uid===B.fgd.uid)&&!gameState.chain.length,
  JSON.stringify({mz:mzNames(0),ex:gameState.players[0].ex.map(nm),chain:gameState.chain.length,turn:gameState.turn}));
ok('A: the delayed Special Summon is recorded as a Fusion Summon',
  gameState.players[0].mz.some(c=>c.uid===B.fgd.uid&&c.specialSummonKind==='fusion'),
  JSON.stringify(gameState.players[0].mz.map(c=>({name:nm(c),kind:c.specialSummonKind||null}))));
ok('A: the fired schedule entry is consumed (no leftover)',
  !(gameState.scheduledV7||[]).some(e=>e&&e.args&&e.args.uid===B.ff.uid),JSON.stringify(gameState.scheduledV7));
audit('A after the 2nd Standby Phase summon');
const fgdOnField=gameState.players[0].mz.find(c=>c.uid===B.fgd.uid);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:gameState.players[0].mz.findIndex(c=>c.uid===fgdOnField.uid),reason:'U59 test destroy',byDestroy:true});
drive();
ok('B: destroying the Special Summoned F・G・D also destroys 未来融合－フューチャー・フュージョン (linkMutual, matches the printed text)',
  zoneOf(fgdOnField)==='grave'&&zoneOf(B.ff)==='grave',JSON.stringify({fgd:zoneOf(fgdOnField),ff:zoneOf(B.ff)}));
audit('B monster destroyed -> card destroyed');
`);

/* ===== C. the reverse link: destroying 未来融合－フューチャー・フュージョン itself (after the summon) also destroys F・G・D. ===== */
harness(COMMON+String.raw`
fresh();
let B=dragunityBoard();
baselineA();
duelActivateFromHand(0);drive();
pickUids(B.dragons.slice(0,5).map(c=>c.uid));drive();
for(let i=0;i<4;i++) advanceToNextStandby();
ok('C setup: F・G・D was Special Summoned',mzNames(0).includes('F・G・D'));
const fgdOnField=gameState.players[0].mz.find(c=>c.uid===B.fgd.uid);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:gameState.players[0].sz.findIndex(c=>c.uid===B.ff.uid),reason:'U59 test destroy the card itself',byDestroy:true});
drive();
ok('C: destroying 未来融合－フューチャー・フュージョン itself also destroys the F・G・D it Special Summoned (linkMutual, other direction)',
  zoneOf(B.ff)==='grave'&&zoneOf(fgdOnField)==='grave',JSON.stringify({ff:zoneOf(B.ff),fgd:zoneOf(fgdOnField)}));
audit('C card destroyed -> monster destroyed');

/* ===== D. if the card leaves the field before the 2nd own Standby Phase, no Special Summon happens
   (2011 ruling: the delayed Special Summon is not a chain-linked activation, so it simply never fires). ===== */
fresh();
B=dragunityBoard();
baselineA();
duelActivateFromHand(0);drive();
pickUids(B.dragons.slice(0,5).map(c=>c.uid));drive();
ok('D setup: the Fusion Summon is scheduled',(gameState.scheduledV7||[]).some(e=>e&&e.args&&e.args.uid===B.ff.uid));
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:gameState.players[0].sz.findIndex(c=>c.uid===B.ff.uid),reason:'U59 test early removal',byDestroy:true});
drive();
ok('D setup: 未来融合－フューチャー・フュージョン is gone before either Standby Phase fires',zoneOf(B.ff)==='grave');
for(let i=0;i<4;i++) advanceToNextStandby();
ok('D: F・G・D is never Special Summoned once its source card left the field early; it stays safely in the Extra Deck',
  !mzNames(0).includes('F・G・D')&&gameState.players[0].ex.some(c=>c.uid===B.fgd.uid)&&!(gameState.scheduledV7||[]).length,
  JSON.stringify({mz:mzNames(0),ex:gameState.players[0].ex.map(nm),scheduled:gameState.scheduledV7}));
audit('D card left early -> no illegal Special Summon');

/* ===== E. activation negated by a Counter Trap: no material choice ever opens, nothing is scheduled. ===== */
fresh();
B=dragunityBoard();
const jammer=mk('マジック・ジャマー',1,'down');jammer.setTurn=gameState.turn-1;
gameState.players[1].sz=[jammer];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
duelActivateFromHand(0);
const resp=getChainResponsesV2(1).map(x=>x.db.n);
ok('E setup: P2 can respond with マジック・ジャマー',resp.includes('マジック・ジャマー'),JSON.stringify(resp));
if(resp.includes('マジック・ジャマー')) duelActivateResponseV2(1,'sz',0);
/* マジック・ジャマー自身のコスト（手札を1枚捨てる）選択に答えてからチェーンに乗る。 */
for(let k=0;k<6;k++){const r=drive();if(r==='choice'){__choicePickV49(0);continue;}break;}
ok('E: the negated activation never opens the material choice and sends 未来融合 to the GY untouched',
  !pendingChoiceV49(gameState)&&zoneOf(B.ff)==='grave'&&!(gameState.scheduledV7||[]).length&&B.dragons.every(c=>zoneOf(c)==='deck'),
  JSON.stringify({ff:zoneOf(B.ff),scheduled:gameState.scheduledV7,dragons:B.dragons.map(zoneOf)}));
audit('E activation negated');

/* ===== F. an empty Extra Deck: activation is still legal (2011 FAQ shape — legal even when it will fizzle),
   the effect simply fizzles with no crash and nothing scheduled. ===== */
fresh();
const ff2=mk('未来融合－フューチャー・フュージョン',0);
gameState.players[0].hand=[ff2];
gameState.players[0].ex=[];
gameState.players[0].deck=[mk('青眼の白龍',0),mk('青眼の白龍',0)];
baselineA();
const L=strictScriptLegalityV2('未来融合－フューチャー・フュージョン',0,'hand',0,{});
ok('F: activation is legal with an empty Extra Deck',L.ok,JSON.stringify(L));
duelActivateFromHand(0);drive();
ok('F: with nothing to confirm, the effect fizzles without a crash; the card resolves and stays on the field',
  !pendingChoiceV49(gameState)&&zoneOf(ff2)==='sz'&&!(gameState.scheduledV7||[]).length,
  JSON.stringify({ff:zoneOf(ff2),scheduled:gameState.scheduledV7}));
audit('F empty Extra Deck fizzle');
`);

/* ===== G/H. SaveLoad round-trip mid-wait: load into a fresh VM right after the material choice (before either
   Standby Phase fires) and finish the two-Standby-Phase cycle there. ===== */
if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  fresh();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  ok('G: the save/loaded VM restores the scheduled Fusion Summon (journaled in gs.scheduledV7, plain JSON)',
    !!resumed&&(gameState.scheduledV7||[]).some(e=>e&&e.handler==='s03u59.future-fusion-summon'),
    JSON.stringify({resumed,scheduled:gameState.scheduledV7}));
  const ffUid=(gameState.scheduledV7||[]).find(e=>e&&e.handler==='s03u59.future-fusion-summon').args.uid;
  const ff=findCardByUid(ffUid).card;
  for(let i=0;i<4;i++) advanceToNextStandby();
  ok('H: after loading mid-wait, the delayed Fusion Summon still fires correctly at the 2nd own Standby Phase in the new VM',
    mzNames(0).includes('F・G・D')&&!gameState.chain.length,
    JSON.stringify({mz:mzNames(0),turn:gameState.turn}));
  audit('H resumed across a SaveLoad and finished the wait');
  `);
}else{console.log('FAIL A did not reach the save point');process.exitCode=2;}

/* S03-U62 legacy-choice (openPick/API.selectCard/API.confirm) SaveLoad migration.
   Requirement (WORK_QUEUE Ready item, carried over from S03-U41/U49): resolve()/operation()-time choices
   made via the legacy API.selectCard/API.confirm helpers (engine/40_legal_script_engine.js) cannot survive
   a save/reload — the continuation is a bare JS closure, held only in the transient CHOICE_LEGACY_CB_V49
   side table (engine/09_choice_request_v49.js), never journaled. On reload, reconcileChoiceAfterLoadV49()
   deliberately drops any such pending choice rather than corrupt state (a documented, intentional "safe
   abort") — but that means the card's effect silently never completes: a real "wrong result" class bug
   whenever a duel is saved mid-choice on one of these cards (confirmed for real below with 地割れ: an
   opponent monster that should have been destroyed survives untouched after the reload).

   Audit: every CARD_SCRIPTS entry whose resolve() (legacy) or V4 operation() calls API.selectCard,
   API.confirm, or openPick — 48 cards (40 API.selectCard/openPick + 8 API.confirm, 6 counted twice).
   Migrated all 48 to API.requestChoice + a named API.registerChoiceHandler continuation (the same
   SaveLoad-safe P1 ChoiceRequest pattern already established by S03-U41/U49/U58/U59/79_p1_choice_recovery_
   minibatch.js), preserving exact original behavior (including each card's own cancel-aborts-remaining-
   steps semantics, since the legacy API.selectCard/API.confirm's onPick callback simply never ran on
   cancel) — confirmed via the S03-U60 lesson: registry-handler continuations run on cancel too (with
   `answer.cancelled:true`, empty candidates), unlike legacy onPick, so each converted handler explicitly
   guards on `!picks[0]`/`answer.cancelled` before doing anything, matching the original's cancel-does-
   nothing shape.

   Found and fixed two real, pre-existing (unrelated to SaveLoad) sequencing bugs along the way, both from
   calling the async, choice-opening legacy helpers synchronously more than once in the same tick — the
   second call silently overwrote the first pending choice before the player could ever answer it:
     - マッド・リローダー (cards/A8_auto_cycle06.js): a `for` loop called API.selectCard twice in a row;
       only the second (overwriting) choice was ever answerable, so only 1 of the intended 2 hand cards
       was ever discarded, and the draw fired immediately (before either choice resolved) instead of after.
     - 尾も白い黒猫 (cards/9V_class_a_flip_bulk.js): the self-bounce API.selectCard fired synchronously
       right after opening the (already SaveLoad-safe) opponent-bounce v49P1Open choice, overwriting it —
       only the self-bounce choice was ever shown, the opponent-bounce never happened.
   Both are now correctly sequenced (one choice fully resolves before the next opens). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const h=findCardByUid(c.uid);return h&&h.zone;}
function fresh(){
  resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';
}
function drive(){
  for(let i=0;i<600;i++){
    if(pendingChoiceV49(gameState)) return 'choice';
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
      const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
      if(g.length) eventPickV2(0); else eventSkipGroupV2();
      continue;
    }
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    return 'idle';
  }
  return 'loop';
}
function pickUid(uid){
  const q=pendingChoiceV49(gameState);
  if(!q) return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);
  if(i<0) return false;
  __choicePickV49(i);
  return true;
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
`;

/* ===== A. the bug that started this unit, confirmed and fixed: 地割れ's tiebreak choice now survives a
   SaveLoad round-trip and completes correctly (destroys a monster for real) in the reloaded VM, instead of
   silently vanishing (the pre-fix behavior: neither monster was ever destroyed). ===== */
const first=harness(COMMON+String.raw`
fresh();
const jichiware=mk('地割れ',0);
const t1=mk('ワイト',1),t2=mk('ワイト',1);
gameState.players[0].hand=[jichiware];
gameState.players[1].mz=[t1,t2];
baselineA();
duelActivateFromHand(0);
const dr=drive();
ok('A setup: 地割れ opens a tiebreak choice mid-resolution (both candidates tied for lowest ATK)',
  dr==='choice'&&pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).candidates.length===2,
  JSON.stringify(pendingChoiceV49(gameState)));
ok('A: the pending choice now uses the SaveLoad-safe registry resume mode, not legacy',
  pendingChoiceV49(gameState).resume.mode==='registry',JSON.stringify(pendingChoiceV49(gameState).resume));
saveDuel();
globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);
if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  fresh();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  ok('A: the save/load restores the pending choice (the bug: this used to be silently dropped)',
    resumed&&!!pendingChoiceV49(gameState),JSON.stringify({resumed,pending:pendingChoiceV49(gameState)}));
  const targetUid=pendingChoiceV49(gameState).candidates[0].uid;
  pickUid(targetUid);
  drive();
  ok('A: after reload, answering the restored choice actually destroys a monster for real',
    gameState.players[1].mz.filter(c=>zoneOf(c)==='mz').length===1&&
    (gameState.players[1].grave.some(c=>c.uid===targetUid)),
    JSON.stringify({mz:gameState.players[1].mz.map(nm),grave:gameState.players[1].grave.map(nm)}));
  audit('A resumed 地割れ completes correctly');
  `);
}else{console.log('FAIL A: did not reach the save point');process.exitCode=2;}

/* ===== B. 暗黒界の取引 (major-deck card): full 2-step real-duel cycle, then a second run confirming the
   SaveLoad round-trip mid-second-choice completes correctly. ===== */
harness(COMMON+String.raw`
fresh();
const trade=mk('暗黒界の取引',0);
const mine1=mk('ワイト',0),mine2=mk('ワイト',0);
const foe1=mk('ワイト',1),foe2=mk('ワイト',1);
gameState.players[0].hand=[trade,mine1,mine2];
gameState.players[1].hand=[foe1,foe2];
gameState.players[0].deck=[mk('ワイト',0)];
gameState.players[1].deck=[mk('ワイト',1)];
baselineA();
duelActivateFromHand(0);
drive();
pickUid(mine1.uid);
drive();
pickUid(foe1.uid);
drive();
ok('B: 暗黒界の取引 full cycle — both players discarded their picked card and drew for real',
  zoneOf(mine1)==='grave'&&zoneOf(foe1)==='grave',
  JSON.stringify({mine1:zoneOf(mine1),foe1:zoneOf(foe1)}));
audit('B dark world trade full cycle');
`);
const second=harness(COMMON+String.raw`
fresh();
const trade=mk('暗黒界の取引',0);
const mine1=mk('ワイト',0);
const foe1=mk('ワイト',1);
gameState.players[0].hand=[trade,mine1];
gameState.players[1].hand=[foe1];
gameState.players[0].deck=[mk('ワイト',0)];
gameState.players[1].deck=[mk('ワイト',1)];
baselineA();
duelActivateFromHand(0);
drive();
pickUid(mine1.uid);
drive();
ok('B setup: second choice pending right before the save point',
  pendingChoiceV49(gameState)&&/相手が捨てる/.test(pendingChoiceV49(gameState).title));
saveDuel();
globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);
if(second.__RAW){
  harness('const RAW='+JSON.stringify(second.__RAW)+';'+COMMON+String.raw`
  fresh();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  ok('B: the second choice also survives a SaveLoad round-trip',resumed&&!!pendingChoiceV49(gameState));
  const foeUid=pendingChoiceV49(gameState).candidates[0].uid;
  pickUid(foeUid);
  drive();
  ok('B: after reload, the opponent discard completes for real',gameState.players[1].grave.some(c=>c.uid===foeUid));
  audit('B resumed dark world trade completes correctly');
  `);
}else{console.log('FAIL B: did not reach the save point');process.exitCode=2;}

/* ===== C. 氷結界の龍 トリシューラ: 3-step recursive real-duel cycle, triggered via a real Special Summon
   (not a direct resolve() call) so the card's own condition()/passive fire for real. ===== */
harness(COMMON+String.raw`
fresh();
const trishula=mk('氷結界の龍 トリシューラ',0);
gameState.players[0].hand=[trishula];
const foeHand=mk('ワイト',1),foeField=mk('ワイト',1),foeGrave=mk('ワイト',1);
gameState.players[1].hand=[foeHand];
gameState.players[1].mz=[foeField];
gameState.players[1].grave=[foeGrave];
baselineA();
API.specialSummon(0,'hand',0,'atk','test synchro summon');
flushDeferredEventsThroughProcessorV27();
drive();
pickUid(foeHand.uid); drive();
pickUid(foeField.uid); drive();
pickUid(foeGrave.uid); drive();
ok('C: all three zones banished exactly 1 each via three sequential, SaveLoad-safe choices',
  zoneOf(foeHand)==='banish'&&zoneOf(foeField)==='banish'&&zoneOf(foeGrave)==='banish',
  JSON.stringify({hand:zoneOf(foeHand),field:zoneOf(foeField),grave:zoneOf(foeGrave)}));
audit('C trishula full cycle');
`);

/* ===== D. マッド・リローダー: confirmed pre-existing sequencing bug (see file header) is fixed — both
   hand cards are now actually discarded (the original synchronous double-selectCard-in-a-loop silently
   overwrote the first choice, so only 1 of 2 was ever discarded, and the draw fired before either
   resolved). ===== */
harness(COMMON+String.raw`
fresh();
const reloader=mk('マッド・リローダー',0);
const h1=mk('ワイト',0),h2=mk('ワイト',0);
gameState.players[0].grave=[reloader];
gameState.players[0].hand=[h1,h2];
gameState.players[0].deck=Array.from({length:5},()=>mk('ワイト',0));
baselineA();
CARD_SCRIPTS['マッド・リローダー'].resolve({player:0,opponent:1,card:reloader});
drive();
pickUid(h1.uid); drive();
ok('D: after the first pick, the second choice offers only the remaining hand card (not overwritten)',
  zoneOf(h1)==='grave'&&pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).candidates.length===1&&pendingChoiceV49(gameState).candidates[0].uid===h2.uid,
  JSON.stringify({h1:zoneOf(h1),pending:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).candidates}));
pickUid(h2.uid); drive();
ok('D: both hand cards are discarded for real (the bug: only 1 of 2 used to be), then 2 cards drawn',
  zoneOf(h1)==='grave'&&zoneOf(h2)==='grave'&&gameState.players[0].hand.length===2,
  JSON.stringify({h1:zoneOf(h1),h2:zoneOf(h2),hand:gameState.players[0].hand.length}));
audit('D mad reloader sequential fix');
`);

/* ===== E. 尾も白い黒猫: confirmed pre-existing sequencing bug (see file header) is fixed — the
   opponent-bounce choice is no longer silently overwritten by the self-bounce choice opened in the same
   tick; both now resolve in sequence via a real Flip Summon. ===== */
harness(COMMON+String.raw`
fresh();
const cat=mk('尾も白い黒猫',0,'down','def');
const mine1=mk('ワイト',0),mine2=mk('ワイト',0);
const foe1=mk('ワイト',1),foe2=mk('ワイト',1),foe3=mk('ワイト',1);
gameState.players[0].mz=[cat,mine1,mine2];
gameState.players[1].mz=[foe1,foe2,foe3];
baselineA();
doFlipUp(0,'mz',0,'atk');
flushDeferredEventsThroughProcessorV27();
drive();
pickUid(mine1.uid);
drive();
ok('E: after the self-bounce pick, the opponent-bounce choice opens for real (not skipped/overwritten)',
  zoneOf(mine1)==='hand'&&pendingChoiceV49(gameState)&&/相手モンスター/.test(pendingChoiceV49(gameState).title),
  JSON.stringify({mine1:zoneOf(mine1),pending:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title}));
const foeUids=pendingChoiceV49(gameState).candidates.map(c=>c.uid);
foeUids.slice(0,2).forEach(pickUid);
__choiceCommitV49();
drive();
const bouncedFoes=[foe1,foe2,foe3].filter(c=>zoneOf(c)==='hand').length;
ok('E: exactly 2 opponent monsters are bounced for real (the bug: this used to never happen at all)',
  bouncedFoes===2,JSON.stringify({foe1:zoneOf(foe1),foe2:zoneOf(foe2),foe3:zoneOf(foe3)}));
audit('E tail-white-cat sequential fix');
`);

/* ===== F. 酒呑童子: a converted API.confirm-based card (yes/no, not a card pick) full real-duel cycle. ===== */
harness(COMMON+String.raw`
fresh();
const shuten=mk('酒呑童子',0);
const u1=mk('ゾンビキャリア',0),u2=mk('ゾンビキャリア',0);
const alreadyBanished=mk('ゾンビキャリア',0,'up'); // makes d3ShutenReturnable() non-empty too, so both branches are offered
gameState.players[0].mz=[shuten];
gameState.players[0].grave=[u1,u2];
gameState.players[0].banish=[alreadyBanished];
gameState.players[0].deck=[mk('ワイト',0)];
baselineA();
duelActivateFromZone(0,'mz',0);
drive();
ok('F setup: 酒呑童子 opens a yes/no choice (both branches available)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).kind==='yesno',JSON.stringify(pendingChoiceV49(gameState)));
__choicePickV49(0);
drive();
ok('F: answering "yes" opens the real banish-2 choice (SaveLoad-safe registry resume)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).candidates.length===2&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
const uids=pendingChoiceV49(gameState).candidates.map(c=>c.uid);
uids.forEach(pickUid);
__choiceCommitV49();
drive();
ok('F: both GY monsters banished for real and a card drawn',
  zoneOf(u1)==='banish'&&zoneOf(u2)==='banish'&&gameState.players[0].hand.length===1,
  JSON.stringify({u1:zoneOf(u1),u2:zoneOf(u2),hand:gameState.players[0].hand.length}));
audit('F shuten doji confirm-based full cycle');
`);

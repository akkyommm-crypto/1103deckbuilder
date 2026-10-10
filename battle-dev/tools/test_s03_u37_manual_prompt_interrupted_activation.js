/* S03-U37 C-S03-28 MANUAL prompts — a MANUAL activation saved while a 「チェーンしますか？」 sheet is still waiting.
   Requirement: in MANUAL, askChain (before the effect) and confirmTargets (after the target is chosen) wait for a click through a UI
   closure and create no pending choice. A save taken while such a sheet waits — with nothing happening after it opened — must resume
   with that unfinished activation undone. If anything was journaled after the sheet opened (e.g. the opponent chained), the save must
   not roll anything back.
   Before this unit (measured on the U36 build, scratchpad u37_manual_sheet_probe.js): ハリケーン (askChain waiting) and サイクロン
   (confirmTargets waiting) reloaded stranded face-up in the Spell & Trap Zone.
   ASK_CHAIN is on so the sheets really wait; setTimeout-rendered sheets are not needed because the prompt is noted synchronously.
   Cards named here: ハリケーン, サイクロン, マジック・ジャマー, 奈落の落とし穴 (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(uid){const h=findCardByUid(uid);return h?h.zone+'/'+h.card.face:null;}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)return false;const i=q.candidates.findIndex(x=>x.uid===uid);if(i<0)return false;__choicePickV49(i);return true;}
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',(allowEmpty||pkg.actions.length>0)&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,220));}
`;
function scenario(label, setup, check){
  const first=harness(COMMON+String.raw`
  resetA();PLAY_MODE=PLAY_MODES.MANUAL;ASK_CHAIN=true;gameState.activePlayer=0;gameState.phase='main1';
  `+setup+String.raw`
  saveDuel();const RAWOBJ=JSON.parse(localStorage.getItem(DUEL_SAVE_KEY));
  globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U=U;globalThis.__SAVED=RAWOBJ.interruptedPromptS03||null;
  `);
  if(!first.__RAW){console.log('FAIL '+label+' did not reach the save point');process.exitCode=2;return;}
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';const SAVED='+JSON.stringify(first.__SAVED)+';'+COMMON+String.raw`
  resetA();PLAY_MODE=PLAY_MODES.MANUAL;localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  `+check);
}

/* ===== A. askChain waiting (ハリケーン, the opponent holds a set マジック・ジャマー) ===== */
scenario('A',String.raw`
  const hur=mk('ハリケーン',0);gameState.players[0].hand=[hur];
  const mj=mk('マジック・ジャマー',1,'down');mj.setTurn=gameState.turn-1;gameState.players[1].sz=[mj];gameState.players[1].hand=[mk('ワイト',1)];baselineA();
  const U={hur:hur.uid,mj:mj.uid};
  activateFromHand(0);
  ok('A setup: the askChain sheet is waiting and no choice is pending',!!PENDING_CONTINUE&&!pendingChoiceV49(gameState)&&z(hur.uid)==='sz/up',JSON.stringify({pc:!!PENDING_CONTINUE,hur:z(hur.uid)}));
`,String.raw`
  ok('A: the save carried the prompt marker and the resume undid ハリケーン (back in the hand, マジック・ジャマー still set)',
    resumed&&!!SAVED&&TOASTS.some(t=>/発動を取り消し/.test(t))&&z(U.hur)==='hand/up'&&z(U.mj)==='sz/down',
    JSON.stringify({resumed,SAVED,toasts:TOASTS,hur:z(U.hur),mj:z(U.mj)}));
  audit('A after resume',true);
  ASK_CHAIN=false;activateFromHand(gameState.players[0].hand.findIndex(c=>c.uid===U.hur));
  ok('A: activated again (no prompt), ハリケーン returns マジック・ジャマー to the hand',(z(U.mj)||'').startsWith('hand')&&(z(U.hur)||'').startsWith('grave'),
    JSON.stringify({mj:z(U.mj),hur:z(U.hur)}));
  audit('A continued');
`);

/* ===== B. confirmTargets waiting (サイクロン has chosen 奈落の落とし穴; the opponent could chain マジック・ジャマー) ===== */
scenario('B',String.raw`
  const cyc=mk('サイクロン',0);gameState.players[0].hand=[cyc];
  const pit=mk('奈落の落とし穴',1,'down');pit.setTurn=gameState.turn-1;const mj=mk('マジック・ジャマー',1,'down');mj.setTurn=gameState.turn-1;
  gameState.players[1].sz=[pit,mj];gameState.players[1].hand=[mk('ワイト',1)];baselineA();
  const U={cyc:cyc.uid,pit:pit.uid,mj:mj.uid};
  askChain=(label,cb)=>{if(typeof cb==='function')cb();};   /* skip the first sheet; confirmTargets still waits */
  activateFromHand(0);pickUid(pit.uid);
  ok('B setup: the target is chosen, the confirmTargets sheet is waiting and no choice is pending',
    !pendingChoiceV49(gameState)&&z(pit.uid)==='sz/down'&&z(cyc.uid)==='sz/up',JSON.stringify({pit:z(pit.uid),cyc:z(cyc.uid)}));
`,String.raw`
  ok('B: the resume undid サイクロン (back in the hand) and 奈落の落とし穴 is still set',
    resumed&&!!SAVED&&TOASTS.some(t=>/発動を取り消し/.test(t))&&z(U.cyc)==='hand/up'&&z(U.pit)==='sz/down'&&z(U.mj)==='sz/down',
    JSON.stringify({SAVED,toasts:TOASTS,cyc:z(U.cyc),pit:z(U.pit)}));
  audit('B after resume',true);
`);

/* ===== C. control: something was journaled after the sheet opened → no rollback ===== */
scenario('C',String.raw`
  const hur=mk('ハリケーン',0);gameState.players[0].hand=[hur];
  const mj=mk('マジック・ジャマー',1,'down');mj.setTurn=gameState.turn-1;const w=mk('ワイト',1);gameState.players[1].sz=[mj];gameState.players[1].hand=[w];baselineA();
  const U={hur:hur.uid,w:w.uid};
  activateFromHand(0);
  act({type:'MOVE',player:1,from:'hand',fromIndex:0,to:'sz',face:'down'});   /* the opponent does something instead of answering */
  ok('C setup: an Action was journaled after the askChain sheet opened',!!PENDING_CONTINUE&&z(w.uid)==='sz/down'&&!pendingChoiceV49(gameState),JSON.stringify({pc:!!PENDING_CONTINUE,w:z(w.uid)}));
`,String.raw`
  ok('C: the save carries no prompt marker and nothing is rolled back (the pre-U37 behaviour)',
    resumed&&!SAVED&&!TOASTS.some(t=>/発動を取り消し/.test(t))&&z(U.hur)==='sz/up'&&z(U.w)==='sz/down',
    JSON.stringify({SAVED,toasts:TOASTS,hur:z(U.hur),w:z(U.w)}));
  audit('C after resume');
`);

/* ===== D. control: the sheet was answered and the effect resolved → no marker, no rollback ===== */
scenario('D',String.raw`
  const hur=mk('ハリケーン',0);gameState.players[0].hand=[hur];
  const mj=mk('マジック・ジャマー',1,'down');mj.setTurn=gameState.turn-1;gameState.players[1].sz=[mj];gameState.players[1].hand=[mk('ワイト',1)];baselineA();
  const U={hur:hur.uid,mj:mj.uid};
  /* 「チェーンしない」 on askChain. confirmTargets arms its continuation in a timer the harness never runs, so the second sheet is
     switched off before answering: the effect then resolves straight away. */
  activateFromHand(0);ASK_CHAIN=false;chainPassed();
  ok('D setup: the sheet was answered and ハリケーン resolved before the save',!PENDING_CONTINUE&&(z(mj.uid)||'').startsWith('hand'),JSON.stringify({pc:!!PENDING_CONTINUE,mj:z(mj.uid)}));
`,String.raw`
  ok('D: after the sheet is answered the effect resolved; the save carries no marker and the resume keeps the result',
    resumed&&!SAVED&&!TOASTS.some(t=>/発動を取り消し/.test(t))&&(z(U.mj)||'').startsWith('hand')&&(z(U.hur)||'').startsWith('grave'),
    JSON.stringify({SAVED,toasts:TOASTS,hur:z(U.hur),mj:z(U.mj)}));
  audit('D after resume');
`);

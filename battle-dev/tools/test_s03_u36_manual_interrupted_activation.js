/* S03-U36 C-S03-28 MANUAL — a MANUAL activation saved while its legacy cost / target / search choice is open.
   Requirement: the same as S03-U35, on the MANUAL routes the user plays (openHand → 「⚡ 発動（効果を自動処理）」 → activateFromHand,
   and a set card's zone menu → activateFromZone): resuming such a save must undo the unfinished activation instead of leaving the
   card face-up in the Spell & Trap Zone, and Replay must stay consistent.
   Before this unit (measured on the U35 build, scratchpad u36_manual_interrupt_probe.js): MANUAL サイクロン and pre-U58 増援 reloaded
   stranded face-up, the choice carried no activation marker, and the Replay audit after the resume failed (finalDigest).
   askChain is stubbed and ASK_CHAIN is off, so the MANUAL 「チェーンしますか？」 sheets (askChain, confirmTargets) continue at once;
   a save while one of those sheets is open (no pending choice) is not covered.
   Cards named here: サイクロン, マジック・ジャマー, 増援, マジック・ストライカー, ダッシュ・ウォリアー, ハリケーン (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
askChain=(label,cb)=>{TOASTS.push('askChain:'+label);if(typeof cb==='function')cb();};
/* the MANUAL 「チェーンしますか？」 sheets (askChain and confirmTargets) wait for a click; with ASK_CHAIN off both continue at once */
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function z(uid){const h=findCardByUid(uid);return h?h.zone+'/'+h.card.face:null;}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)return false;const i=q.candidates.findIndex(x=>x.uid===uid);if(i<0)return false;__choicePickV49(i);return true;}
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',(allowEmpty||pkg.actions.length>0)&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,220));}
`;
function scenario(label, setup, check){
  const first=harness(COMMON+String.raw`
  resetA();PLAY_MODE=PLAY_MODES.MANUAL;gameState.activePlayer=0;gameState.phase='main1';
  `+setup+String.raw`
  const q=pendingChoiceV49(gameState);
  ok('${label} setup: in MANUAL a legacy choice is open and carries the activation marker',
    PLAY_MODE===PLAY_MODES.MANUAL&&!!q&&q.legacy===true&&!!(q.meta&&q.meta.activationPrepS03),JSON.stringify(q&&{title:q.title,legacy:q.legacy,meta:q.meta}));
  saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U=U;
  `);
  if(!first.__RAW){console.log('FAIL '+label+' did not reach the save point');process.exitCode=2;return;}
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();PLAY_MODE=PLAY_MODES.MANUAL;localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  ok('${label}: the save resumes with a notice that the unfinished activation was undone, and no choice is left',
    resumed&&TOASTS.some(t=>/発動を取り消し/.test(t))&&!pendingChoiceV49(gameState),JSON.stringify({resumed,toasts:TOASTS,pending:!!pendingChoiceV49(gameState)}));
  `+check);
}

/* ===== A. MANUAL サイクロン from the hand ===== */
scenario('A',String.raw`
  const cyc=mk('サイクロン',0);gameState.players[0].hand=[cyc];
  const t=mk('マジック・ジャマー',1,'down');t.setTurn=gameState.turn-1;gameState.players[1].sz=[t];baselineA();
  const U={cyc:cyc.uid,t:t.uid};
  activateFromHand(0);
`,String.raw`
  ok('A: サイクロン is back in the hand; マジック・ジャマー is still set',z(U.cyc)==='hand/up'&&z(U.t)==='sz/down'&&gameState.players[0].sz.length===0,
    JSON.stringify({cyc:z(U.cyc),t:z(U.t)}));
  audit('A after resume',true);
  activateFromHand(gameState.players[0].hand.findIndex(c=>c.uid===U.cyc));pickUid(U.t);
  ok('A: activating it again in MANUAL destroys マジック・ジャマー',(z(U.t)||'').startsWith('grave'),JSON.stringify({t:z(U.t),cyc:z(U.cyc),toasts:TOASTS.slice(-3)}));
  audit('A continued');
`);

/* ===== B. MANUAL set サイクロン from the zone menu ===== */
scenario('B',String.raw`
  const cyc=mk('サイクロン',0,'down');cyc.setTurn=gameState.turn-1;gameState.players[0].sz=[cyc];
  const t=mk('マジック・ジャマー',1,'down');t.setTurn=gameState.turn-1;gameState.players[1].sz=[t];baselineA();
  const U={cyc:cyc.uid,t:t.uid};
  activateFromZone(0,'sz',0);
`,String.raw`
  ok('B: the set サイクロン is face-down again',z(U.cyc)==='sz/down'&&z(U.t)==='sz/down',JSON.stringify({cyc:z(U.cyc),t:z(U.t)}));
  audit('B after resume',true);
`);

/* ===== C. MANUAL 増援 after U58: the activation completes and the resolution Deck choice is restored ===== */
{
  const first=harness(COMMON+String.raw`
  resetA();PLAY_MODE=PLAY_MODES.MANUAL;gameState.activePlayer=0;gameState.phase='main1';
  const rf=mk('増援',0);gameState.players[0].hand=[rf];
  const ms=mk('マジック・ストライカー',0,'down'),dw=mk('ダッシュ・ウォリアー',0,'down');gameState.players[0].deck=[ms,dw];baselineA();
  const U={rf:rf.uid,ms:ms.uid,dw:dw.uid};
  activateFromHand(0);
  const q=pendingChoiceV49(gameState);
  ok('C setup: post-U58 MANUAL 増援 is a resolution choice, not an unfinished activation choice',
    PLAY_MODE===PLAY_MODES.MANUAL&&!!q&&q.legacy!==true&&!(q.meta&&q.meta.activationPrepS03)&&/増援/.test(String(q.title||''))&&z(rf.uid)==='grave/up',
    JSON.stringify(q&&{title:q.title,legacy:q.legacy,meta:q.meta,rf:z(rf.uid)}));
  saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U=U;
  `);
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();PLAY_MODE=PLAY_MODES.MANUAL;localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  const q=pendingChoiceV49(gameState);
  ok('C: the resolution choice is restored without rollback',
    resumed&&!TOASTS.some(t=>/発動を取り消し/.test(t))&&!!q&&/増援/.test(String(q.title||''))&&z(U.rf)==='grave/up'&&z(U.ms)==='deck/down'&&z(U.dw)==='deck/down',
    JSON.stringify({resumed,toasts:TOASTS,pending:!!q,title:q&&q.title,rf:z(U.rf),ms:z(U.ms),dw:z(U.dw)}));
  pickUid(U.dw);
  ok('C: choosing after resume adds ダッシュ・ウォリアー',
    (z(U.dw)||'').startsWith('hand')&&z(U.ms)==='deck/down'&&(z(U.rf)||'').startsWith('grave'),
    JSON.stringify({rf:z(U.rf),ms:z(U.ms),dw:z(U.dw)}));
  audit('C continued');
  `);
}

/* ===== D. the marker never outlives a finished MANUAL activation: ハリケーン (no choice) first, then サイクロン ===== */
scenario('D',String.raw`
  const hur=mk('ハリケーン',0),cyc=mk('サイクロン',0);gameState.players[0].hand=[hur,cyc];
  const s1=mk('マジック・ジャマー',1,'down');s1.setTurn=gameState.turn-1;gameState.players[1].sz=[s1];
  const w=mk('ワイト',1,'down');w.setTurn=gameState.turn-1;
  baselineA();
  activateFromHand(0);
  const afterHurricane={s1:z(s1.uid)};
  const tgt=mk('マジック・ジャマー',1,'down');tgt.setTurn=gameState.turn-1;gameState.players[1].sz.push(tgt);
  const U={hur:hur.uid,cyc:cyc.uid,s1:s1.uid,tgt:tgt.uid,afterHurricane};
  activateFromHand(gameState.players[0].hand.findIndex(c=>c.uid===cyc.uid));
`,String.raw`
  ok('D: only サイクロン is undone — ハリケーン has resolved (its bounce stays), サイクロン is back in the hand',
    z(U.cyc)==='hand/up'&&(z(U.hur)||'').startsWith('grave')&&U.afterHurricane.s1&&U.afterHurricane.s1.startsWith('hand')&&(z(U.s1)||'').startsWith('hand'),
    JSON.stringify({cyc:z(U.cyc),hur:z(U.hur),s1:z(U.s1),afterHurricane:U.afterHurricane}));
  audit('D after resume');
`);

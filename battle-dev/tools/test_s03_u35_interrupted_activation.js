/* S03-U35 C-S03-28 INTERRUPTED_ACTIVATION_RECOVERY — a save taken while an activation is still choosing its cost or target.
   Requirement: the autosave runs after every Action, so a save can land after a Spell/Trap was moved to the Spell & Trap Zone
   (or flipped face-up) but before its legacy cost/target choice was answered. Resuming that save must not leave the card
   stranded face-up with no chain link: the activation is rolled back to the position before it began, and play continues.
   Before this unit (measured on the U34 build): サイクロン from the hand, a set サイクロン, マジック・ジャマー paying its cost
   in chain, and pre-U58 増援 all reloaded face-up in the Spell & Trap Zone with no chain link and no choice.
   Cards named here: サイクロン, マジック・ジャマー, 増援, マジック・ストライカー, ダッシュ・ウォリアー, オネスト, 強欲で謙虚な壺
   (TESTED); ワイト, はにわ (GENERIC_OK); 天使の施し (TESTED). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function z(uid){const h=findCardByUid(uid);return h?h.zone+'/'+h.card.face:null;}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)return false;const i=q.candidates.findIndex(x=>x.uid===uid);if(i<0)return false;__choicePickV49(i);return true;}
/* allowEmpty: a rollback to the very start of the Journal legitimately leaves no Actions */
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',(allowEmpty||pkg.actions.length>0)&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,220));}
`;
/* VM1 runs setup (which must end with a legacy choice open) and saves; VM2 resumes and runs check. */
function scenario(label, setup, check){
  const first=harness(COMMON+String.raw`
  resetA();gameState.activePlayer=0;gameState.phase='main1';
  `+setup+String.raw`
  const q=pendingChoiceV49(gameState);
  ok('${label} setup: a legacy cost/target choice is open and carries the activation marker',
    !!q&&q.legacy===true&&!!(q.meta&&q.meta.activationPrepS03),JSON.stringify(q&&{title:q.title,legacy:q.legacy,meta:q.meta}));
  saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U=U;
  `);
  if(!first.__RAW){console.log('FAIL '+label+' did not reach the save point');process.exitCode=2;return;}
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  ok('${label}: the save resumes, with a notice that the unfinished activation was undone',
    resumed&&TOASTS.some(t=>/発動を取り消し/.test(t))&&!pendingChoiceV49(gameState)&&!duelFlowBusyReasonV30()===!gameState.chain.length,
    JSON.stringify({resumed,toasts:TOASTS,pending:!!pendingChoiceV49(gameState),busy:duelFlowBusyReasonV30(),chain:gameState.chain.length}));
  `+check);
}

/* ===== A. サイクロン from the hand, target choice open ===== */
scenario('A',String.raw`
  const cyc=mk('サイクロン',0);gameState.players[0].hand=[cyc];
  const t=mk('マジック・ジャマー',1,'down');t.setTurn=gameState.turn-1;gameState.players[1].sz=[t];baselineA();
  const U={cyc:cyc.uid,t:t.uid};
  duelActivateFromHand(0);
`,String.raw`
  ok('A: サイクロン is back in the hand, no chain link, the set マジック・ジャマー untouched',
    z(U.cyc)==='hand/up'&&gameState.chain.length===0&&z(U.t)==='sz/down'&&gameState.players[0].sz.length===0,
    JSON.stringify({cyc:z(U.cyc),t:z(U.t),chain:gameState.chain.length}));
  audit('A after resume',true);
  duelActivateFromHand(gameState.players[0].hand.findIndex(c=>c.uid===U.cyc));pickUid(U.t);drive();
  ok('A: activating サイクロン again works and destroys マジック・ジャマー',z(U.t)==='grave/up'||(z(U.t)||'').startsWith('grave'),JSON.stringify({t:z(U.t),cyc:z(U.cyc)}));
  audit('A continued');
`);

/* ===== B. a set サイクロン, target choice open ===== */
scenario('B',String.raw`
  const cyc=mk('サイクロン',0,'down');cyc.setTurn=gameState.turn-1;gameState.players[0].sz=[cyc];
  const t=mk('マジック・ジャマー',1,'down');t.setTurn=gameState.turn-1;gameState.players[1].sz=[t];baselineA();
  const U={cyc:cyc.uid,t:t.uid};
  duelActivateFromZone(0,'sz',0);
`,String.raw`
  ok('B: the set サイクロン is face-down again in the Spell & Trap Zone, no chain link',
    z(U.cyc)==='sz/down'&&gameState.chain.length===0&&z(U.t)==='sz/down',JSON.stringify({cyc:z(U.cyc),t:z(U.t)}));
  audit('B after resume',true);
  duelActivateFromZone(0,'sz',0);pickUid(U.t);drive();
  ok('B: activating it again works',(z(U.t)||'').startsWith('grave')&&(z(U.cyc)||'').startsWith('grave'),JSON.stringify({t:z(U.t),cyc:z(U.cyc)}));
  audit('B continued');
`);

/* ===== C. マジック・ジャマー in chain, discard-cost choice open ===== */
scenario('C',String.raw`
  const alms=mk('天使の施し',0);gameState.players[0].hand=[alms];
  gameState.players[0].deck=[mk('ワイト',0,'down'),mk('はにわ',0,'down'),mk('オネスト',0,'down')];
  const mj=mk('マジック・ジャマー',1,'down');mj.setTurn=gameState.turn-1;gameState.players[1].sz=[mj];
  const w=mk('ワイト',1),hn=mk('はにわ',1);gameState.players[1].hand=[w,hn];baselineA();
  const U={alms:alms.uid,mj:mj.uid,w:w.uid,h:hn.uid};
  duelActivateFromHand(0);
  duelActivateResponseV2(1,'sz',0);
`,String.raw`
  ok('C: マジック・ジャマー is set again, P2 keeps both cards, 天使の施し is still chain link 1 and P2 has priority',
    z(U.mj)==='sz/down'&&z(U.w)==='hand/up'&&z(U.h)==='hand/up'&&gameState.chain.length===1&&gameState.chain[0].name==='天使の施し'
    &&!!gameState.chainWindow&&gameState.chainWindow.priority===1,
    JSON.stringify({mj:z(U.mj),w:z(U.w),h:z(U.h),chain:gameState.chain.map(l=>l.name),win:gameState.chainWindow}));
  audit('C after resume',true);
  duelActivateResponseV2(1,'sz',0);pickUid(U.h);
  for(let k=0;k<6;k++){const r=drive();if(r==='choice'){__choicePickV49(0);continue;}break;}
  ok('C: P2 responds again with マジック・ジャマー, discarding はにわ, and 天使の施し is negated',
    (z(U.h)||'').startsWith('grave')&&(z(U.alms)||'').startsWith('grave')&&gameState.players[0].hand.length===0&&gameState.chain.length===0,
    JSON.stringify({h:z(U.h),alms:z(U.alms),hand0:gameState.players[0].hand.map(nm),chain:gameState.chain.length,toasts:TOASTS.slice(-3)}));
  audit('C continued');
`);

/* ===== D. 増援 after U58: no activation choice; a save after activation keeps the chain link ===== */
{
  const first=harness(COMMON+String.raw`
  resetA();gameState.activePlayer=0;gameState.phase='main1';
  const r=mk('増援',0);gameState.players[0].hand=[r];
  const ms=mk('マジック・ストライカー',0,'down'),dw=mk('ダッシュ・ウォリアー',0,'down');gameState.players[0].deck=[ms,dw];baselineA();
  const U={r:r.uid,ms:ms.uid,dw:dw.uid};
  duelActivateFromHand(0);
  ok('D setup: post-U58 増援 creates a chain link without an activation Deck choice',
    !pendingChoiceV49(gameState)&&gameState.chain.length===1&&gameState.chain[0].name==='増援'&&z(r.uid)==='sz/up',
    JSON.stringify({choice:pendingChoiceV49(gameState),chain:gameState.chain.map(l=>l.name),r:z(r.uid)}));
  saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U=U;
  `);
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  ok('D: completed 増援 activation is resumed as a chain link, not rolled back',
    resumed&&!TOASTS.some(t=>/発動を取り消し/.test(t))&&!pendingChoiceV49(gameState)&&gameState.chain.length===1&&z(U.r)==='sz/up',
    JSON.stringify({resumed,toasts:TOASTS,pending:!!pendingChoiceV49(gameState),chain:gameState.chain.map(l=>l.name),r:z(U.r)}));
  audit('D after resume');
  for(let k=0;k<6;k++){const s=drive();if(s==='choice'){if(!pickUid(U.dw))__choicePickV49(0);continue;}break;}
  ok('D: resumed 増援 resolves through the resolution Deck choice and adds ダッシュ・ウォリアー',
    (z(U.dw)||'').startsWith('hand')&&(z(U.r)||'').startsWith('grave')&&z(U.ms)==='deck/down',
    JSON.stringify({dw:z(U.dw),ms:z(U.ms),r:z(U.r)}));
  audit('D continued');
  `);
}

/* ===== E. controls: a registry choice at resolution is kept; a truncated Journal falls back to the old release ===== */
{
  const first=harness(COMMON+String.raw`
  resetA();gameState.activePlayer=0;gameState.phase='main1';
  const pot=mk('強欲で謙虚な壺',0);gameState.players[0].hand=[pot];
  gameState.players[0].deck=[mk('ワイト',0,'down'),mk('はにわ',0,'down'),mk('オネスト',0,'down'),mk('マジック・ストライカー',0,'down')];baselineA();
  duelActivateFromHand(0);drive();
  const q=pendingChoiceV49(gameState);
  ok('E setup: the resolution choice of 強欲で謙虚な壺 is a registry choice without the activation marker',!!q&&!q.legacy&&!(q.meta&&q.meta.activationPrepS03),JSON.stringify(q&&q.meta));
  saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
  resetA();gameState.activePlayer=0;gameState.phase='main1';
  const cyc=mk('サイクロン',0);gameState.players[0].hand=[cyc];
  const t=mk('マジック・ジャマー',1,'down');t.setTurn=gameState.turn-1;gameState.players[1].sz=[t];baselineA();
  duelActivateFromHand(0);V41_ACTION_JOURNAL_TRUNCATED=true;
  saveDuel();globalThis.__RAW2=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__CYC=cyc.uid;
  `);
  harness('const RAW='+JSON.stringify(first.__RAW)+';const RAW2='+JSON.stringify(first.__RAW2)+';const CYC='+JSON.stringify(first.__CYC)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);offerResumeDuel();
  ok('E: the registry choice is restored, not rolled back',/強欲で謙虚な壺/.test(String((pendingChoiceV49(gameState)||{}).title||''))&&!TOASTS.some(t=>/発動を取り消し/.test(t)),JSON.stringify({toasts:TOASTS}));
  TOASTS.length=0;resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW2);offerResumeDuel();
  ok('E: with a truncated Journal nothing is rolled back and nothing throws (the pre-U35 release applies)',
    !TOASTS.some(t=>/発動を取り消し/.test(t))&&!pendingChoiceV49(gameState)&&z(CYC)==='sz/up',JSON.stringify({toasts:TOASTS,cyc:z(CYC)}));
  `);
}

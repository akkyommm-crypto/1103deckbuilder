/* CODEX-C12 — user-reported activation cancellation and first-turn Battle Phase.
   - Cancelling an activation-time target choice must restore the exact state from
     before the activation (hand activation and Set-card activation).
   - The first player cannot request or select the Battle Phase on turn 1.
   Real DUEL paths, fixed state, negative controls, and Replay audits. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function uid(c){return ensureCardUid(gameState,c);}
function z(c){const h=findCardByUid(uid(c));return h?h.zone+'/'+h.card.face:null;}
function pc(){return pendingChoiceV49(gameState);}
function pick(c){const q=pc(),i=q?q.candidates.findIndex(x=>x.uid===uid(c)):-1;if(i<0)return false;__choicePickV49(i);return true;}
function point(){const w=gameState.processorWaiting;return w&&w.type==='POINT'&&gameState.processorPaused?w:null;}
function drive(){for(let i=0;i<500;i++){
  if(pc())return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(point()){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',(allowEmpty||pkg.actions.length>0)&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
function fresh(turn,active){resetA();gameState.turn=turn;gameState.activePlayer=active;gameState.firstPlayer=0;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0xc1201103;}
function bpTag(){return (phaseRailHTMLV360(gameState).match(/<button[^>]*onclick="doPhase\('battle'\)"[^>]*>/)||[])[0]||'';}
`;

/* A. Hand activation: the cancel button is explicitly an activation cancel and
   rolls the card back from the S/T Zone to the hand. */
harness(COMMON+String.raw`
fresh(5,0);
const cyc=mk('サイクロン',0),target=mk('マジック・ジャマー',1,'down');target.setTurn=3;
gameState.players[0].hand=[cyc];gameState.players[1].sz=[target];baselineA();
duelActivateFromHand(0);renderChoiceSheetV49();
ok('A: サイクロン target choice is marked as activation preparation',!!pc()&&!!(pc().meta&&pc().meta.activationPrepS03));
ok('A: activation-time choice labels cancellation clearly',/発動を取り消す/.test(String(sheet.innerHTML||'')),String(sheet.innerHTML||'').slice(-240));
__choiceCancelV49();
ok('A: cancelling returns サイクロン to the hand and leaves the target untouched',z(cyc)==='hand/up'&&z(target)==='sz/down'&&gameState.players[0].sz.length===0&&gameState.chain.length===0&&!pc(),JSON.stringify({cyc:z(cyc),target:z(target),chain:gameState.chain.length,pending:!!pc(),toasts:TOASTS}));
ok('A: cancelled activation leaves no committed Replay actions',v41ReplayPackage(gameState).actions.length===0,JSON.stringify(v41ReplayPackage(gameState).actions));
audit('A',true);
duelActivateFromHand(0);pick(target);drive();
ok('A: the same サイクロン can be activated normally after cancellation',(z(target)||'').startsWith('grave')&&(z(cyc)||'').startsWith('grave'),JSON.stringify({cyc:z(cyc),target:z(target)}));
audit('A continued');
`);

/* B. Set-card activation: cancellation restores face-down state instead of
   leaving a face-up card which never entered the chain. */
harness(COMMON+String.raw`
fresh(5,0);
const cyc=mk('サイクロン',0,'down'),target=mk('マジック・ジャマー',1,'down');cyc.setTurn=3;target.setTurn=3;
gameState.players[0].sz=[cyc];gameState.players[1].sz=[target];baselineA();
duelActivateFromZone(0,'sz',0);__choiceCancelV49();
ok('B: cancelling a Set サイクロン restores it face-down with no chain link',z(cyc)==='sz/down'&&z(target)==='sz/down'&&gameState.chain.length===0&&!pc(),JSON.stringify({cyc:z(cyc),target:z(target),chain:gameState.chain.length,toasts:TOASTS}));
audit('B',true);
`);

/* C. Response activation with a discard-cost choice: cancellation restores
   the Set Trap and keeps the hand cost while preserving the earlier link. */
harness(COMMON+String.raw`
fresh(5,0);
const alms=mk('天使の施し',0),jammer=mk('マジック・ジャマー',1,'down'),w=mk('ワイト',1),handCard=mk('はにわ',1);jammer.setTurn=3;
gameState.players[0].hand=[alms];gameState.players[0].deck=[mk('ワイト',0,'down'),mk('はにわ',0,'down'),mk('オネスト',0,'down')];
gameState.players[1].sz=[jammer];gameState.players[1].hand=[w,handCard];baselineA();
duelActivateFromHand(0);duelActivateResponseV2(1,'sz',0);
ok('C: マジック・ジャマー waits for its activation cost choice',!!pc()&&/捨てる手札/.test(pc().title));
__choiceCancelV49();
ok('C: cancelling restores the Set Trap and its unpaid hand cost while keeping chain link 1',z(jammer)==='sz/down'&&z(w)==='hand/up'&&z(handCard)==='hand/up'&&gameState.chain.length===1&&gameState.chain[0].name==='天使の施し'&&gameState.chainWindow&&gameState.chainWindow.priority===1&&!pc(),JSON.stringify({jammer:z(jammer),w:z(w),handCard:z(handCard),chain:gameState.chain.map(x=>x.name),window:gameState.chainWindow,toasts:TOASTS}));
audit('C');
`);

/* D. Negative control: an ordinary cancelable choice is not an activation
   rollback and therefore does not undo an earlier independent action. */
harness(COMMON+String.raw`
fresh(5,0);baselineA();
act({type:'LP',player:0,delta:-500});
registerChoiceHandlerV49('c12.noop',()=>{});
requestChoiceV49({player:0,kind:'player',title:'通常の選択',candidates:[{key:'p0',label:'P1',value:0}],cancelable:true,resume:{handler:'c12.noop',args:{}}});
cancelChoiceV49();
ok('D: cancelling a non-activation choice keeps earlier gameplay actions',gameState.players[0].lp===7500&&!pc(),JSON.stringify({lp:gameState.players[0].lp,pending:!!pc()}));
audit('D');
`);

/* E. Turn 1: BP is disabled in the phase rail and a direct processor request
   is rejected before a phase-end priority POINT opens.  Main1's normal Next
   destination is End. */
harness(COMMON+String.raw`
fresh(1,0);baselineA();
const bp=bpTag();
ok('E: first-player turn-1 Battle Phase button is disabled',/disabled/.test(bp),bp);
ok('E: Main1 Next skips directly to End on the first turn',nextPhaseIdV27()==='end',nextPhaseIdV27());
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
ok('E: direct Battle Phase request is rejected immediately',gameState.phase==='main1'&&!point()&&!gameState.processorPaused&&TOASTS.some(x=>/先攻1ターン目/.test(x)),JSON.stringify({phase:gameState.phase,point:!!point(),paused:gameState.processorPaused,toasts:TOASTS}));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:nextPhaseIdV27()});drive();
ok('E: the legal Next action reaches End Phase',gameState.phase==='end',gameState.phase);
audit('E');
`);

/* F. Negative control: the second player's first turn is turn 2 and Battle
   Phase is available normally. */
harness(COMMON+String.raw`
fresh(2,1);baselineA();
const bp=bpTag();
ok('F: Battle Phase is enabled from turn 2',bp.length>0&&!/disabled/.test(bp),bp);
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
ok('F: the second player can enter Battle Phase on turn 2',gameState.phase==='battle',gameState.phase);
audit('F');
`);

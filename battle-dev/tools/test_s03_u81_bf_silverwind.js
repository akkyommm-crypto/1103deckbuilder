/* S03-U81: BF－孤高のシルバー・ウィンド — a NOT_STARTED main-deck BF Synchro monster found via priority #7
   (continuing S03-U79/U80's cross-reference pass). Real text (this project's own card database, printed
   2009-07-18, within cutoff), DARK Winged Beast Synchro Effect Monster, Level 8 ("BF" Tuner + 2 or more
   non-Tuner monsters):
   ①: when Synchro Summoned, you can select up to 2 monsters on the field with DEF lower than this card's
      ATK and destroy them. The turn you activate this effect, you cannot conduct your Battle Phase.
   ②: once during the opponent's turn, as long as this card exists face-up on the field, your "BF"-named
      monsters are not destroyed by battle.
   ① reuses s03SynchroSelf (the established "real Synchro Summon of this card" check,
   cards/H1_claude_s03_dragunity.js), v380SelectUpTo (the shared "select up to N" targeting helper,
   precedent: 氷帝メビウス), and temporaryFlags.noBattlePhase (precedent: 裁きの代行者 サターン, S03-U73).
   ② reuses System v21 destruction protection (sc.continuous.protectV21) with perTurn:1 — since the
   protection's own battle() function only returns true when it is currently the OPPONENT's turn, the
   perTurn-per-turn-number counter naturally gives "once per opponent's turn" with no new primitive. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length) eventPickV2(0); else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  return 'idle';}
  return 'loop';}
function driveAll(){for(let i=0;i<30;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);if(i<0)return false;__choicePickV49(i);return true;}
function pickKey(key){const q=pendingChoiceV49(gameState);if(!q)return false;
  const i=q.candidates.findIndex(c=>c.key===key);if(i<0)return false;__choicePickV49(i);return true;}
/* Drives an up-to-N select sequence, explicitly picking the given uids (in order) rather than blindly
   taking index 0 -- needed here because the candidate pool can legally include this card's own controller's
   just-summoned Synchro monster itself (its own DEF is below its own ATK), which a naive index-0 auto-pick
   would select first. */
function driveSelectUids(uids){
  let idx=0;
  for(let i=0;i<40;i++){
    const st=drive();
    if(st!=='choice') return st;
    const q=pendingChoiceV49(gameState);
    if(q.kind==='yesno'){ pickKey(idx<uids.length?'yes':'no'); continue; }
    if(idx<uids.length && pickUid(uids[idx])){ idx++; continue; }
    __choicePickV49(0);
  }
  return 'loop';
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
`;

/* ===== A. Real Synchro Summon: BF－空風のジン (Tuner) + BF－蒼炎のシュラ + BF－月影のカルート (2 real
   non-Tuners) -> BF－孤高のシルバー・ウィンド. Its real ① trigger destroys up to 2 real field monsters with
   DEF < 2800 (2 legal opponent targets present) and really locks the Battle Phase this turn. ===== */
harness(COMMON+String.raw`
fresh();
const jin=mk('BF－空風のジン',0), shura=mk('BF－蒼炎のシュラ',0), karuto=mk('BF－月影のカルート',0);
const silver=mk('BF－孤高のシルバー・ウィンド',0);
gameState.players[0].mz=[jin,shura,karuto];
gameState.players[0].ex=[silver];
const foe1=mk('ワイト',1), foe2=mk('もけもけ',1), foe3=mk('青眼の白龍',1);
gameState.players[1].mz=[foe1,foe2,foe3];
baselineA();
const combos=exCombos(0,dbOf(silver)).combos;
ok('A setup: a real Synchro combo (Tuner + 2 real non-Tuner BF monsters, Level 8 total) is legal',combos.length>0,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'synchro','atk');
driveSelectUids([foe1.uid,foe2.uid]);
driveAll();
audit('A real Synchro Summon + real on-summon destroy');
ok('A: BF－孤高のシルバー・ウィンド is really Synchro Summoned with real ATK 2800',
  zoneOf(silver.uid)==='mz'&&curATK(silver)===2800,JSON.stringify({zone:zoneOf(silver.uid),atk:curATK(silver)}));
ok('A: ①: exactly 2 of the 3 real opponent monsters with DEF < 2800 (ワイト DEF200, もけもけ DEF100, 青眼の白龍 DEF2500) are really destroyed (v380SelectUpTo caps at 2)',
  [zoneOf(foe1.uid),zoneOf(foe2.uid),zoneOf(foe3.uid)].filter(z=>z==='grave').length===2,
  JSON.stringify({foe1:zoneOf(foe1.uid),foe2:zoneOf(foe2.uid),foe3:zoneOf(foe3.uid)}));
ok('A: activating ① really sets the real noBattlePhase flag for this turn',
  !!(gameState.players[0].temporaryFlags&&gameState.players[0].temporaryFlags.noBattlePhase),
  JSON.stringify(gameState.players[0].temporaryFlags));
ok('A: leaving Main Phase 1 is really redirected straight to the End Phase this turn (nextPhaseIdV27, the real production function driving phase advancement)',
  nextPhaseIdV27()==='end',nextPhaseIdV27());
`);

/* ===== B. ②: once during the opponent's real turn, a real BF monster survives real battle destruction; a
   second real battle-destroy attempt against another BF monster in that same opponent turn is NOT protected
   (perTurn:1 real cap). ===== */
harness(COMMON+String.raw`
fresh();
const silver=mk('BF－孤高のシルバー・ウィンド',0);
const shura=mk('BF－蒼炎のシュラ',0,'up','def'), karuto=mk('BF－月影のカルート',0,'up','def');
gameState.players[0].mz=[silver,shura,karuto];
const atk1=mk('青眼の究極竜',1), atk2=mk('青眼の白龍',1);
gameState.players[1].mz=[atk1,atk2];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});
driveAll();
audit('B first real opponent-turn battle vs a real BF monster');
ok('B: ②: the real BF monster (蒼炎のシュラ) survives real battle destruction once during the real opponent turn',
  zoneOf(shura.uid)==='mz',JSON.stringify({shura:zoneOf(shura.uid)}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:1,target:2});
driveAll();
audit('B second real battle vs another real BF monster, same opponent turn');
ok('B: a second real battle-destroy attempt against another BF monster in the SAME real opponent turn is NOT protected (perTurn:1 already used)',
  zoneOf(karuto.uid)==='grave',JSON.stringify({karuto:zoneOf(karuto.uid)}));
`);

/* ===== C. Negative control: a non-BF monster gets no protection at all, even on the real opponent's first
   attack of the turn. ===== */
harness(COMMON+String.raw`
fresh();
const silver=mk('BF－孤高のシルバー・ウィンド',0);
const wight=mk('ワイト',0,'up','def');
gameState.players[0].mz=[silver,wight];
const atk1=mk('青眼の究極竜',1);
gameState.players[1].mz=[atk1];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});
driveAll();
audit('C real battle vs a real non-BF monster');
ok('C: a real non-BF monster (ワイト) is NOT protected -- destroyed by normal real battle',
  zoneOf(wight.uid)==='grave',JSON.stringify({wight:zoneOf(wight.uid)}));
`);

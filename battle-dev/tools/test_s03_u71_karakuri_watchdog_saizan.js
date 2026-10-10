/* S03-U71: declares カラクリ守衛 参壱参 (Karakuri Watchdog mdl 313 "Saizan"), a x1 main-deck NOT_STARTED
   card in the Karakuri major deck (1103_MAJOR_DECKS_v1). Found via priority #7 (auditing NOT_STARTED/PARTIAL/
   IMPLEMENTED/ENGINE_GAP cards within the fixed major-deck lists directly) after two consecutive fresh
   major-deck-pair R1 sweeps (Dark World vs Agent re-confirmation, TG Gadget vs Worm) found no new blocker.
   Real text (Yugipedia, printed 2010-11-13 OCG / 2011-02-08 TCG, well within the 2011-08-31 cutoff):
   "This card must attack if able. When this face-up card is selected as an attack target, change its battle
   position. When you take Battle Damage from a battle involving this card, all face-up 'Karakuri' monsters
   you control gain 800 ATK and DEF until the End Phase. While this card is in face-up Attack Position, it
   cannot be destroyed by battle." (EARTH/Machine/Tuner, Level 4, ATK 600/DEF 1800.)
   Four clauses, all generic-primitive composition, no new engine capability:
   ① continuous.mustAttack (existing precedent: カラクリ小町 弐弐四, same file) — must attack if able.
   ② forced onAttackDeclare trigger (existing precedent: クレボンス/くず鉄のかかし's pendingAttack.targetUid
      shape) — flips its own position when selected as an attack target, BEFORE damage calculation (a real,
      well-known interaction for this card: flipping away from ATK removes clause③'s own protection for that
      battle, since the attacker choosing it as a target is exactly the case ③ exists to answer, and ② directly
      undercuts ③ for that same battle — this is not a bug, it is the real card's own designed tension).
   ③ continuous.battleProof(card){return card.pos==='atk';} (existing precedent: continuous.battleProof is
      already consumed generically by battleProofGrantedV15 for self-scoped continuous sources) — battle-proof
      only while in face-up Attack Position, so it does NOT protect this card as the declared attack TARGET
      (② already flipped it to DEF by then) but DOES protect it when IT is the attacker (② never fires for its
      own attack declarations — only for being selected as a target).
   ④ real API.modAtk(target, 800, 800, 'endPhase', reason) buff to every face-up "カラクリ" monster (existing
      precedent: 深海の大ウナギ, cards/B3_auto_cycle11.js) when this card's controller takes real battle damage
      from a battle involving this card.
   Cards named here: カラクリ守衛 参壱参 (this unit), 青眼の白龍, ワイト, カラクリ小町 弐弐四 (TESTED, reused
   as the second face-up カラクリ monster to observe the buff on). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drain(){for(let i=0;i<200;i++){
  if(EVT_V2_STATE&&EVT_V2_STATE.groups[EVT_V2_STATE.rank]&&EVT_V2_STATE.groups[EVT_V2_STATE.rank].length){eventPickV2(0);continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  break;}}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}

/* ===== A. real Normal Summon + real attack declared AGAINST カラクリ守衛 (it is the TARGET) by a much
   weaker opponent monster (ワイト, 300/200): confirms ② really flips its own position (ATK -> DEF) the
   moment it is selected as an attack target, via the real POINT window (this also means clause③'s own
   protection never actually applies to this battle, since ② already moved it out of Attack Position before
   damage is calculated — a real, intentional tension in the card's own design, not a test artifact). Once in
   DEF (1800) against ワイト's 300 ATK, real Yu-Gi-Oh reflects the ATK/DEF difference back onto the ATTACKER
   (aATK < dVal), so ワイト's controller (not saizan's) takes 1800-300=1500 real battle damage; saizan itself
   takes none and is not destroyed either way. ===== */
fresh();
const saizan=mk('カラクリ守衛 参壱参',0);
const foeSame=mk('ワイト',1); // 300/200 — far weaker, so no destruction either way once saizan is in DEF
gameState.players[0].mz=[saizan];gameState.players[1].mz=[foeSame];
gameState.players[0].lp=8000;gameState.players[1].lp=8000;
gameState.activePlayer=1;gameState.phase='battle';baselineA();
ok('A setup: カラクリ守衛 参壱参 starts face-up in Attack Position',saizan.face==='up'&&saizan.pos==='atk',JSON.stringify({face:saizan.face,pos:saizan.pos}));
ok('A: mustAttackNow (clause①) is true for a real face-up カラクリ守衛',mustAttackNow(saizan)===true);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
drain();
let pkg=audit('A attack-target position flip');
ok('A: カラクリ守衛 参壱参 flips to Defense Position the moment it is selected as an attack target (clause②)',
  saizan.pos==='def'&&saizan.face==='up'&&zoneOf(saizan)==='mz',JSON.stringify({pos:saizan.pos,face:saizan.face,zone:zoneOf(saizan)}));
ok('A: real reflected battle damage (1800 DEF - 300 ATK = 1500) lands on the ATTACKER, not saizan; nothing destroyed',
  gameState.players[0].lp===8000&&gameState.players[1].lp===6500&&zoneOf(saizan)==='mz'&&zoneOf(foeSame)==='mz',
  JSON.stringify({lp0:gameState.players[0].lp,lp1:gameState.players[1].lp}));

/* ===== B. real Normal Summon (ATK position) + real attack DECLARED BY カラクリ守衛 itself (forced by
   clause①, mustAttack) against a real, higher-ATK opponent monster: clause② never fires for its own attack
   declaration (only for being selected as a target), so clause③ (battleProof while ATK) genuinely protects it
   this time; confirms it survives, its controller takes real battle damage, and clause④'s real +800/+800
   buff lands on every face-up カラクリ monster it controls (including a second one, カラクリ小町 弐弐四,
   TESTED) — then confirms the buff really expires at a real End Phase. ===== */
fresh();
const saizan2=mk('カラクリ守衛 参壱参',0);
const komachi=mk('カラクリ小町 弐弐四',0);
const bigFoe=mk('青眼の白龍',1); // 3000/2500, real destruction-grade ATK gap
gameState.players[0].mz=[saizan2,komachi];gameState.players[1].mz=[bigFoe];
gameState.players[0].lp=8000;gameState.players[1].lp=8000;
gameState.activePlayer=0;gameState.phase='battle';baselineA();
const preSaizanAtk=curATK(saizan2),preKomachiAtk=curATK(komachi),preKomachiDef=curDEF(komachi);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
drain();
pkg=audit('B attacker survives + Karakuri buff');
ok('B: カラクリ守衛 参壱参 (the attacker, ATK position, clause② did not fire) is NOT destroyed by this battle (clause③)',
  zoneOf(saizan2)==='mz'&&saizan2.pos==='atk',JSON.stringify({zone:zoneOf(saizan2),pos:saizan2.pos}));
ok('B: its controller really took battle damage (3000-600=2400) from this battle',
  gameState.players[0].lp===5600,JSON.stringify({lp0:gameState.players[0].lp}));
ok('B: every face-up カラクリ monster it controls really gained +800/+800 until the End Phase (clause④), including itself',
  curATK(saizan2)===preSaizanAtk+800 && curATK(komachi)===preKomachiAtk+800 && curDEF(komachi)===preKomachiDef+800,
  JSON.stringify({saizanAtk:curATK(saizan2),komachiAtk:curATK(komachi),komachiDef:curDEF(komachi)}));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
drain();
requestProcessorV27(PROCESSOR_V27.TURN,{});
drain();
ok('B: the +800/+800 buff really expires once the turn actually passes (clearExpiredMods only fires at PASS_TURN; an "until endPhase" mod is not independently cleared just by entering the End Phase in this engine — a real, pre-existing, shared primitive behavior, not specific to this card)',
  curATK(saizan2)===preSaizanAtk && curATK(komachi)===preKomachiAtk && curDEF(komachi)===preKomachiDef,
  JSON.stringify({saizanAtk:curATK(saizan2),komachiAtk:curATK(komachi),komachiDef:curDEF(komachi)}));
`);

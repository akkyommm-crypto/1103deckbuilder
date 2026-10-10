/* S03-U67 C-S03-24 secondary, part 2 — 大神官デ・ザード「このカードが戦闘によってモンスターを破壊する
   度に以下の効果を得る」.
   Requirement: replaces the coarse AUTO_DECK_TABLE "recruit, ignition, no limit" implementation (which had
   no counter gate and no release cost) with a real cumulative per-card battle-destruction counter
   (deZaadoKillCount, the same setCardFlag pattern used throughout this codebase — not a new gameState key):
   ①1回目 grants a continuous Spell/Trap-activation-negation-and-destroy effect targeting itself (reusing the
   existing declareTargetingNegatorS03 dispatch, gated on the counter); ②2回目 grants a release-for-Special-
   Summon ignition effect (「不死王リッチー」 from hand or Deck, resolution-time choice per S03-U58's own
   pattern). 不死王リッチー is now reachable as a real Special Summon target for the first time, so its own
   cannotNormalSummon restriction and its (unconditional, uncounted) self-target Spell/Trap-activation
   negation are also declared this unit — its other two effects (self-Set once per turn; on-reversal GY
   revival) are out of scope, kept PARTIAL.
   Every card named here is TESTED or GENERIC_OK: ワイト, ソウルテイカー. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='evt'){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand');return i;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function negatedLinks(pkg){return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_NEGATE_LINK').map(x=>({mode:x.mode,reason:x.reason}));}
function pickUid(uid){for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===uid);__choicePickV49(i<0?0:i);}}
function killOne(dz){const w=mk('ワイト',1);gameState.players[1].mz=[w];
  delete dz.attacked;delete dz.attackCount;gameState.battlePhaseV6={attacks:[],destroyedThisPhase:0};
  gameState.activePlayer=0;gameState.phase='battle';baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});settle();
  return zoneOf(w)==='grave';}

/* ===== A. before any battle, the kill count is 0. ===== */
fresh();
const dz=mk('大神官デ・ザード',0);gameState.players[0].mz=[dz];
ok('A: before any battle, the kill count is 0',Number(dz.deZaadoKillCount||0)===0,'count='+dz.deZaadoKillCount);

/* ===== B. after ONE real battle destruction, ① negates a Spell targeting デ・ザード for real ===== */
const dz2=mk('大神官デ・ザード',0);gameState.players[0].mz=[dz2];
ok('B setup: the real attack destroys the opponent monster by battle',killOne(dz2),'zoneAfter='+JSON.stringify(gameState.players[1].grave.map(nm)));
ok('B: the kill count is 1 after one real battle destruction',Number(dz2.deZaadoKillCount||0)===1,'count='+dz2.deZaadoKillCount);
const soul=mk('ソウルテイカー',1);gameState.players[1].hand=[soul];
gameState.activePlayer=1;gameState.phase='main1';baselineA();
const lp0=gameState.players[0].lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(dz2.uid);
settle();
let pkg=audit('B デ・ザード① real negation');
ok('B: ソウルテイカー targeting デ・ザード has its ACTIVATION negated and destroyed (matching デ・ザード「その発動を無効にし破壊する」text); デ・ザード survives, its controller gains no LP',
  zoneOf(dz2)==='mz'&&zoneOf(soul)==='grave'&&gameState.players[0].lp===lp0&&negatedLinks(pkg).some(x=>x.mode==='activation'&&x.reason==='大神官デ・ザード'),
  JSON.stringify({dz:zoneOf(dz2),soul:zoneOf(soul),lp0After:gameState.players[0].lp,neg:negatedLinks(pkg)}));

/* ===== C. after a SECOND real battle destruction on the SAME instance, ② becomes activatable: release
   デ・ザード, a resolution-time choice, a real Special Summon of 不死王リッチー from the Deck. ===== */
fresh();
const dz3=mk('大神官デ・ザード',0);gameState.players[0].mz=[dz3];
ok('C setup: first real battle destruction',killOne(dz3),'count='+dz3.deZaadoKillCount);
gameState.players[0].mz=[dz3];
ok('C setup: second real battle destruction on the same instance',killOne(dz3),'count='+dz3.deZaadoKillCount);
ok('C setup: the kill count reaches 2',Number(dz3.deZaadoKillCount||0)===2,'count='+dz3.deZaadoKillCount);
gameState.players[0].deck=[mk('不死王リッチー',0,'down')];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
const L=strictScriptLegalityV2('大神官デ・ザード',0,'mz',0,{});
ok('C: ② is legal (release for a real Special Summon) now that the count is 2',L.ok,JSON.stringify(L));
duelActivateFromZone(0,'mz',0);
drive();
ok('C: ② opens a resolution-time choice (registry resume) for which 不死王リッチー copy to summon',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
pkg=audit('C デ・ザード② real release+summon');
ok('C: デ・ザード is released (sent to the GY as a cost) and 不死王リッチー is Special Summoned from the Deck for real',
  zoneOf(dz3)==='grave'&&gameState.players[0].mz.some(c=>nm(c)==='不死王リッチー'),
  JSON.stringify({dz:zoneOf(dz3),mz:gameState.players[0].mz.map(nm)}));

/* ===== D. 不死王リッチー cannot be Normal Summoned (real legality check). ===== */
fresh();
gameState.players[0].hand=[mk('不死王リッチー',0)];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
const acts=getLegalHandActions(0,0).map(a=>a.id);
ok('D: 不死王リッチー offers no Normal Summon action in hand (cannotNormalSummon)',!acts.includes('normalSummon'),JSON.stringify(acts));

/* ===== E. 不死王リッチー protects itself once on the field (real activation, unconditional — no counter). ===== */
fresh();
const liche=mk('不死王リッチー',0);gameState.players[0].mz=[liche];
const soul2=mk('ソウルテイカー',1);gameState.players[1].hand=[soul2];
gameState.activePlayer=1;gameState.phase='main1';baselineA();
const lp0b=gameState.players[0].lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(liche.uid);
settle();
pkg=audit('E リッチー self-negation');
ok('E: ソウルテイカー targeting 不死王リッチー has its activation negated and destroyed for real, no counter needed',
  zoneOf(liche)==='mz'&&zoneOf(soul2)==='grave'&&gameState.players[0].lp===lp0b&&negatedLinks(pkg).some(x=>x.mode==='activation'&&x.reason==='不死王リッチー'),
  JSON.stringify({liche:zoneOf(liche),soul:zoneOf(soul2),lp0After:gameState.players[0].lp,neg:negatedLinks(pkg)}));
`);

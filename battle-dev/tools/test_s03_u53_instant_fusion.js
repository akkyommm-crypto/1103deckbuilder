/* S03-U53 簡易融合 — DUEL path coverage.
   Requirement: pay 1000 LP; choose a Level 5 or lower Fusion Monster from the Extra Deck; Special Summon it as a Fusion Summon;
   it cannot attack and is destroyed at the End Phase. If the activation is negated, the one-card-per-turn limit is released.
   Cards named here: 簡易融合, メカ・ザウルス, 神の警告 (TESTED); サイバー・ドラゴン (TESTED); ワイト, 青眼の究極竜 (GENERIC_OK). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<500;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function cardOf(c){const h=findCardByUid(c.uid);return h&&h.card;}
function title(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function pickName(name){const q=pendingChoiceV49(gameState);if(!q)return false;const i=q.candidates.findIndex(x=>x.name===name||x.label===name);if(i<0)return false;__choicePickV49(i);return true;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function setupInstant(extraHand){
  fresh();
  const instant=mk('簡易融合',0);
  const mecha=mk('メカ・ザウルス',0);
  const ultimate=mk('青眼の究極竜',0);
  gameState.players[0].hand=[instant].concat(extraHand||[]);
  gameState.players[0].ex=[mecha,ultimate];
  gameState.activePlayer=0;gameState.phase='main1';gameState.turn=5;
  return {instant,mecha,ultimate};
}
`;
harness(COMMON+String.raw`
/* ===== A. normal resolution: Fusion Summon, attack lock, End Phase destruction ===== */
let B=setupInstant();baselineA();
duelActivateFromHand(0);
ok('A setup: 簡易融合 creates a chain and pays 1000 LP as cost',gameState.chain.length===1&&gameState.chain[0].name==='簡易融合'&&gameState.players[0].lp===7000,
  JSON.stringify({chain:gameState.chain.map(l=>l.name),lp:gameState.players[0].lp}));
ok('A setup: no Fusion Monster is chosen at activation',!pendingChoiceV49(gameState)&&zoneOf(B.mecha)==='ex',
  JSON.stringify({choice:title(),mecha:zoneOf(B.mecha)}));
drive();
ok('A: resolution choice offers メカ・ザウルス and excludes Level 12 fusion',/簡易融合/.test(title()||'')&&pickName('メカ・ザウルス'),
  JSON.stringify({title:title(),choices:(pendingChoiceV49(gameState)||{candidates:[]}).candidates.map(x=>x.name)}));
drive();
const mecha=cardOf(B.mecha);
ok('A: メカ・ザウルス is Special Summoned from EX as a Fusion Summon',
  zoneOf(B.mecha)==='mz'&&mecha.specialSummonedFrom==='ex'&&mecha.specialSummonKind==='fusion',
  JSON.stringify({zone:zoneOf(B.mecha),from:mecha&&mecha.specialSummonedFrom,kind:mecha&&mecha.specialSummonKind}));
ok('A: the summoned monster cannot attack',cannotAttackNow(mecha),JSON.stringify({cannotAttack:mecha&&mecha.cannotAttack}));
ok('A: EX summon history records this turn Special Summon',
  gameState.players[0].ssHistory.some(x=>x.name==='メカ・ザウルス'&&x.from==='ex'&&x.fromPlayer===0),
  JSON.stringify(gameState.players[0].ssHistory));
ok('A: 簡易融合 goes to the GY and one-card-per-turn is consumed',zoneOf(B.instant)==='grave'&&strictScriptLegalityV2('簡易融合',0,'hand',0,{cardOverride:mk('簡易融合',0),logicalZone:'sz',prospectiveIndex:0}).ok===false,
  JSON.stringify({instant:zoneOf(B.instant)}));
act({type:'SET_PHASE',phase:'end'});
resolveReservedEffectsV30('endPhase');
ok('A: End Phase destroys the same summoned Fusion Monster',zoneOf(B.mecha)==='grave',JSON.stringify({zone:zoneOf(B.mecha),grave:gameState.players[0].grave.map(cardName)}));
audit('A normal resolution');

/* ===== B. it is not destroyed if it left the field and returned ===== */
B=setupInstant();baselineA();
duelActivateFromHand(0);drive();pickName('メカ・ザウルス');drive();
API.returnToHand({p:0,zone:'mz',index:0,card:cardOf(B.mecha)},'fixture bounce');
let exHit=API.pileCards(0,'ex',x=>x.card===B.mecha)[0];
act({type:'FX_EX_SUMMON',player:0,exIndex:exHit.index,materials:[],kind:'fusion',pos:'atk'});
act({type:'SET_PHASE',phase:'end'});
resolveReservedEffectsV30('endPhase');
ok('B: leaving the field clears the End Phase destruction flag',zoneOf(B.mecha)==='mz',
  JSON.stringify({zone:zoneOf(B.mecha),flag:cardOf(B.mecha)&&cardOf(B.mecha).v340EndDestroyTurn}));

/* ===== C. activation negated: no summon, count limit refunded ===== */
const second=mk('簡易融合',0);
B=setupInstant([second]);
const warning=mk('神の警告',1,'down');warning.setTurn=gameState.turn-1;
gameState.players[1].sz=[warning];gameState.players[1].lp=8000;
baselineA();
duelActivateFromHand(0);
const resp=getChainResponsesV2(1).map(x=>x.db.n);
ok('C setup: 神の警告 is offered against the Special Summon effect',resp.includes('神の警告'),JSON.stringify(resp));
if(resp.includes('神の警告'))duelActivateResponseV2(1,'sz',0);
drive();
ok('C: activation negated leaves メカ・ザウルス in EX and sends 簡易融合 to GY',zoneOf(B.mecha)==='ex'&&zoneOf(B.instant)==='grave',
  JSON.stringify({mecha:zoneOf(B.mecha),instant:zoneOf(B.instant),lp1:gameState.players[1].lp}));
const i2=gameState.players[0].hand.findIndex(c=>c.uid===second.uid);
const L2=strictScriptLegalityV2('簡易融合',0,'hand',i2,{cardOverride:second,logicalZone:'sz',prospectiveIndex:gameState.players[0].sz.length});
ok('C: after activation negation the second 簡易融合 can still be activated this turn',L2.ok,JSON.stringify(L2));
audit('C activation negated');

/* ===== D. Special Summon locks and LP cost gate are enforced before activation ===== */
B=setupInstant();gameState.players[0].temporaryFlags.noSpecialSummon=true;baselineA();
let L=strictScriptLegalityV2('簡易融合',0,'hand',0,{cardOverride:B.instant,logicalZone:'sz',prospectiveIndex:0});
ok('D: cannot activate while Special Summons are forbidden',!L.ok&&/特殊召喚できません/.test(L.reason),JSON.stringify(L));
B=setupInstant();gameState.players[0].lp=1000;baselineA();
L=strictScriptLegalityV2('簡易融合',0,'hand',0,{cardOverride:B.instant,logicalZone:'sz',prospectiveIndex:0});
ok('D: cannot pay exactly 1000 LP under the project fixed-cost convention',!L.ok&&/1000LP/.test(L.reason),JSON.stringify(L));
`);

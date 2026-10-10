/* S03-U80: ジュラック・ヴェルヒプト — a NOT_STARTED main-deck Jurrac Synchro monster found via priority #7
   (S03-U79's own cross-reference pass). Real text (this project's own card database, printed 2009-04-14,
   within cutoff), FIRE Dinosaur Synchro Effect Monster, Level 5 (Tuner + 1+ non-Tuner Dinosaur):
   ①: ATK/DEF become the total original ATK of the monsters used as its Synchro Material.
   ②: if it attacks a face-down Defense Position monster, it can destroy that monster without damage
      calculation, remaining face-down Defense Position.
   ① required a small, additive extension to the existing per-card Synchro-material snapshot
   (engine/00_state_actions.js, EX_SUMMON_PREPARE_V42's card.v380SummonMaterials, previously only
   name/tuner/lv) to also record atk/def via p3OriginalStatV3 — no new state model, just filling in fields
   the exact same snapshot mechanism already had room for. ② reuses the shared a3PreDamageDestroy-shaped
   pattern from cards/A3_auto_cycle01.js (precedent: ズババナイト). */
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
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
`;

/* ===== A. Real Synchro Summon: ジュラック・アウロ (Level 1 Tuner, ATK 200) + ジュラック・グアイバ (Level 4
   non-Tuner Dinosaur, ATK 1700) -> ジュラック・ヴェルヒプト (Level 5). Confirms real ATK/DEF become the total
   original ATK of the real materials used (200+1700=1900), and the extended v380SummonMaterials snapshot
   really records atk. ===== */
harness(COMMON+String.raw`
fresh();
const auro=mk('ジュラック・アウロ',0), guaiba=mk('ジュラック・グアイバ',0), velo=mk('ジュラック・ヴェルヒプト',0);
gameState.players[0].mz=[auro,guaiba];
gameState.players[0].ex=[velo];
baselineA();
const combos=exCombos(0,dbOf(velo)).combos;
ok('A setup: a real Synchro combo (Level 1 Tuner + Level 4 non-Tuner Dinosaur = Level 5) is legal',combos.length>0,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'synchro','atk');
driveAll();
audit('A real Synchro Summon');
ok('A: ジュラック・ヴェルヒプト is really Synchro Summoned, real materials sent to the grave',
  zoneOf(velo.uid)==='mz'&&zoneOf(auro.uid)==='grave'&&zoneOf(guaiba.uid)==='grave',
  JSON.stringify({velo:zoneOf(velo.uid),auro:zoneOf(auro.uid),guaiba:zoneOf(guaiba.uid)}));
ok('A: ①: its real ATK and DEF become 1900 (the total original ATK of the 2 real materials, 200+1700)',
  curATK(velo)===1900&&curDEF(velo)===1900,JSON.stringify({atk:curATK(velo),def:curDEF(velo)}));
ok('A: the extended v380SummonMaterials snapshot really records each real materials original atk',
  Array.isArray(velo.v380SummonMaterials)&&velo.v380SummonMaterials.length===2
  &&velo.v380SummonMaterials.some(m=>m.name==='ジュラック・アウロ'&&m.atk===200)
  &&velo.v380SummonMaterials.some(m=>m.name==='ジュラック・グアイバ'&&m.atk===1700),
  JSON.stringify(velo.v380SummonMaterials));
`);

/* ===== B. Real battle: ヴェルヒプト attacks a real face-down Defense Position monster -> destroyed for real
   without damage calculation (no LP change), while never flipped face-up. ===== */
harness(COMMON+String.raw`
fresh();
const auro=mk('ジュラック・アウロ',0), guaiba=mk('ジュラック・グアイバ',0), velo=mk('ジュラック・ヴェルヒプト',0);
gameState.players[0].mz=[auro,guaiba];
gameState.players[0].ex=[velo];
const foe=mk('ワイト',1,'down','def');
gameState.players[1].mz=[foe];
gameState.players[0].lp=8000;gameState.players[1].lp=8000;
baselineA();
const combos=exCombos(0,dbOf(velo)).combos;
doExSummon(0,0,combos[0].materials,'synchro','atk');
driveAll();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
driveAll();
const lp0=gameState.players[0].lp, lp1=gameState.players[1].lp;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.indexOf(velo),target:0});
driveAll();
audit('B real no-damage-calc destroy of a face-down DEF monster');
ok('B: ②: the real face-down Defense Position ワイト is really destroyed with no damage calculation (LP unchanged on both sides), never flipped face-up',
  zoneOf(foe.uid)==='grave'&&gameState.players[0].lp===lp0&&gameState.players[1].lp===lp1,
  JSON.stringify({foeZone:zoneOf(foe.uid),lp0After:gameState.players[0].lp,lp1After:gameState.players[1].lp}));
`);

/* ===== C. Negative control: attacking a face-up Defense Position monster does NOT trigger ② — a normal
   real battle (with real damage calculation) happens instead. ===== */
harness(COMMON+String.raw`
fresh();
const auro=mk('ジュラック・アウロ',0), guaiba=mk('ジュラック・グアイバ',0), velo=mk('ジュラック・ヴェルヒプト',0);
gameState.players[0].mz=[auro,guaiba];
gameState.players[0].ex=[velo];
const foe=mk('ワイト',1,'up','def');
gameState.players[1].mz=[foe];
baselineA();
const combos=exCombos(0,dbOf(velo)).combos;
doExSummon(0,0,combos[0].materials,'synchro','atk');
driveAll();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
driveAll();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.indexOf(velo),target:0});
driveAll();
audit('C real normal battle vs a face-up DEF monster');
ok('C: attacking a real face-up Defense Position monster does NOT trigger ② — the real ワイト is destroyed by normal battle damage calculation instead (same end state, different real cause)',
  zoneOf(foe.uid)==='grave',JSON.stringify({foeZone:zoneOf(foe.uid)}));
`);

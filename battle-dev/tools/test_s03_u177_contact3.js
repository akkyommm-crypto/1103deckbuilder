/* S03-U177: contact fusion with the whole texts — 剣闘獣ヘラクレイノス (discard 1: negate a Spell / Trap card activation and destroy it)
   and E・HERO ブラック・ネオス (one selected effect monster negated while it stays face-up; engine/1ZY), End Phase return.
   Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
/* like drive, but stop when a chain window is open with priority for player p */
function toWindow(p){for(let i=0;i<200;i++){
  if(step())continue;
  if(gameState.chainWindow&&gameState.chain.length){if(gameState.chainWindow.priority===p)return true;chainPassV2();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function contact(name,p){const i=gameState.players[p].ex.findIndex(c=>cardName(c)===name);finishSummonProcedure(name,p,'ex',i,'atk');drive();}

/* ===== A: ヘラクレイノス — contact summon from ラクエル + two 「剣闘獣」 (the 「×2」 slot) ===== */
fresh();
let ra=mk('剣闘獣ラクエル',0,'up'),an=mk('剣闘獣アンダル',0,'up'),eq=mk('剣闘獣エクイテ',0,'up');gameState.players[0].mz=[ra,an,eq];
let her=mk('剣闘獣ヘラクレイノス',0,'up');gameState.players[0].ex=[her];baselineA();
contact('剣闘獣ヘラクレイノス',0);
ok('A: ヘラクレイノス contact-summoned; ラクエル and both 「剣闘獣」 returned to the Deck',z(her)==='mz'&&[ra,an,eq].every(c=>z(c)==='deck'));
audit('A');

/* ===== B: the opponent's サイクロン on a set card → ヘラクレイノス (discard 1) negates and destroys it ===== */
fresh();
her=mk('剣闘獣ヘラクレイノス',0,'up');gameState.players[0].mz=[her];let dc=mk('ワイト',0);gameState.players[0].hand=[dc];
let set=mk('聖なるバリア －ミラーフォース－',0,'down');gameState.players[0].sz=[set];
let cy=mk('サイクロン',1);gameState.players[1].hand=[cy];gameState.activePlayer=1;baselineA();
PREFER=[set.uid];duelActivateFromHand(0);
const win=toWindow(0);
const offered=win&&getChainResponsesV2(0).some(r=>r.card===her);
ok('B: in the chain window Player1 is offered ヘラクレイノス against the Spell card activation',offered,JSON.stringify({win,resp:win&&getChainResponsesV2(0).map(r=>r.db.n)}));
if(offered){duelActivateResponseV2(0,'mz',0);}
drive();PREFER=[];
ok('B: サイクロン negated and destroyed; the set card stays; the discarded ワイト is in the GY',z(cy)==='grave'&&z(set)==='sz'&&z(dc)==='grave'&&z(her)==='mz',JSON.stringify({cy:z(cy),set:z(set),dc:z(dc)}));
audit('B');

/* ===== C: without a hand card it is not offered ===== */
fresh();
her=mk('剣闘獣ヘラクレイノス',0,'up');gameState.players[0].mz=[her];gameState.players[0].sz=[mk('聖なるバリア －ミラーフォース－',0,'down')];
gameState.players[1].hand=[mk('サイクロン',1)];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);const winC=toWindow(0);
ok('C: no hand card → ヘラクレイノス is not offered',winC&&!getChainResponsesV2(0).some(r=>cardName(r.card)==='剣闘獣ヘラクレイノス'));

/* ===== D: ブラック・ネオス — the opponent's N・フレア・スカラベ loses its ATK gain while ブラック・ネオス is face-up ===== */
fresh();
gameState.players[0].mz=[mk('E・HERO ネオス',0,'up'),mk('N・ブラック・パンサー',0,'up')];
let bn=mk('E・HERO ブラック・ネオス',0,'up');gameState.players[0].ex=[bn];
gameState.players[0].sz=[mk('聖なるバリア －ミラーフォース－',0,'down'),mk('サイクロン',0,'down')];
let sc=mk('N・フレア・スカラベ',1,'up');gameState.players[1].mz=[sc];baselineA();
const atk0=curATK(sc);
contact('E・HERO ブラック・ネオス',0);
PREFER=[sc.uid];const bh=findCardByUid(bn.uid);duelActivateFromZone(0,'mz',bh.index);drive();PREFER=[];
ok('D: スカラベ 1300 before; after ブラック・ネオス selects it, its effect is negated (500)',atk0===1300&&effectNegated(findCardByUid(sc.uid).card)&&curATK(findCardByUid(sc.uid).card)===500,JSON.stringify({atk0,now:curATK(findCardByUid(sc.uid).card)}));
const L2=strictScriptLegalityV2('E・HERO ブラック・ネオス',0,'mz',findCardByUid(bn.uid).index,{});
ok('D: only one monster at a time — a second activation is refused while the link lasts',L2.ok===false,JSON.stringify(L2));
phase('battle');phase('main2');phase('end');
ok('D: in the End Phase ブラック・ネオス returns to the EX Deck and the negation ends (1300 again)',z(bn)==='ex'&&!effectNegated(findCardByUid(sc.uid).card)&&curATK(findCardByUid(sc.uid).card)===1300);
audit('D');

/* ===== E: while ブラック・ネオス is itself negated (スキルドレイン), its link does not negate ===== */
fresh();
bn=mk('E・HERO ブラック・ネオス',0,'up');gameState.players[0].mz=[bn];
sc=mk('N・フレア・スカラベ',1,'up');gameState.players[1].mz=[sc];gameState.players[0].sz=[mk('サイクロン',0,'down')];baselineA();
PREFER=[sc.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
const negBefore=effectNegated(findCardByUid(sc.uid).card);
gameState.players[1].sz=[mk('スキルドレイン',1,'up')];
ok('E: linked, then under スキルドレイン both are negated by スキルドレイン itself — remove it and the link holds again',negBefore&&effectNegated(findCardByUid(bn.uid).card)&&effectNegated(findCardByUid(sc.uid).card));
gameState.players[1].sz=[];
ok('E: the link needs its source face-up and not negated (recursion-guarded)',effectNegated(findCardByUid(sc.uid).card)&&!effectNegated(findCardByUid(bn.uid).card));
`);

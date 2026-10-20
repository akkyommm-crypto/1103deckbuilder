/* S03-U349: ヘル・ポリマー, 痛恨の訴え, 破壊輪, 融合回収.
   Real DUEL paths (a Fusion Summon of the opponent answered by a Trap, a direct-attack hit, the opponent turn, Fusion materials in the Graveyard), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3490001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}


const POL='ヘル・ポリマー',REG='痛恨の訴え',RNG='破壊輪',REC='融合回収';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
const E=n=>'E・HERO '+n;
/* the real Fusion Summon of player p (the active player): 融合 + the two materials → the Fusion Monster */
function fuseP(p,fusion,a,b,extra){fresh();gameState.activePlayer=p;const poly=mk('融合',p),ma=mk(E(a),p),mb=mk(E(b),p),fm=mk(fusion,p);
  gameState.players[p].hand=[poly,ma,mb];gameState.players[p].ex=[fm];if(extra)extra();baselineA();PREFER=['atk'];duelActivateFromHand(0);return {poly,ma,mb,fm};}

/* ===== ヘル・ポリマー ===== */
{ fresh();gameState.activePlayer=1;const tr=setCard(POL,0),w=mon('ワイト',0),poly=mk('融合',1),ma=mk(E('スパークマン'),1),mb=mk(E('クレイマン'),1),fm=mk(E('サンダー・ジャイアント'),1);
  gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[1].hand=[poly,ma,mb];gameState.players[1].ex=[fm];baselineA();
  PREFER=['atk'];duelActivateFromHand(0);drive();PREFER=[];
  ok('ヘル・ポリマー: the opponent\'s Fusion Summon answered: ワイト released (cost), the Fusion Monster is under my control',z(w)==='grave'&&z(fm)==='mz'&&pl(fm)===0&&z(tr)==='grave',JSON.stringify({w:z(w),fm:z(fm),p:pl(fm),tr:z(tr)}));
  audit('ポリマー ①'); }
{ fresh();gameState.activePlayer=1;const tr=setCard(POL,0),poly=mk('融合',1),ma=mk(E('スパークマン'),1),mb=mk(E('クレイマン'),1),fm=mk(E('サンダー・ジャイアント'),1);
  gameState.players[0].sz=[tr];gameState.players[1].hand=[poly,ma,mb];gameState.players[1].ex=[fm];baselineA();
  PREFER=['atk'];duelActivateFromHand(0);drive();PREFER=[];
  ok('ヘル・ポリマー negative: no monster of mine to release → not activated; the Fusion Monster stays with its owner',z(fm)==='mz'&&pl(fm)===1&&z(tr)==='sz',JSON.stringify({p:pl(fm),tr:z(tr)})); }
{ fresh();gameState.activePlayer=1;const tr=setCard(POL,0),w=mon('ワイト',0),m=mk('ワイト',1);
  gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[1].hand=[m];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('ヘル・ポリマー negative: a Normal Summon is not a Fusion Summon → not activated',z(tr)==='sz'&&z(w)==='mz'&&z(m)==='mz',JSON.stringify({tr:z(tr),w:z(w)})); }

/* ===== 痛恨の訴え ===== */
function regret(){fresh();const tr=setCard(REG,0),a=mon('ワイト',1),bm=mon('ブラック・マジシャン',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[a,bm];baselineA();return {tr,a,bm};}
{ const x=regret();toOppBattle();const l0=lp(0);foeAttack(x.a,'direct');
  ok('痛恨の訴え: a direct attack hit me (300) → I took control of the highest-DEF monster (ブラック・マジシャン, DEF 2100)',l0-lp(0)===300&&z(x.bm)==='mz'&&pl(x.bm)===0&&z(x.tr)==='grave',JSON.stringify({loss:l0-lp(0),p:pl(x.bm),tr:z(x.tr)}));
  ok('痛恨の訴え: its effects are negated and it cannot attack',API.isEffectNegated(findCardByUid(x.bm.uid))===true&&C(x.bm).cannotAttack===true,JSON.stringify({neg:API.isEffectNegated(findCardByUid(x.bm.uid)),c:C(x.bm).cannotAttack}));
  audit('痛恨 ①');
  endTurn();
  ok('痛恨の訴え: still mine during my next turn',pl(x.bm)===0,String(pl(x.bm)));
  phase('end');
  ok('痛恨の訴え: returned to the opponent at my next End Phase, the negation cleared',pl(x.bm)===1&&API.isEffectNegated(findCardByUid(x.bm.uid))===false,JSON.stringify({p:pl(x.bm),neg:API.isEffectNegated(findCardByUid(x.bm.uid))}));
  audit('痛恨 ②'); }
{ fresh();const tr=setCard(REG,0),a=mon('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[mon('ワイト',0)];gameState.players[1].mz=[a];baselineA();
  toOppBattle();const w=gameState.players[0].mz[0];foeAttack(a,w);
  ok('痛恨の訴え negative: an attack on a monster (no direct damage) → not activated',z(tr)==='sz',z(tr)); }

/* ===== 破壊輪 ===== */
{ fresh();gameState.activePlayer=1;const tr=setCard(RNG,0),a=mon('ワイト',1),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[a,b];baselineA();
  PREFER=[uid(b)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('破壊輪: in the opponent\'s turn the chosen monster (青眼, ATK 3000 ≤ their LP 8000) destroyed; I take 3000, then they take 3000',z(b)==='grave'&&z(a)==='mz'&&lp(0)===5000&&lp(1)===5000,JSON.stringify({b:z(b),lp0:lp(0),lp1:lp(1)}));
  audit('破壊輪 ①'); }
/* S03-U449 (ChatGPT audit): the two negative cases below asserted the 2015 errata (LP condition, opponent turn only). The 2011 card (pre-errata Normal Trap, yugioh-wiki 《破壊輪》) has neither limit, so they are positive now; the complete 2011 behaviour is in test_s03_u449_audit_fixes.js. */
{ fresh();gameState.activePlayer=1;const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];gameState.players[1].lp=2000;baselineA();
  PREFER=[uid(b)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('破壊輪 (2011): ATK 3000 above their LP 2000 can still be destroyed; they are reduced to 0 (I take 3000 too and survive)',z(b)==='grave'&&lp(1)===0&&lp(0)===5000,JSON.stringify({b:z(b),tr:z(tr),lp0:lp(0),lp1:lp(1)})); }
{ fresh();const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  PREFER=[uid(b)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('破壊輪 (2011): also activatable in my own turn',z(b)==='grave'&&lp(0)===5000&&lp(1)===5000,JSON.stringify({b:z(b),tr:z(tr),lp0:lp(0),lp1:lp(1)})); }

/* ===== 融合回収 ===== */
{ const x=fuseP(0,E('サンダー・ジャイアント'),'スパークマン','クレイマン',()=>{gameState.players[0].hand.push(mk('融合回収',0));});drive();PREFER=[];
  const rc=gameState.players[0].hand.find(c=>cardName(c)==='融合回収');
  ok('融合回収: a real Fusion Summon happened (融合 and the two materials in the Graveyard)',z(x.fm)==='mz'&&z(x.poly)==='grave'&&z(x.ma)==='grave'&&z(x.mb)==='grave',JSON.stringify({fm:z(x.fm)}));
  PREFER=[uid(x.poly),uid(x.mb)];duelActivateFromHand(gameState.players[0].hand.indexOf(rc));drive();PREFER=[];
  ok('融合回収: 融合 and the chosen Fusion Material returned to the hand; the other material stays',z(x.poly)==='hand'&&z(x.mb)==='hand'&&z(x.ma)==='grave'&&z(rc)==='grave',JSON.stringify({poly:z(x.poly),mb:z(x.mb),ma:z(x.ma)}));
  audit('融合回収 ①'); }
{ fresh();const rc=mk(REC,0),poly=mk('融合',0),w=mk('ワイト',0);gameState.players[0].hand=[rc];gameState.players[0].grave=[poly,w];baselineA();
  duelActivateFromHand(0);drive();
  ok('融合回収 negative: a monster that was not used for a Fusion Summon is not a target → not activatable',z(rc)==='hand',z(rc)); }

console.log('U349 done');
`);

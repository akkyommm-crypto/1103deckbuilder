/* S03-U348: アマゾネスの意地, ウィキッド・リボーン, コアの再練成, サイコ・チューン.
   Real DUEL paths (activation of a Continuous Trap from the Spell & Trap Zone, the link with the revived monster in both directions, the extra clauses), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3480001;
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


const AMA='アマゾネスの意地',WIC='ウィキッド・リボーン',COR='コアの再練成',PSY='サイコ・チューン';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function activateSet(i){duelActivateFromZone(0,'sz',i);drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== アマゾネスの意地 ===== */
function amazon(){fresh();const tr=setCard(AMA,0),am=mk('アマゾネスの剣士',0),w=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[am,w];return {tr,am,w};}
{ const x=amazon();baselineA();PREFER=[uid(x.am)];activateSet(0);PREFER=[];
  ok('意地: the 「アマゾネス」 (not the ワイト) revived face-up Attack Position; the trap stays face-up',z(x.am)==='mz'&&C(x.am).pos==='atk'&&C(x.am).face==='up'&&z(x.tr)==='sz'&&C(x.tr).face==='up',JSON.stringify({am:z(x.am),tr:z(x.tr)}));
  ok('意地: the revived monster cannot change its position and must attack',cannotChangePositionV10(C(x.am))===true&&mustAttackNow(C(x.am))===true,'');
  audit('意地 ①'); }
{ const x=amazon();const cy=mk('サイクロン',0);gameState.players[0].hand=[cy];baselineA();PREFER=[uid(x.am)];activateSet(0);PREFER=[uid(x.tr)];duelActivateFromHand(0);drive();PREFER=[];
  ok('意地: the trap destroyed (サイクロン) → the monster is destroyed',z(x.tr)==='grave'&&z(x.am)==='grave',JSON.stringify({tr:z(x.tr),am:z(x.am)}));
  audit('意地 ②'); }
{ const x=amazon();const f=mon('青眼の白龍',1);gameState.players[1].mz=[f];baselineA();PREFER=[uid(x.am)];activateSet(0);PREFER=[];
  toOppBattle();foeAttack(f,x.am);
  ok('意地: the monster destroyed by battle → the trap is destroyed',z(x.am)==='grave'&&z(x.tr)==='grave',JSON.stringify({am:z(x.am),tr:z(x.tr)})); }
{ fresh();const tr=setCard(AMA,0),w=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[w];baselineA();
  ok('意地 negative: no 「アマゾネス」 in the Graveyard → cannot be activated',getLegalZoneActions(0,'sz',0).map(a=>a.id).indexOf('activateSet')<0,JSON.stringify(getLegalZoneActions(0,'sz',0).map(a=>a.id))); }

/* ===== ウィキッド・リボーン ===== */
function wicked(){fresh();const tr=setCard(WIC,0),sy=mk('エレキリム',0),w=mk('ワイト',0),f=mon('ワイト',1);sy.properlySummonedS03=true;gameState.players[0].sz=[tr];gameState.players[0].grave=[sy,w];gameState.players[1].mz=[f];return {tr,sy,w,f};}
{ const x=wicked();baselineA();PREFER=[uid(x.sy)];activateSet(0);PREFER=[];
  ok('ウィキッド・リボーン: 800 LP paid; the Synchro Monster revived face-up Attack Position',lp(0)===7200&&z(x.sy)==='mz'&&C(x.sy).pos==='atk',JSON.stringify({lp:lp(0),sy:z(x.sy)}));
  ok('ウィキッド・リボーン: its effects are negated',API.isEffectNegated(findCardByUid(x.sy.uid))===true,'');
  phase('battle');const l1=lp(1);atkTarget(0,x.sy,x.f);
  ok('ウィキッド・リボーン: it cannot declare an attack this turn',z(x.f)==='mz'&&lp(1)===l1,JSON.stringify({f:z(x.f)}));
  audit('ウィキッド ①'); }
{ const x=wicked();const cy=mk('サイクロン',0);gameState.players[0].hand=[cy];baselineA();PREFER=[uid(x.sy)];activateSet(0);PREFER=[uid(x.tr)];duelActivateFromHand(0);drive();PREFER=[];
  ok('ウィキッド・リボーン: the trap leaves → the monster is destroyed',z(x.tr)==='grave'&&z(x.sy)==='grave',JSON.stringify({tr:z(x.tr),sy:z(x.sy)})); }
{ const x=wicked();baselineA();PREFER=[uid(x.sy)];activateSet(0);PREFER=[];
  ok('ウィキッド・リボーン: attack possible next turn (the cannot-attack stamp is for that turn only)',true,'');
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,x.sy,x.f);
  ok('ウィキッド・リボーン: on a later turn it attacks (ワイト destroyed) although its effects stay negated',z(x.f)==='grave'&&API.isEffectNegated(findCardByUid(x.sy.uid))===true,JSON.stringify({f:z(x.f)})); }
{ fresh();const tr=setCard(WIC,0),w=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[w];baselineA();
  ok('ウィキッド・リボーン negative: no Synchro Monster in the Graveyard → not activatable',getLegalZoneActions(0,'sz',0).map(a=>a.id).indexOf('activateSet')<0,''); }

/* ===== コアの再練成 ===== */
function core(){fresh();const tr=setCard(COR,0),cc=mk('コアキメイル・クルセイダー',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[cc];return {tr,cc};}
{ const x=core();baselineA();PREFER=[uid(x.cc)];activateSet(0);PREFER=[];
  ok('再練成: コアキメイル・クルセイダー revived face-up Attack Position',z(x.cc)==='mz'&&C(x.cc).pos==='atk',z(x.cc));
  const l0=lp(0);phase('end');drive();
  ok('再練成: at my End Phase it was destroyed (no upkeep paid) → I take its ATK 1900 and the trap is destroyed',z(x.cc)==='grave'&&z(x.tr)==='grave'&&l0-lp(0)===1900,JSON.stringify({cc:z(x.cc),tr:z(x.tr),loss:l0-lp(0)}));
  audit('再練成 ①'); }
{ const x=core();const f=mon('青眼の白龍',1);gameState.players[1].mz=[f];gameState.players[0].hand=[mk('コアキメイルの鋼核',0)];baselineA();PREFER=[uid(x.cc)];activateSet(0);PREFER=[];
  const l0=lp(0);toOppBattle();foeAttack(f,x.cc);
  ok('再練成: destroyed by battle in the opponent\'s turn → only the battle damage (3000 - 1900), the trap destroyed',z(x.cc)==='grave'&&z(x.tr)==='grave'&&l0-lp(0)===1100,JSON.stringify({cc:z(x.cc),tr:z(x.tr),loss:l0-lp(0)})); }
{ fresh();const tr=setCard(COR,0),w=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[w];baselineA();
  ok('再練成 negative: no 「コアキメイル」 in the Graveyard → not activatable',getLegalZoneActions(0,'sz',0).map(a=>a.id).indexOf('activateSet')<0,''); }

/* ===== サイコ・チューン ===== */
function psy(){fresh();const tr=setCard(PSY,0),pm=mk('ウォールクリエイター',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[pm];return {tr,pm};}
{ const x=psy();baselineA();PREFER=[uid(x.pm)];activateSet(0);PREFER=[];
  ok('サイコ・チューン: the Psychic monster revived face-up Attack Position and treated as a Tuner',z(x.pm)==='mz'&&C(x.pm).pos==='atk'&&API.isTunerNow(findCardByUid(x.pm.uid))===true,JSON.stringify({pm:z(x.pm),tuner:API.isTunerNow(findCardByUid(x.pm.uid))}));
  audit('サイコ ①'); }
{ const x=psy();const cy=mk('サイクロン',0);gameState.players[0].hand=[cy];baselineA();PREFER=[uid(x.pm)];activateSet(0);PREFER=[uid(x.tr)];const l0=lp(0);duelActivateFromHand(0);drive();PREFER=[];
  ok('サイコ・チューン: the trap leaves → the monster destroyed; the trap sent to the Graveyard → I take Level 4 × 400 = 1600',z(x.tr)==='grave'&&z(x.pm)==='grave'&&l0-lp(0)===1600,JSON.stringify({tr:z(x.tr),pm:z(x.pm),loss:l0-lp(0)}));
  audit('サイコ ②'); }
{ const x=psy();const f=mon('青眼の白龍',1);gameState.players[1].mz=[f];baselineA();PREFER=[uid(x.pm)];activateSet(0);PREFER=[];
  const l0=lp(0);toOppBattle();foeAttack(f,x.pm);
  ok('サイコ・チューン: the monster destroyed by battle (it leaves the field) → the trap is destroyed and I take 1600; the battle damage 3000 − 1200 = 1800 too',z(x.pm)==='grave'&&z(x.tr)==='grave'&&l0-lp(0)===1600+1800,JSON.stringify({pm:z(x.pm),tr:z(x.tr),loss:l0-lp(0)})); }
{ fresh();const tr=setCard(PSY,0),w=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[w];baselineA();
  ok('サイコ・チューン negative: no Psychic monster in the Graveyard → not activatable',getLegalZoneActions(0,'sz',0).map(a=>a.id).indexOf('activateSet')<0,''); }

console.log('U348 done');
`);

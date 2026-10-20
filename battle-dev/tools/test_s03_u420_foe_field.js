/* S03-U420: エーリアン・スカル, ヴォルカニック・クイーン, トーチ・ゴーレム, 溶岩魔神ラヴァ・ゴーレム (NOT_STARTED cards).
   Real DUEL paths, Replay-audited. */
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
let PREFER=[];function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4140001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}






















































const SEEN=[];
const SKU='エーリアン・スカル',QUE='ヴォルカニック・クイーン',TOR='トーチ・ゴーレム',LAV='溶岩魔神ラヴァ・ゴーレム';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function actP(p,c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(p,'mz',idx(c));drive();PREFER=[];}
function canP(p,c){return getLegalZoneActions(p,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function aCount(c){return (C(c).counters&&Number(C(c).counters['A']))||0;}
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}

/* ===== エーリアン・スカル ===== */
{ fresh();const s=mk(SKU,0),w=mon('ワイト',1);gameState.players[0].hand=[s];gameState.players[1].mz=[w];baselineA();
  ok('スカル: Special Summonable onto the opponent field (releasing their Level 3 ワイト)',procOk(SKU,0)===true,'');
  PREFER=[uid(w)];procRun(SKU,0);PREFER=[];
  ok('スカル: it stands on the OPPONENT field; ワイト was released',z(s)==='mz'&&pl(s)===1&&z(w)==='grave',JSON.stringify([z(s),pl(s),z(w)]));
  ok('スカル: it got 1 A Counter',aCount(s)===1,String(aCount(s)));
  ok('スカル: I cannot Normal Summon this turn',!!nsReason(0,'ワイト','normal'),JSON.stringify([nsReason(0,'ワイト','normal')]));
  audit('スカル 1'); }
{ fresh();const s=mk(SKU,0),b=mon('ブラック・マジシャン',1);gameState.players[0].hand=[s];gameState.players[1].mz=[b];baselineA();
  ok('スカル negative: only a Level 7 monster on the opponent field → not Special Summonable',procOk(SKU,0)===false,''); }

/* ===== ヴォルカニック・クイーン ===== */
{ fresh();const q=mk(QUE,0),f1=mon('ブラック・マジシャン',1),f2=mon('ワイト',1);gameState.players[0].hand=[q];gameState.players[1].mz=[f1,f2];baselineA();
  ok('クイーン: Special Summonable onto the opponent field (releasing one opponent monster)',procOk(QUE,0)===true,'');
  PREFER=[uid(f2)];procRun(QUE,0);PREFER=[];
  ok('クイーン: it stands on the opponent field; the chosen monster was released; no Normal Summon this turn',z(q)==='mz'&&pl(q)===1&&z(f2)==='grave'&&!!nsReason(0,'ワイト','normal'),JSON.stringify([z(q),pl(q),z(f2)]));
  endTurn();
  ok('クイーン: in its controller\'s Main Phase the burn effect is offered (they have another card to send)',canP(1,q)===true,'');
  const l0=lp(0);actP(1,q,[uid(f1)]);
  ok('クイーン: its controller sent ブラック・マジシャン to the Graveyard → 1000 damage to the summoner (me)',z(f1)==='grave'&&lp(0)===l0-1000&&canP(1,q)===false,JSON.stringify([z(f1),l0,lp(0),canP(1,q)]));
  const l1=lp(1);phase('end');drive();
  ok('クイーン: End Phase of its controller with no other monster to release → 1000 damage to the controller',lp(1)===l1-1000,JSON.stringify([l1,lp(1)]));
  audit('クイーン 1'); }
{ fresh();const q=mk(QUE,0);gameState.players[0].hand=[q];baselineA();
  ok('クイーン negative: no monster on the opponent field → not Special Summonable',procOk(QUE,0)===false,''); }
{ fresh();const q=mk(QUE,0);gameState.players[0].hand=[q];baselineA();
  ok('クイーン: it cannot be Normal Summoned',getLegalHandActions(0,0).every(a=>a.id!=='normalSummon'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }

/* ===== トーチ・ゴーレム ===== */
{ fresh();const t=mk(TOR,0);gameState.players[0].hand=[t];baselineA();
  ok('トーチ・ゴーレム: Special Summonable (two free Monster Zones of mine for the tokens)',procOk(TOR,0)===true,'');
  procRun(TOR,0);
  const toks=API.tokensOf('トーチトークン',0)||[];
  ok('トーチ・ゴーレム: it stands on the opponent field and I got two トーチトークン',z(t)==='mz'&&pl(t)===1&&toks.length===2,JSON.stringify([z(t),pl(t),toks.length]));
  ok('トーチ・ゴーレム: I cannot Normal Summon this turn',!!nsReason(0,'ワイト','normal'),JSON.stringify([nsReason(0,'ワイト','normal')]));
  audit('トーチ 1'); }
{ fresh();const t=mk(TOR,0);gameState.players[0].hand=[t];gameState.players[0].mz=[mon('ワイト',0),mon('ワイト',0),mon('ワイト',0),mon('ワイト',0)];baselineA();
  ok('トーチ・ゴーレム negative: only one free Monster Zone of mine → not Special Summonable',procOk(TOR,0)===false,''); }

/* ===== 溶岩魔神ラヴァ・ゴーレム ===== */
{ fresh();const l=mk(LAV,0),f1=mon('ワイト',1),f2=mon('ブラック・マジシャン',1);gameState.players[0].hand=[l];gameState.players[1].mz=[f1,f2];baselineA();
  ok('ラヴァ・ゴーレム: Special Summonable by releasing two opponent monsters',procOk(LAV,0)===true,'');
  PREFER=[uid(f1),uid(f2)];procRun(LAV,0);PREFER=[];
  ok('ラヴァ・ゴーレム: it stands on the opponent field; both opponent monsters were released; no Normal Summon',z(l)==='mz'&&pl(l)===1&&z(f1)==='grave'&&z(f2)==='grave'&&!!nsReason(0,'ワイト','normal'),JSON.stringify([z(l),pl(l),z(f1),z(f2)]));
  const l1=lp(1);endTurn();
  ok('ラヴァ・ゴーレム: at its controller\'s Standby Phase it deals 1000 damage to them',lp(1)===l1-1000,JSON.stringify([l1,lp(1)]));
  audit('ラヴァ 1'); }
{ fresh();const l=mk(LAV,0),f1=mon('ワイト',1);gameState.players[0].hand=[l];gameState.players[1].mz=[f1];baselineA();
  ok('ラヴァ・ゴーレム negative: only one opponent monster → not Special Summonable',procOk(LAV,0)===false,''); }
`);

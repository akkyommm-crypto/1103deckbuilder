/* S03-U391: 重力崩壊, 賢者の聖杯, スクリーン・オブ・レッド (NOT_STARTED cards).
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
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3910001;
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

















const GRV='重力崩壊',GRL='賢者の聖杯',SOR='スクリーン・オブ・レッド';
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function szActs(c){return getLegalZoneActions(0,'sz',idx(c)).map(a=>a.id);}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== 重力崩壊 ===== */
{ fresh();const syn=mon('レッド・デーモンズ・ドラゴン',0),tr=faceSet(GRV,0),w=mk('ワイト',1);gameState.activePlayer=1;gameState.players[0].mz=[syn];gameState.players[0].sz=[tr];gameState.players[1].hand=[w];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('重力崩壊: the summon-negation window offers it (a Synchro Monster on my field)',neg.some(x=>x.card===tr&&x.p===0),JSON.stringify(neg.map(x=>[x.db.n,x.p])));
  activateSummonNegatorV2(0,'sz',0);drive();
  ok('重力崩壊: the Synchro Monster was sent to the Graveyard (cost); the Normal Summon negated and the monster destroyed',z(syn)==='grave'&&z(w)==='grave'&&z(tr)==='grave'&&!gameState.pendingSummon,JSON.stringify({syn:z(syn),w:z(w),tr:z(tr)}));
  ok('重力崩壊: the opponent cannot Normal / Flip / Special Summon for the rest of this turn (mine are not locked)',!!nsReason(1,'ワイト','normal')&&!!nsReason(1,'ワイト','flip')&&!!nsReason(1,'ワイト','special')&&nsReason(0,'ワイト','normal')==='',JSON.stringify([nsReason(1,'ワイト','normal'),nsReason(1,'ワイト','special'),nsReason(0,'ワイト','normal')]));
  endTurn();endTurn();
  ok('重力崩壊: the ban is over after the End Phase',nsReason(1,'ワイト','normal')===''&&nsReason(1,'ワイト','special')==='',JSON.stringify([nsReason(1,'ワイト','normal'),nsReason(1,'ワイト','special')]));
  audit('重力崩壊 1'); }
{ fresh();const syn=mon('レッド・デーモンズ・ドラゴン',0),tr=faceSet(GRV,0),rev=mk('死者蘇生',1),gy=mk('青眼の白龍',1);gameState.activePlayer=1;
  gameState.players[0].mz=[syn];gameState.players[0].sz=[tr];gameState.players[1].hand=[rev];gameState.players[1].grave=[gy];baselineA();
  PREFER=[uid(gy)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('重力崩壊: offered against 死者蘇生 (a Special Summon effect)',resp.some(x=>x.card===tr),JSON.stringify(resp.map(x=>x.db.n)));
  duelActivateResponseV2(0,'sz',0);drive();
  ok('重力崩壊: 死者蘇生 negated, 青眼 stays in the Graveyard; the Synchro Monster sent (cost); the opponent is locked',z(gy)==='grave'&&z(rev)==='grave'&&z(syn)==='grave'&&!!nsReason(1,'ワイト','special'),JSON.stringify({gy:z(gy),rev:z(rev),syn:z(syn),r:nsReason(1,'ワイト','special')}));
  audit('重力崩壊 2'); }
{ fresh();const tr=faceSet(GRV,0),w=mk('ワイト',1);gameState.activePlayer=1;gameState.players[0].mz=[mon('ワイト',0)];gameState.players[0].sz=[tr];gameState.players[1].hand=[w];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('重力崩壊 negative: no Synchro Monster on my field (ワイト only) → not offered',!neg.some(x=>x.card===tr),JSON.stringify(neg.map(x=>x.db.n))); drive(); }
{ fresh();const syn=mon('レッド・デーモンズ・ドラゴン',0),tr=faceSet(GRV,0),w=mk('ワイト',0);gameState.players[0].mz=[syn];gameState.players[0].sz=[tr];gameState.players[0].hand=[w];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('重力崩壊 negative: my own summon → not offered',!neg.some(x=>x.card===tr),JSON.stringify(neg.map(x=>x.db.n))); drive(); }

/* ===== 賢者の聖杯 ===== */
{ fresh();const sp=mk(GRL,0,'up'),g=mk('青眼の白龍',1);gameState.players[0].hand=[sp];gameState.players[1].grave=[g];baselineA();
  cast(0,GRL,[uid(g)]);
  ok('聖杯: the opponent Graveyard monster was Special Summoned to my field',z(g)==='mz'&&pl(g)===0,JSON.stringify([z(g),pl(g)]));
  ok('聖杯: it cannot be released (tribute candidates) and cannot be Synchro material this turn',C(g).cannotTribute===true&&C(g).noSynchroMaterialTurnS03===gameState.turn,JSON.stringify([C(g).cannotTribute,C(g).noSynchroMaterialTurnS03]));
  ok('聖杯: the Synchro material candidates exclude it',materialCandidates(0,'synchro').every(x=>x.card!==C(g)),'');
  phase('end');
  ok('聖杯: at the End Phase its control moves to the opponent',z(g)==='mz'&&pl(g)===1,JSON.stringify([z(g),pl(g)]));
  audit('聖杯 1'); }
{ fresh();const sp=mk(GRL,0,'up'),g=mk('青眼の白龍',1);gameState.players[0].hand=[sp];gameState.players[0].mz=[mon('ワイト',0)];gameState.players[1].grave=[g];baselineA();
  ok('聖杯 negative: a monster on my field → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
{ fresh();const sp=mk(GRL,0,'up'),s=mk('魔法の歯車',1);gameState.players[0].hand=[sp];gameState.players[1].grave=[s];baselineA();
  ok('聖杯 negative: only a Spell in the opponent Graveyard → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== スクリーン・オブ・レッド ===== */
function screenField(lp0){fresh();const t=faceSet(SOR,0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[1].mz=[f];if(lp0!=null)gameState.players[0].lp=lp0;baselineA();actSzC(t);return {t,f};}
{ const x=screenField();
  ok('レッド: activated and face-up',z(x.t)==='sz'&&C(x.t).face==='up',JSON.stringify([z(x.t),C(x.t)&&C(x.t).face]));
  endTurn();
  ok('レッド: 1000 LP paid at my End Phase',lp(0)===7000&&z(x.t)==='sz',JSON.stringify([lp(0),z(x.t)]));
  phase('battle');const l0=lp(0);
  foeAttack(x.f,'direct');
  ok('レッド: the opponent monster cannot declare an attack (no damage)',lp(0)===l0,JSON.stringify([l0,lp(0)]));
  endTurn();
  ok('レッド: the opponent End Phase costs me nothing',lp(0)===7000,String(lp(0)));
  audit('レッド 1'); }
{ const x=screenField(500);
  endTurn();
  ok('レッド: with less than 1000 LP the card is destroyed (LP unchanged)',z(x.t)==='grave'&&lp(0)===500,JSON.stringify([z(x.t),lp(0)]));
  phase('battle');const l0=lp(0);
  foeAttack(x.f,'direct');
  ok('レッド: once destroyed the opponent monster attacks freely',lp(0)<l0,JSON.stringify([l0,lp(0)])); }
{ fresh();const t=faceSet(SOR,0),rdd=mon('レッド・デーモンズ・ドラゴン',0),tu=mk('ウォーター・スピリット',0),non=mk('ワイト',0);
  gameState.players[0].sz=[t];gameState.players[0].mz=[rdd];gameState.players[0].grave=[tu,non];baselineA();
  actSzC(t);
  ok('レッド ②: the face-up card offers its effect',szActs(t).indexOf('effect')>=0,JSON.stringify(szActs(t)));
  actSzC(t,[uid(tu)]);
  ok('レッド ②: destroyed itself and Special Summoned the Level 1 Tuner (the non-Tuner stays)',z(t)==='grave'&&z(tu)==='mz'&&z(non)==='grave',JSON.stringify({t:z(t),tu:z(tu),non:z(non)}));
  audit('レッド 2'); }
{ fresh();const t=faceSet(SOR,0),tu=mk('ウォーター・スピリット',0);
  gameState.players[0].sz=[t];gameState.players[0].grave=[tu];baselineA();
  actSzC(t);
  ok('レッド ② negative: no レッド・デーモンズ・ドラゴン on the field → the effect is not offered',szActs(t).indexOf('effect')<0,JSON.stringify(szActs(t))); }
`);

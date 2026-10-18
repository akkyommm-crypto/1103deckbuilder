/* S03-U422: 巻きすぎた発条, スクラップ・オイルゾーン, 増草剤, 血の沼地 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4160001;
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
const MAK='巻きすぎた発条',OIL='スクラップ・オイルゾーン',GRO='増草剤',SWP='血の沼地';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function szActs(c){return getLegalZoneActions(0,'sz',idx(c)).map(a=>a.id);}
function lockReason(p,c){return monsterActivationLockReasonS03(p,C(c),'sz',dbOf(C(c)),{});}

/* ===== 巻きすぎた発条 ===== */
{ fresh();const s=mk(MAK,0,'up'),zm=mk('ゼンマイソルジャー',0);gameState.players[0].hand=[s];gameState.players[0].grave=[zm];baselineA();
  ok('発条: activatable (a 「ゼンマイ」 monster in my Graveyard)',legalH(0).ok===true,JSON.stringify(legalH(0)));
  cast(0,MAK,[uid(zm)]);
  ok('発条: the Zenmai was Special Summoned face-up in Defense Position; the Spell went to the Graveyard',z(zm)==='mz'&&C(zm).pos==='def'&&C(zm).face==='up'&&z(s)==='grave',JSON.stringify([z(zm),C(zm)&&C(zm).pos,C(zm)&&C(zm).face,z(s)]));
  ok('発条: its effect is negated',API.isEffectNegated(findCardByUid(zm.uid))===true,'');
  ok('発条: it cannot be Released (not a Tribute candidate)',!tributeCandidates(0,dbOf({id:findCardIndex('ブラック・マジシャン')})).some(x=>x.card===C(zm)),'');
  ok('発条: it cannot be a Synchro Material',materialCandidates(0,'synchro').every(x=>x.card!==C(zm)),'');
  audit('発条 1'); }
{ fresh();const s=mk(MAK,0,'up'),w=mk('ワイト',0);gameState.players[0].hand=[s];gameState.players[0].grave=[w];baselineA();
  ok('発条 negative: no 「ゼンマイ」 monster in the Graveyard → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== スクラップ・オイルゾーン ===== */
{ fresh();const s=mk(OIL,0,'up'),sc=mk('スクラップ・コング',0);gameState.players[0].hand=[s];gameState.players[0].grave=[sc];baselineA();
  ok('オイルゾーン: activatable (a 「スクラップ」 monster in my Graveyard)',legalH(0).ok===true,JSON.stringify(legalH(0)));
  cast(0,OIL,[uid(sc)]);
  ok('オイルゾーン: the Continuous Spell stays on the field and the monster was Special Summoned with its effects negated',z(s)==='sz'&&z(sc)==='mz'&&API.isEffectNegated(findCardByUid(sc.uid))===true,JSON.stringify([z(s),z(sc),API.isEffectNegated(findCardByUid(sc.uid))]));
  ok('オイルゾーン: I cannot conduct the Battle Phase this turn',API.phaseSkipped(0,'battle')===true,'');
  API.destroy(findCardByUid(s.uid),'test');
  ok('オイルゾーン: when the Spell left the field the monster was destroyed',z(s)==='grave'&&z(sc)==='grave',JSON.stringify([z(s),z(sc)]));
  audit('オイルゾーン 1'); }
{ fresh();const s=mk(OIL,0,'up'),sc=mk('スクラップ・コング',0);gameState.players[0].hand=[s];gameState.players[0].grave=[sc];baselineA();
  cast(0,OIL,[uid(sc)]);
  API.destroy(findCardByUid(sc.uid),'test');
  ok('オイルゾーン: when the monster left the field the Spell was destroyed',z(sc)==='grave'&&z(s)==='grave',JSON.stringify([z(s),z(sc)])); }
{ fresh();const s=mk(OIL,0,'up'),w=mk('ワイト',0);gameState.players[0].hand=[s];gameState.players[0].grave=[w];baselineA();
  ok('オイルゾーン negative: no 「スクラップ」 monster in the Graveyard → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 増草剤 ===== */
{ fresh();const s=mk(GRO,0,'up'),p=mk('E・HERO クノスペ',0);gameState.players[0].hand=[s];gameState.players[0].grave=[p];baselineA();
  cast(0,GRO);
  ok('増草剤: placed face-up on my Spell & Trap Zone',z(s)==='sz'&&C(s).face==='up',JSON.stringify([z(s),C(s)&&C(s).face]));
  ok('増草剤: the ignition is offered (a Plant in my Graveyard)',szActs(s).indexOf('activate')>=0||szActs(s).indexOf('effect')>=0,JSON.stringify(szActs(s)));
  actSzC(s,[uid(p)]);
  ok('増草剤: the Plant was Special Summoned; I cannot Normal Summon this turn; once per turn',z(p)==='mz'&&!!v46FaceUpSummonRestrictionReason(0,dbOf({id:findCardIndex('ワイト')}),'normal'),JSON.stringify([z(p),v46FaceUpSummonRestrictionReason(0,dbOf({id:findCardIndex('ワイト')}),'normal')]));
  API.destroy(findCardByUid(p.uid),'test');
  ok('増草剤: when the Plant left the field the Spell was destroyed',z(p)==='grave'&&z(s)==='grave',JSON.stringify([z(p),z(s)]));
  audit('増草剤 1'); }
{ fresh();const s=mk(GRO,0,'up'),w=mk('ワイト',0);gameState.players[0].hand=[s];gameState.players[0].grave=[w];baselineA();
  cast(0,GRO);
  ok('増草剤 negative: no Plant in the Graveyard → the ignition is not offered',szActs(s).indexOf('effect')<0&&szActs(s).indexOf('activate')<0,JSON.stringify(szActs(s))); }

/* ===== 血の沼地 ===== */
{ fresh();const t=setCard(SWP,0),foe=setCard('激流葬',1);gameState.players[0].sz=[t];gameState.players[1].sz=[foe];baselineA();
  const t0=gameState.turn;actSzC(t);
  ok('血の沼地: face-up on the field; the expiry is stamped (my turn: +4)',z(t)==='sz'&&C(t).face==='up'&&C(t).u422End===t0+4,JSON.stringify([z(t),C(t)&&C(t).face,C(t)&&C(t).u422End]));
  ok('血の沼地: a Set card of the Spell & Trap Zone cannot be activated (the opponent\'s Set trap is refused)',!!lockReason(1,foe),JSON.stringify([lockReason(1,foe)]));
  ok('血の沼地: an activation from the hand is not locked',monsterActivationLockReasonS03(0,mk('死者蘇生',0),'hand',dbOf({id:findCardIndex('死者蘇生')}),{})==='','');
  endTurn();endTurn();endTurn();endTurn();
  ok('血の沼地: destroyed at my 2nd Standby Phase after the activation',z(t)==='grave',z(t));
  audit('血の沼地 1'); }
{ fresh();const t=setCard(SWP,0),o=setCard('激流葬',0);gameState.players[0].sz=[t,o];baselineA();
  actSzC(t);
  ok('血の沼地: another Spell / Trap Card of mine on the field → it is destroyed',z(t)==='grave',z(t)); }
`);

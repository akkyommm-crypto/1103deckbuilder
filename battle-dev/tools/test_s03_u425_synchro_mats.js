/* S03-U425: モノケロース, 紅蓮地帯を飛ぶ鷹, 共鳴破, トラパート (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4190001;
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
const MON='モノケロース',HAW='紅蓮地帯を飛ぶ鷹',RES='共鳴破',TRA='トラパート';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function doSynchro(mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function myAttackStart(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});}
function combos(exName){return exCombos(0,dbOf({id:findCardIndex(exName)})).combos.map(c=>c.materials.slice().sort((a,b)=>a-b).join());}

/* ===== モノケロース ===== */
{ fresh();const m=mk(MON,0),sp=mk('死者蘇生',0);gameState.players[0].hand=[m,sp];baselineA();
  ok('モノケロース: Special Summonable by banishing a Spell Card of the hand',procOk(MON,0)===true,'');
  PREFER=[uid(sp)];procRun(MON,0);PREFER=[];
  ok('モノケロース: it stands on the field and the Spell was banished',z(m)==='mz'&&z(sp)==='banish',JSON.stringify([z(m),z(sp)]));
  audit('モノケロース 1'); }
{ fresh();const m=mk(MON,0),w=mk('ワイト',0);gameState.players[0].hand=[m,w];baselineA();
  ok('モノケロース negative: no Spell Card in the hand → not Special Summonable',procOk(MON,0)===false,''); }
{ fresh();const m=mon(MON,0),ea=mon('X－セイバー エアベルン',0),ga=mk('大地の騎士ガイアナイト',0);gameState.players[0].mz=[m,ea];gameState.players[0].ex=[ga];baselineA();
  PREFER=[uid(ea)];doSynchro([m,ea]);PREFER=[];
  ok('モノケロース: Synchro Summon with a Beast Tuner (エアベルン) → the Beast Tuner was Special Summoned back from the Graveyard',z(ga)==='mz'&&z(ea)==='mz'&&z(m)==='grave',JSON.stringify([z(ga),z(ea),z(m)]));
  audit('モノケロース 2'); }
{ fresh();const m=mon(MON,0),tu=mon('ジェネクス・コントローラー',0),ga=mk('大地の騎士ガイアナイト',0);gameState.players[0].mz=[m,tu];gameState.players[0].ex=[ga];baselineA();
  doSynchro([m,tu]);
  ok('モノケロース negative: the Tuner is a Machine (not a Beast) → nothing is Special Summoned back',z(ga)==='mz'&&z(tu)==='grave',JSON.stringify([z(ga),z(tu)])); }

/* ===== 紅蓮地帯を飛ぶ鷹 ===== */
{ fresh();const h=mon(HAW,0),ih=mon('アイアン・ハート',0),ga=mk('大地の騎士ガイアナイト',0),l1=mk('ラヴァルのマグマ砲兵',0),l2=mk('ラヴァルの炎車回し',0),l3=mk('ラヴァルバーナー',0);
  gameState.players[0].mz=[h,ih];gameState.players[0].ex=[ga];gameState.players[0].grave=[l1,l2,l3];baselineA();
  doSynchro([h,ih]);
  ok('鷹: used as a Synchro Material with 3 kinds of 「ラヴァル」 in my Graveyard → Special Summoned from the Graveyard',z(ga)==='mz'&&z(h)==='mz',JSON.stringify([z(ga),z(h)]));
  API.sendToGrave(findCardByUid(h.uid),'test');
  ok('鷹: leaving the field it is banished',z(h)==='banish',z(h));
  audit('鷹 1'); }
{ fresh();const h=mon(HAW,0),ih=mon('アイアン・ハート',0),ga=mk('大地の騎士ガイアナイト',0),l1=mk('ラヴァルのマグマ砲兵',0),l2=mk('ラヴァルの炎車回し',0);
  gameState.players[0].mz=[h,ih];gameState.players[0].ex=[ga];gameState.players[0].grave=[l1,l2];baselineA();
  doSynchro([h,ih]);
  ok('鷹 negative: only 2 kinds of 「ラヴァル」 in the Graveyard → it stays in the Graveyard',z(ga)==='mz'&&z(h)==='grave',JSON.stringify([z(ga),z(h)])); }

/* ===== 共鳴破 ===== */
{ fresh();const t=setCard(RES,0),r=mon('クリエイト・リゾネーター',0),w=mon('13人目の埋葬者',0),f=mon('ブラック・マジシャン',1),ga=mk('大地の騎士ガイアナイト',0);
  gameState.players[0].sz=[t];gameState.players[0].mz=[r,w];gameState.players[0].ex=[ga];gameState.players[1].mz=[f];baselineA();
  const t0=gameState.turn;actSzC(t);
  ok('共鳴破: face-up; the expiry is stamped (my 2nd End Phase: +2 in my turn)',z(t)==='sz'&&C(t).face==='up'&&C(t).u425End===t0+2,JSON.stringify([z(t),C(t)&&C(t).face,C(t)&&C(t).u425End]));
  PREFER=[uid(f)];doSynchro([r,w]);PREFER=[];
  ok('共鳴破: a 「リゾネーター」 sent as a Synchro Material → a card of the opponent\'s field was destroyed',z(ga)==='mz'&&z(f)==='grave',JSON.stringify([z(ga),z(f)]));
  endTurn();endTurn();
  ok('共鳴破: still on the field before my 2nd End Phase…',z(t)==='sz',z(t));
  endTurn();
  ok('共鳴破: …destroyed at my 2nd End Phase after the activation',z(t)==='grave',z(t));
  audit('共鳴破 1'); }
{ fresh();const t=setCard(RES,0),a=mon('ジェネクス・コントローラー',0),w=mon('13人目の埋葬者',0),f=mon('ブラック・マジシャン',1),ga=mk('大地の騎士ガイアナイト',0);
  gameState.players[0].sz=[t];gameState.players[0].mz=[a,w];gameState.players[0].ex=[ga];gameState.players[1].mz=[f];baselineA();
  actSzC(t);doSynchro([a,w]);
  ok('共鳴破 negative: a Tuner that is not a 「リゾネーター」 → nothing destroyed',z(ga)==='mz'&&z(f)==='mz',JSON.stringify([z(ga),z(f)])); }

/* ===== トラパート ===== */
{ fresh();const tr=mon(TRA,0),zm=mon('ゾンビ・マスター',0),ga=mk('大地の騎士ガイアナイト',0),br=mk('氷結界の龍 ブリューナク',0);
  gameState.players[0].mz=[tr,zm];gameState.players[0].ex=[ga,br];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x),kg=combos('大地の騎士ガイアナイト'),kb=combos('氷結界の龍 ブリューナク');
  ok('トラパート: usable for a Warrior Synchro Monster (ガイアナイト Lv6 = 2 + 4)',kg.indexOf([i(tr),i(zm)].sort((a,b)=>a-b).join())>=0,JSON.stringify(kg));
  ok('トラパート: not for a non-Warrior Synchro Monster (氷結界の龍 ブリューナク)',kb.every(c=>c.split(',').map(Number).indexOf(i(tr))<0),JSON.stringify(kb)); }
{ fresh();const ga=mon('大地の騎士ガイアナイト',0),f=mon('ワイト',1),t=setCard('攻撃の無力化',1);
  ga.v380SummonMaterials=[{name:TRA,tuner:true,lv:2},{name:'ゾンビ・マスター',tuner:false,lv:4}];
  gameState.players[0].mz=[ga];gameState.players[1].mz=[f];gameState.players[1].sz=[t];baselineA();
  phase('battle');myAttackStart(ga,f);
  const lockR=monsterActivationLockReasonS03(1,C(t),'sz',dbOf(C(t)),{});
  duelActivateResponseV2(1,'sz',idx(t));drive();
  ok('トラパート: the Synchro Monster that used it attacks → the opposing Set trap is locked and the attack went through (ワイト destroyed)',z(f)==='grave'&&z(t)==='sz'&&C(t).face==='down',JSON.stringify([lockR,z(f),z(t),C(t)&&C(t).face]));
  audit('トラパート 1'); }
{ fresh();const ga=mon('大地の騎士ガイアナイト',0),f=mon('ワイト',1),t=setCard('攻撃の無力化',1);
  gameState.players[0].mz=[ga];gameState.players[1].mz=[f];gameState.players[1].sz=[t];baselineA();
  phase('battle');myAttackStart(ga,f);
  const lockR=monsterActivationLockReasonS03(1,C(t),'sz',dbOf(C(t)),{});
  duelActivateResponseV2(1,'sz',idx(t));drive();
  ok('トラパート control: without the material the same Set trap is activated and negates the attack (ワイト survives)',lockR===''&&z(f)==='mz'&&z(t)==='grave',JSON.stringify([lockR,z(f),z(t)])); }
`);

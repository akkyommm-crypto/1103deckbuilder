/* S03-U423: フィールドバリア, 宮廷のしきたり, 安全地帯 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4170001;
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
const BAR='フィールドバリア',COU='宮廷のしきたり',SAF='安全地帯';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function zoneAct(c){return getLegalZoneActions(0,'sz',idx(c)).some(x=>x.id==='activate'||x.id==='activateSet');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function H(c){return findCardByUid(c.uid);}

/* ===== フィールドバリア ===== */
{ fresh();const b=mk(BAR,0,'up'),fs=mk('竜の渓谷',1,'up'),ct=mk('王宮の鉄壁',1,'up'),hf=mk('竜の渓谷',0,'up');
  gameState.players[0].hand=[b,hf];gameState.players[1].field=fs;gameState.players[1].sz=[ct];baselineA();
  cast(0,BAR);
  ok('フィールドバリア: placed face-up on my Spell & Trap Zone',z(b)==='sz'&&C(b).face==='up',JSON.stringify([z(b),C(b)&&C(b).face]));
  API.destroy(H(fs),'test');
  ok('フィールドバリア: a Field Spell cannot be destroyed by a card effect (the opponent\'s 竜の渓谷 stays)',z(fs)==='field',z(fs));
  API.destroyAll('field',1,'test');
  ok('フィールドバリア: nor by a mass destruction of the Field Zone',z(fs)==='field',z(fs));
  API.destroy(H(ct),'test');
  ok('フィールドバリア: other Spell / Trap Cards are still destroyed (the opponent\'s 王宮の鉄壁)',z(ct)==='grave',z(ct));
  const hi=gameState.players[0].hand.findIndex(c=>c.uid===hf.uid);
  ok('フィールドバリア: a Field Spell cannot be activated (the hand 竜の渓谷 is not activatable)',getLegalHandActions(0,hi).every(a=>a.id!=='activate'),JSON.stringify(getLegalHandActions(0,hi).map(a=>a.id)));
  audit('フィールドバリア 1'); }
{ fresh();const hf=mk('竜の渓谷',0,'up');gameState.players[0].hand=[hf];baselineA();
  ok('フィールドバリア control: without it the Field Spell is activatable',getLegalHandActions(0,0).some(a=>a.id==='activate'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }
{ fresh();const fs=mk('竜の渓谷',1,'up');gameState.players[1].field=fs;baselineA();
  API.destroy(H(fs),'test');
  ok('フィールドバリア control: without it the Field Spell is destroyed',z(fs)==='grave',z(fs)); }
{ fresh();const a=mk(BAR,0,'up'),b=mk(BAR,0,'up');gameState.players[0].sz=[a];gameState.players[0].hand=[b];baselineA();
  cast(0,BAR);
  ok('フィールドバリア: a second face-up copy of mine is destroyed by the one-copy rule (the later one)',z(a)==='sz'&&z(b)==='grave',JSON.stringify([z(a),z(b)])); }

/* ===== 宮廷のしきたり ===== */
{ fresh();const t=setCard(COU,0),my=mk('王宮の鉄壁',0,'up'),fo=mk('王宮の鉄壁',1,'up');gameState.players[0].sz=[t,my];gameState.players[1].sz=[fo];baselineA();
  actSzC(t);
  API.destroy(H(my),'test');API.destroy(H(fo),'test');
  ok('宮廷のしきたり: the face-up Continuous Traps of both players are not destroyed by card effects',z(my)==='sz'&&z(fo)==='sz',JSON.stringify([z(my),z(fo)]));
  API.destroy(H(t),'test');
  ok('宮廷のしきたり: it does not protect itself',z(t)==='grave',z(t));
  audit('宮廷 1'); }
{ fresh();const my=mk('王宮の鉄壁',0,'up');gameState.players[0].sz=[my];baselineA();
  API.destroy(H(my),'test');
  ok('宮廷のしきたり control: without it the Continuous Trap is destroyed',z(my)==='grave',z(my)); }
{ fresh();const a=mk(COU,0,'up'),b=setCard(COU,0);gameState.players[0].sz=[a,b];baselineA();
  actSzC(b);
  ok('宮廷のしきたり: a second face-up copy of mine is destroyed by the one-copy rule',z(a)==='sz'&&z(b)==='grave',JSON.stringify([z(a),z(b)])); }

/* ===== 安全地帯 ===== */
{ fresh();const t=setCard(SAF,0),h=mon('ブラック・マジシャン',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[0].mz=[h];gameState.players[1].mz=[f];baselineA();
  ok('安全地帯: activatable (a face-up Attack Position monster)',zoneAct(t)===true,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id)));
  actSzC(t,[uid(h)]);
  ok('安全地帯: face-up; the host cannot attack directly',z(t)==='sz'&&C(t).face==='up'&&C(t).u423Host===h.uid&&cannotDirectAttackNow(C(h))===true,JSON.stringify([z(t),C(t)&&C(t).u423Host,cannotDirectAttackNow(C(h))]));
  API.destroy(H(h),'test',1);
  ok('安全地帯: not destroyed by the opponent\'s effect',z(h)==='mz',z(h));
  toOppBattle();foeAttack(f,h);
  ok('安全地帯: not destroyed by battle (青眼 3000 vs ブラック・マジシャン 2500)',z(h)==='mz',z(h));
  audit('安全地帯 1'); }
{ fresh();const t=setCard(SAF,0),h=mon('ブラック・マジシャン',0);gameState.players[0].sz=[t];gameState.players[0].mz=[h];baselineA();
  actSzC(t,[uid(h)]);
  API.destroy(H(t),'test');
  ok('安全地帯: when the Trap left the field the monster was destroyed',z(t)==='grave'&&z(h)==='grave',JSON.stringify([z(t),z(h)])); }
{ fresh();const t=setCard(SAF,0),h=mon('ブラック・マジシャン',0);gameState.players[0].sz=[t];gameState.players[0].mz=[h];baselineA();
  actSzC(t,[uid(h)]);
  API.destroy(H(h),'test',0);
  ok('安全地帯: when the monster left the field the Trap was destroyed',z(h)==='grave'&&z(t)==='grave',JSON.stringify([z(t),z(h)])); }
{ fresh();const t=setCard(SAF,0),h=mon('ブラック・マジシャン',0,'def');gameState.players[0].sz=[t];gameState.players[0].mz=[h];baselineA();
  ok('安全地帯 negative: only a Defense Position monster → not activatable',zoneAct(t)===false,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id))); }
`);

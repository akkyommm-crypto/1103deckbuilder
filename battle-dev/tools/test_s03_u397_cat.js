/* S03-U397: 不幸を告げる黒猫, ボーンクラッシャー, エレクトロ軍曹 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3970001;
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























const CAT='不幸を告げる黒猫',BON='ボーンクラッシャー',SGT='エレクトロ軍曹';
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function szActs(p,c){return getLegalZoneActions(p,'sz',idx(c)).map(a=>a.id);}

/* ===== 不幸を告げる黒猫 ===== */
function catField(necro){fresh();const c=mk(CAT,0,'down','def');c.setTurn=4;c.summonedTurn=3;const t1=mk('激流葬',0),t2=mk('聖なるバリア －ミラーフォース－',0),f=mon('ワイト',1);
  gameState.players[0].mz=[c];gameState.players[0].deck=[mk('ワイト',0),t1,t2].concat(gameState.players[0].deck);gameState.players[1].mz=[f];
  if(necro){gameState.players[0].field=mk('王家の眠る谷－ネクロバレー',0,'up');}
  baselineA();return {c,t1,t2,f};}
{ const x=catField(false);
  toOppBattle();
  PREFER=[uid(x.t1)];foeAttack(x.f,x.c);PREFER=[];drive();
  ok('黒猫: flipped by the attack → a Trap of the Deck was placed on top (not in hand yet)',C(x.c).face==='up'&&z(x.t1)==='deck',JSON.stringify([C(x.c)&&C(x.c).face,z(x.t1)]));
  endTurn();
  ok('黒猫: and it is drawn in my next Draw Phase',z(x.t1)==='hand',z(x.t1));
  audit('黒猫 1'); }
{ const x=catField(true);
  toOppBattle();
  PREFER=['yes',uid(x.t2)];foeAttack(x.c?x.f:x.f,x.c);PREFER=[];drive();
  ok('黒猫: with 王家の眠る谷－ネクロバレー on the field the Trap is added to the hand instead',z(x.t2)==='hand',z(x.t2));
  audit('黒猫 2'); }
{ fresh();const c=mk(CAT,0,'down','def');c.setTurn=4;c.summonedTurn=3;const f=mon('ワイト',1);gameState.players[0].mz=[c];gameState.players[0].deck=Array.from({length:6},()=>mk('ワイト',0));gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,c);drive();
  ok('黒猫 negative: no Trap in the Deck → flipped, nothing else happens',C(c).face==='up'&&!pc(),JSON.stringify([C(c)&&C(c).face,!!pc()])); }

/* ===== ボーンクラッシャー ===== */
{ fresh();const zm=mon('ゾンビ・マスター',0),dc=mk('ワイト',0),bc=mk(BON,0),tr=faceSet('ブラック・ホール',1);
  gameState.players[0].mz=[zm];gameState.players[0].hand=[dc];gameState.players[0].grave=[bc];gameState.players[1].sz=[tr];baselineA();
  actC(zm,[uid(dc),uid(bc),'yes',uid(tr)]);
  ok('ボーンクラッシャー: revived by an Undead monster effect (ゾンビ・マスター) → the opponent Set Spell was destroyed',z(bc)==='mz'&&z(tr)==='grave',JSON.stringify({bc:z(bc),tr:z(tr)}));
  phase('end');
  ok('ボーンクラッシャー: destroyed at the End Phase of the turn it was Special Summoned',z(bc)==='grave',z(bc));
  audit('ボーンクラッシャー 1'); }
{ fresh();const rev=mk('死者蘇生',0),bc=mk(BON,0),tr=faceSet('ブラック・ホール',1);
  gameState.players[0].hand=[rev];gameState.players[0].grave=[bc];gameState.players[1].sz=[tr];baselineA();
  PREFER=[uid(bc)];duelActivateFromHand(0);drive();PREFER=[];
  ok('ボーンクラッシャー negative: revived by a Spell (死者蘇生), not an Undead monster effect → the Trap is not destroyed',z(bc)==='mz'&&z(tr)==='sz',JSON.stringify({bc:z(bc),tr:z(tr)}));
  phase('end');
  ok('ボーンクラッシャー: but it is still destroyed at the End Phase',z(bc)==='grave',z(bc)); }

/* ===== エレクトロ軍曹 ===== */
{ fresh();const s=mon(SGT,0),t=faceSet('ブラック・ホール',1),f=mon('ワイト',1);gameState.players[0].mz=[s];gameState.players[1].sz=[t];gameState.players[1].mz=[f];baselineA();
  ok('軍曹: the ignition effect is available (a Set card of the opponent)',canZ(s)===true,'');
  actC(s,[uid(t)]);
  ok('軍曹: once per turn',canZ(s)===false,'');
  endTurn();
  ok('軍曹: in the opponent turn the targeted Set card cannot be activated',szActs(1,t).indexOf('activateSet')<0&&szActs(1,t).indexOf('activate')<0,JSON.stringify(szActs(1,t)));
  audit('軍曹 1'); }
{ fresh();const t=faceSet('ブラック・ホール',1),f=mon('ワイト',1);gameState.players[1].sz=[t];gameState.players[1].mz=[f];baselineA();
  endTurn();
  ok('軍曹 control: without it the Set Spell can be activated in the opponent turn',szActs(1,t).indexOf('activateSet')>=0||szActs(1,t).indexOf('activate')>=0,JSON.stringify(szActs(1,t))); }
{ fresh();const s=mon(SGT,0);gameState.players[0].mz=[s];baselineA();
  ok('軍曹 negative: no Set card of the opponent → not offered',canZ(s)===false,''); }
`);

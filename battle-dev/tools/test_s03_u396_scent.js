/* S03-U396: 魔封じの芳香, 氷結界の破術師, 八つ手サソリ, A・O・J リバース・ブレイク (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3960001;
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






















const SCE='魔封じの芳香',DES='氷結界の破術師',SCO='八つ手サソリ',AOJ='A・O・J リバース・ブレイク';
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalHp(p,i){return getLegalHandActions(p,i).some(x=>x.id==='activate');}
function zoneAct(p,c){return getLegalZoneActions(p,'sz',idx(c)).map(a=>a.id).some(x=>x==='activate'||x==='activateSet');}

/* ===== 魔封じの芳香 ===== */
{ fresh();const sc=mk(SCE,0,'up'),bh=mk('ブラック・ホール',0),f=mon('ワイト',1);gameState.players[0].sz=[sc];gameState.players[0].hand=[bh];gameState.players[1].mz=[f];baselineA();
  ok('芳香: a Spell Card cannot be activated from the hand',legalHp(0,0)===false,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  endTurn();audit('芳香 1'); }
{ fresh();const bh=mk('ブラック・ホール',0),f=mon('ワイト',1);gameState.players[0].hand=[bh];gameState.players[1].mz=[f];baselineA();
  ok('芳香 control: without it the Spell can be activated from the hand',legalHp(0,0)===true,''); }
{ fresh();const sc=mk(SCE,0,'up'),set=faceSet('ブラック・ホール',0),f=mon('ワイト',1);gameState.players[0].sz=[sc,set];gameState.players[1].mz=[f];baselineA();
  ok('芳香: a Spell Set in turn 4 cannot be activated in turn 5 (before my next turn)',zoneAct(0,set)===false,JSON.stringify(getLegalZoneActions(0,'sz',idx(set)).map(a=>a.id)));
  endTurn();endTurn();
  ok('芳香: nor can it in the opponent turn; from my next turn (turn 7) on the Set Spell can be activated',zoneAct(0,set)===true,JSON.stringify(getLegalZoneActions(0,'sz',idx(set)).map(a=>a.id))); }
{ fresh();const sc=mk(SCE,0,'up'),bh=mk('ブラック・ホール',1),f=mon('ワイト',0);gameState.players[0].sz=[sc];gameState.players[0].mz=[f];gameState.players[1].hand=[bh];baselineA();
  endTurn();
  ok('芳香: the opponent cannot activate a Spell from the hand either',legalHp(1,0)===false,JSON.stringify(getLegalHandActions(1,0).map(a=>a.id))); }

/* ===== 氷結界の破術師 ===== */
{ fresh();const d=mon(DES,0),o=mon('氷結界の輸送部隊',0),bh=mk('ブラック・ホール',0),f=mon('ワイト',1);gameState.players[0].mz=[d,o];gameState.players[0].hand=[bh];gameState.players[1].mz=[f];baselineA();
  ok('破術師: with another 「氷結界」 monster on my field a Spell cannot be activated from the hand',legalHp(0,0)===false,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  endTurn();audit('破術師 1'); }
{ fresh();const d=mon(DES,0),bh=mk('ブラック・ホール',0),f=mon('ワイト',1);gameState.players[0].mz=[d];gameState.players[0].hand=[bh];gameState.players[1].mz=[f];baselineA();
  ok('破術師 negative: alone (no other 「氷結界」 monster) → no lock',legalHp(0,0)===true,''); }

/* ===== 八つ手サソリ ===== */
{ fresh();const s=mon(SCO,0);gameState.players[0].mz=[s];baselineA();
  ok('サソリ: the Set effect is available',canZ(s)===true,'');
  actC(s);
  ok('サソリ: turned face-down Defense Position',C(s).face==='down'&&C(s).pos==='def',JSON.stringify([C(s).face,C(s).pos]));
  audit('サソリ 1'); }
{ fresh();const s=mon(SCO,0),f=mk('ブラック・マジシャン',1,'down','def');f.setTurn=4;gameState.players[0].mz=[s];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,s,f);
  ok('サソリ: attacking a face-down Defense monster (DEF 2100) its ATK is 2400 in the damage calculation → destroyed',z(f)==='grave'&&z(s)==='mz',JSON.stringify([z(f),z(s)]));
  audit('サソリ 2'); }
{ fresh();const s=mon(SCO,0),f=mk('ブラック・マジシャン',1,'up','def');gameState.players[0].mz=[s];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,s,f);
  ok('サソリ negative: against a face-up Defense monster the ATK stays 300 → nothing destroyed',z(f)==='mz'&&z(s)==='mz',JSON.stringify([z(f),z(s)])); }

/* ===== A・O・J リバース・ブレイク ===== */
{ fresh();const r=mon(AOJ,0),f=mk('ブラック・マジシャン',1,'down','def');f.setTurn=4;gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l0=lp(0);atkTarget(0,r,f);
  ok('リバース・ブレイク: attacking a face-down Defense monster destroys it without damage calculation (no damage to me, ATK 1200 < DEF 2100)',z(f)==='grave'&&z(r)==='mz'&&lp(0)===l0,JSON.stringify([z(f),z(r),lp(0)]));
  audit('リバース・ブレイク 1'); }
{ fresh();const r=mon(AOJ,0),l=mon('青眼の白龍',1);gameState.players[0].mz=[r];gameState.players[1].mz=[l];baselineA();
  phase('battle');drive();
  ok('リバース・ブレイク: destroyed while a LIGHT monster is on the field',z(r)==='grave',z(r)); }
{ fresh();const r=mon(AOJ,0),f=mon('ワイト',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  phase('battle');drive();
  ok('リバース・ブレイク negative: no LIGHT monster (ワイト is DARK) → stays',z(r)==='mz',z(r)); }
`);

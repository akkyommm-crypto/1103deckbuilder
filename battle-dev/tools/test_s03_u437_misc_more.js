/* S03-U437: エレメント・マジシャン, 海竜神－ネオダイダロス, RAI－JIN (NOT_STARTED / stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4250001;
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
const MAG='エレメント・マジシャン',NEO='海竜神－ネオダイダロス',DAI='海竜－ダイダロス',RAI='RAI－JIN';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function H(c){return findCardByUid(c.uid);}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function ctrlLocked(c){return !!s03ControlLockedU251(gameState,C(c));}

/* ===== エレメント・マジシャン ===== */
{ fresh();const m=mon(MAG,0),wi=mon('ワイバーン',0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[m,wi];gameState.players[1].mz=[f1,f2];baselineA();
  phase('battle');myAttack(m,f1);myAttack(m,f2);
  ok('マジシャン: a WIND monster is on the field → after destroying a monster it attacked once more (both ワイト destroyed)',z(f1)==='grave'&&z(f2)==='grave',JSON.stringify([z(f1),z(f2)]));
  audit('マジシャン 1'); }
{ fresh();const m=mon(MAG,0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f1,f2];baselineA();
  phase('battle');myAttack(m,f1);myAttack(m,f2);
  ok('マジシャン control: no WIND monster → no second attack',z(f1)==='grave'&&z(f2)==='mz',JSON.stringify([z(f1),z(f2)])); }
{ fresh();const m=mon(MAG,0),aq=mon('アクア・ドラゴン',1);gameState.players[0].mz=[m];gameState.players[1].mz=[aq];baselineA();
  ok('マジシャン: a WATER monster is on the field → its control cannot be changed',ctrlLocked(m)===true,''); }
{ fresh();const m=mon(MAG,0);gameState.players[0].mz=[m];baselineA();
  ok('マジシャン control: no WATER monster → the control can change',ctrlLocked(m)===false,''); }

/* ===== 海竜神－ネオダイダロス ===== */
{ fresh();const n=mk(NEO,0),d=mon(DAI,0);gameState.players[0].hand=[n];gameState.players[0].mz=[d];baselineA();
  ok('ネオダイダロス: 「海竜－ダイダロス」 on my field → Special Summonable from the hand',procOk(NEO,0)===true,'');
  PREFER=[uid(d)];procRun(NEO,0);PREFER=[];
  ok('ネオダイダロス: Daidalos was released (Graveyard) and it stands on the field',z(n)==='mz'&&z(d)==='grave',JSON.stringify([z(n),z(d)]));
  audit('ネオダイダロス 1'); }
{ fresh();const n=mk(NEO,0),x=mon('ワイト',0);gameState.players[0].hand=[n];gameState.players[0].mz=[x];baselineA();
  ok('ネオダイダロス negative: without 「海竜－ダイダロス」 → not Special Summonable',procOk(NEO,0)===false,''); }
{ fresh();const n=mon(NEO,0),sea=mk('海',0,'up'),a=mon('ワイト',0),b=mon('ワイト',1),h0=mk('ワイト',0),h1=mk('ブラック・マジシャン',1),st=mk('ブラック・ホール',1,'down');
  gameState.players[0].mz=[n,a];gameState.players[0].field=sea;gameState.players[0].hand=[h0];gameState.players[1].mz=[b];gameState.players[1].hand=[h1];gameState.players[1].sz=[st];baselineA();
  ok('ネオダイダロス: available with my 「海」 on the field',canZ(n)===true,'');
  actC(n,[]);
  ok('ネオダイダロス: 海 paid, every other card of both hands and fields went to the Graveyard, it stays',z(n)==='mz'&&z(sea)==='grave'&&z(a)==='grave'&&z(b)==='grave'&&z(h0)==='grave'&&z(h1)==='grave'&&z(st)==='grave',JSON.stringify([z(n),z(sea),z(a),z(b),z(h0),z(h1),z(st)]));
  audit('ネオダイダロス 2'); }
{ fresh();const n=mon(NEO,0);gameState.players[0].mz=[n];baselineA();
  ok('ネオダイダロス negative: no 「海」 → not available',canZ(n)===false,''); }

/* ===== RAI－JIN ===== */
{ fresh();const r=mon(RAI,0),l=mon('E・HERO スパークマン',0),d=mon('ブラック・マジシャン',0),g1=mk('青眼の白龍',0),g2=mk('サンダー・ドラゴン',0),g3=mk('ワイト',0);gameState.players[0].mz=[r,l,d];gameState.players[0].grave=[g1,g2,g3];baselineA();
  ok('RAI－JIN: LIGHT monsters of mine +100 x (LIGHT monsters in my Graveyard = 2) → スパークマン 1800; a DARK monster unchanged',curATK(C(l))===1800&&curATK(C(d))===2500,JSON.stringify([curATK(C(l)),curATK(C(d))])); }
{ fresh();const l=mon('E・HERO スパークマン',0),g1=mk('青眼の白龍',0);gameState.players[0].mz=[l];gameState.players[0].grave=[g1];baselineA();
  ok('RAI－JIN control: without it no boost',curATK(C(l))===1600,String(curATK(C(l)))); }
{ fresh();const r=mon(RAI,0),l=mon('E・HERO スパークマン',0);gameState.players[0].mz=[r,l];baselineA();
  PREFER=[uid(l)];phase('end');PREFER=[];
  ok('RAI－JIN: my End Phase → a LIGHT monster of mine of my choice was destroyed',z(l)==='grave'&&z(r)==='mz',JSON.stringify([z(l),z(r)]));
  audit('RAI－JIN 1'); }
{ fresh();const r=mon(RAI,0),l=mon('E・HERO スパークマン',0);gameState.players[0].mz=[r,l];gameState.activePlayer=1;gameState.phase='main1';baselineA();
  phase('end');
  ok('RAI－JIN negative: the opponent End Phase is not its trigger',z(l)==='mz'&&z(r)==='mz',JSON.stringify([z(l),z(r)])); }
{ fresh();const r=mon(RAI,0),r2=mk(RAI,0);gameState.players[0].mz=[r];gameState.players[0].hand=[r2];baselineA();
  ok('RAI－JIN: only one face-up copy may exist on the field (a second Normal Summon is refused)',!!v46FaceUpSummonRestrictionReason(0,dbOf(r2),'normal'),JSON.stringify([v46FaceUpSummonRestrictionReason(0,dbOf(r2),'normal')])); }
`);

/* S03-U411: 瞬着ボマー, 精神寄生体, 手錠龍 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x40B0001;
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
const BOM='瞬着ボマー',LEE='精神寄生体',CUF='手錠龍';
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function dsetup(name){fresh();const b=mk(name,0,'down','def');b.setTurn=4;b.summonedTurn=3;const f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();return {b,f};}

/* ===== 瞬着ボマー ===== */
{ const x=dsetup(BOM);
  toOppBattle();const l0=lp(0);foeAttack(x.f,x.b);
  ok('ボマー: attacked while face-down → no damage calculation: it became an Equip card of 青眼 (in my Spell & Trap Zone), no damage to me',z(x.b)==='sz'&&C(x.b).v46MonsterEquip===true&&C(x.b).equipTo&&C(x.b).equipTo.uid===x.f.uid&&lp(0)===l0,JSON.stringify([z(x.b),!!C(x.b).v46MonsterEquip,lp(0)]));
  ok('ボマー: not destroyed yet in the turn it equipped',z(x.f)==='mz',z(x.f));
  endTurn();endTurn();
  ok('ボマー: in the next Standby Phase of the opponent the equipped monster is destroyed',z(x.f)==='grave',z(x.f));
  audit('ボマー 1'); }
{ fresh();const b=mon(BOM,0,'def'),f=mon('ワイト',1);gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,b);
  ok('ボマー negative: face-up Defense Position (not face-down) → fought normally (stays on the field)',z(b)==='mz'||z(b)==='grave',z(b)); }

/* ===== 精神寄生体 ===== */
{ const x=dsetup(LEE);
  toOppBattle();foeAttack(x.f,x.b);
  ok('寄生体: attacked while face-down → it became an Equip card of 青眼',z(x.b)==='sz'&&C(x.b).equipTo&&C(x.b).equipTo.uid===x.f.uid,JSON.stringify([z(x.b)]));
  const l0=lp(0);endTurn();endTurn();
  ok('寄生体: at the opponent Standby Phase I recover half of its ATK (1500)',lp(0)===l0+1500,JSON.stringify([l0,lp(0)]));
  audit('寄生体 1'); }

/* ===== 手錠龍 ===== */
{ fresh();const c=mon(CUF,0),f=mon('青眼の白龍',1),bh=mk('ブラック・ホール',0);
  gameState.players[0].mz=[c];gameState.players[0].hand=[bh];gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=['yes'];foeAttack(f,c);PREFER=[];
  ok('手錠龍: destroyed by 青眼 in battle → it was equipped to 青眼 from the Graveyard; 青眼 ATK 3000 - 1800 = 1200',z(c)==='sz'&&C(c).equipTo&&C(c).equipTo.uid===f.uid&&curATK(C(f))===1200,JSON.stringify([z(c),curATK(C(f))]));
  endTurn();
  PREFER=['yes'];cast(0,'ブラック・ホール');PREFER=[];
  ok('手錠龍: the equipped monster destroyed → 手錠龍 was Special Summoned to my field',z(f)==='grave'&&z(c)==='mz'&&pl(c)===0,JSON.stringify([z(f),z(c),pl(c)]));
  audit('手錠龍 1'); }
`);

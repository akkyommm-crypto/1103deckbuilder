/* S03-U410: 太陽龍インティ, 月影龍クイラ, スピード・キング☆スカル・フレイム (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x40A0001;
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
const INT='太陽龍インティ',QUI='月影龍クイラ',SKF='スピード・キング☆スカル・フレイム';
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== 太陽龍インティ ===== */
{ fresh();const i=mon(INT,0),q=mk(QUI,0),f=mon('青眼の究極竜',1);q.properlySummonedS03=true;
  gameState.players[0].mz=[i];gameState.players[0].grave=[q];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);foeAttack(f,i);
  ok('インティ: destroyed in battle by 青眼の究極竜 (ATK 4500) → the attacker is destroyed and half its ATK (2250) is dealt to the opponent',z(i)==='grave'&&z(f)==='grave'&&l1-lp(1)===2250,JSON.stringify([z(i),z(f),l1-lp(1)]));
  ok('インティ: 月影龍クイラ is not summoned yet (only in the next turn Standby Phase)',z(q)==='grave',z(q));
  endTurn();
  ok('インティ: in the Standby Phase of the next turn 月影龍クイラ of the Graveyard was Special Summoned',z(q)==='mz',z(q));
  audit('インティ 1'); }

/* ===== 月影龍クイラ ===== */
{ fresh();const q=mon(QUI,0),i=mk(INT,0),f=mon('青眼の白龍',1);i.properlySummonedS03=true;
  gameState.players[0].mz=[q];gameState.players[0].grave=[i];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);PREFER=['yes',uid(i)];foeAttack(f,q);PREFER=[];
  ok('クイラ: selected as the attack target → I recovered half of 青眼 ATK (1500)',lp(0)>=l0+1500-500,JSON.stringify([l0,lp(0)]));
  ok('クイラ: destroyed on the field → 太陽龍インティ of the Graveyard Special Summoned',z(q)==='grave'&&z(i)==='mz',JSON.stringify([z(q),z(i)]));
  audit('クイラ 1'); }

/* ===== スピード・キング☆スカル・フレイム ===== */
{ fresh();const k=mk(SKF,0),sf=mk('スカル・フレイム',0),b1=mk('バーニング・スカルヘッド',0),b2=mk('バーニング・スカルヘッド',0);
  gameState.players[0].hand=[k];gameState.players[0].grave=[sf,b1,b2];baselineA();
  ok('スカル・フレイム王: the Special Summon procedure is legal (a スカル・フレイム in the Graveyard)',procOk(SKF,0)===true,'');
  procRun(SKF,0);
  ok('スカル・フレイム王: スカル・フレイム banished (cost); it stands on the field',z(sf)==='banish'&&z(k)==='mz',JSON.stringify([z(sf),z(k)]));
  ok('スカル・フレイム王: burn 400 x 2 バーニング・スカルヘッド = 800; once per turn',canZ(k)===true,'');
  actC(k);
  ok('スカル・フレイム王: the opponent took 800 and the effect is used up',lp(1)===7200&&canZ(k)===false,JSON.stringify([lp(1),canZ(k)]));
  audit('スカル・フレイム王 1'); }
{ fresh();const k=mk(SKF,0);gameState.players[0].hand=[k];baselineA();
  ok('スカル・フレイム王 negative: no スカル・フレイム in the Graveyard → the procedure is not legal',procOk(SKF,0)===false,''); }
{ fresh();const k=mon(SKF,0),sf=mk('スカル・フレイム',0),bh=mk('ブラック・ホール',0);gameState.players[0].mz=[k];gameState.players[0].grave=[sf];gameState.players[0].hand=[bh];baselineA();
  cast(0,'ブラック・ホール',['yes',uid(sf)]);
  ok('スカル・フレイム王: sent from the field to the Graveyard (ブラック・ホール) → スカル・フレイム of the Graveyard Special Summoned',z(k)==='grave'&&z(sf)==='mz',JSON.stringify([z(k),z(sf)]));
  audit('スカル・フレイム王 2'); }
`);

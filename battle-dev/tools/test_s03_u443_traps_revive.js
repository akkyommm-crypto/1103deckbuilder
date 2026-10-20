/* S03-U443: オーバーリミット, 儀水鏡の幻影術, ガスタへの祈り, スカーレッド・カーペット (stale ENGINE_GAP Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x42B0001;
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
const OVL='オーバーリミット',MIR='儀水鏡の幻影術',PRY='ガスタへの祈り',CAR='スカーレッド・カーペット';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}
function fell(c,by){c.graveInfo={turn:5,from:'mz',byDestroy:true,battle:by!==false,face:'up',pos:'atk',byPlayer:1};return c;}
let ALL=false;const __p=pick;pick=function(){const q=pc();if(ALL&&q&&q.title.indexOf('リゾネーター')>=0){answerChoiceV49(q.candidates.map(c=>c.key));return;}return __p();};

/* ===== オーバーリミット ===== */
{ fresh();const tr=setTrap(OVL,0),w=fell(mk('ワイト',0)),bd=fell(mk('青眼の白龍',0)),ow=fell(mk('ワイト',1));gameState.players[0].sz=[tr];gameState.players[0].grave=[w,bd];gameState.players[1].grave=[ow];baselineA();
  const l0=lp(0);duelActivateFromZone(0,'sz',0);drive();
  ok('オーバーリミット: 500 LP paid, both Normal Monsters (ATK 1000 or less) destroyed by battle this turn (mine and the opponent\'s) are on my field; the ATK 3000 one is not',lp(0)===l0-500&&z(w)==='mz'&&z(ow)==='mz'&&H(w).p===0&&H(ow).p===0&&z(bd)==='grave',JSON.stringify([l0,lp(0),z(w),z(ow),z(bd)]));
  audit('オーバーリミット 1'); }
{ fresh();const tr=setTrap(OVL,0),w=fell(mk('ワイト',0),false);gameState.players[0].sz=[tr];gameState.players[0].grave=[w];baselineA();
  ok('オーバーリミット negative: a monster destroyed by an effect (not battle) does not count',legalT(0)===false,''); }
{ fresh();const tr=setTrap(OVL,0),w=fell(mk('ワイト',0));w.graveInfo.turn=3;gameState.players[0].sz=[tr];gameState.players[0].grave=[w];baselineA();
  ok('オーバーリミット negative: destroyed in an earlier turn → not counted',legalT(0)===false,''); }

/* ===== 儀水鏡の幻影術 ===== */
{ fresh();const tr=setTrap(MIR,0),r=mk('イビリチュア・ガストクラーケ',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[r];baselineA();
  PREFER=[uid(r)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('儀水鏡の幻影術: the 「リチュア」 Ritual Monster of the hand was Special Summoned and cannot attack',z(r)==='mz'&&C(r).cannotAttack===true,JSON.stringify([z(r),C(r)&&C(r).cannotAttack]));
  phase('end');
  ok('儀水鏡の幻影術: it returned to the hand at the End Phase',z(r)==='hand',z(r));
  audit('儀水鏡 1'); }
{ fresh();const tr=setTrap(MIR,0),w=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[w];baselineA();
  ok('儀水鏡の幻影術 negative: no 「リチュア」 Ritual Monster in hand → not activatable',legalT(0)===false,''); }

/* ===== ガスタへの祈り ===== */
{ fresh();const tr=setTrap(PRY,0),g1=mk('ガスタの静寂 カーム',0),g2=mk('ガスタ・イグル',0),g3=mk('ガスタ・ガルド',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[g1,g2,g3];baselineA();
  PREFER=[uid(g1),uid(g2),uid(g3)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('ガスタへの祈り: two 「ガスタ」 of the Graveyard went back to the Deck and the third was Special Summoned',z(g1)==='deck'&&z(g2)==='deck'&&z(g3)==='mz',JSON.stringify([z(g1),z(g2),z(g3)]));
  audit('ガスタ 1'); }
{ fresh();const tr=setTrap(PRY,0),g1=mk('ガスタの静寂 カーム',0),g2=mk('ガスタ・イグル',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[g1,g2];baselineA();
  ok('ガスタへの祈り negative: only two 「ガスタ」 in the Graveyard → not activatable',legalT(0)===false,''); }

/* ===== スカーレッド・カーペット ===== */
{ fresh();const tr=setTrap(CAR,0),d=mon('C・ドラゴン',1),r1=mk('クロック・リゾネーター',0),r2=mk('フレア・リゾネーター',0),x=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[1].mz=[d];gameState.players[0].grave=[r1,r2,x];baselineA();
  ALL=true;duelActivateFromZone(0,'sz',0);drive();ALL=false;
  ok('スカーレッド・カーペット: a Dragon Synchro Monster is on the field → both 「リゾネーター」 of my Graveyard were Special Summoned (the non-Resonator stays)',z(r1)==='mz'&&z(r2)==='mz'&&z(x)==='grave',JSON.stringify([z(r1),z(r2),z(x)]));
  audit('カーペット 1'); }
{ fresh();const tr=setTrap(CAR,0),d=mon('ワイト',1),r1=mk('クロック・リゾネーター',0);gameState.players[0].sz=[tr];gameState.players[1].mz=[d];gameState.players[0].grave=[r1];baselineA();
  ok('スカーレッド・カーペット negative: no Dragon Synchro Monster on the field → not activatable',legalT(0)===false,''); }
`);

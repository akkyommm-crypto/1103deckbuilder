/* S03-U377: 我が身を盾に, デストラクション・ジャマー, ボム・ガード, ライフ・コーディネイター, 椿姫ティタニアル (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3770001;
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



const SHD='我が身を盾に',JAM='デストラクション・ジャマー',BMG='ボム・ガード',COO='ライフ・コーディネイター',TIT='椿姫ティタニアル';
function foeTurn(){gameState.activePlayer=1;}

/* ===== 我が身を盾に ===== */
{ fresh();foeTurn();const t=setCard(SHD,0),w=mon('青眼の白龍',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('盾に: ブラック・ホール (destroys monsters) -> offered',offeredTo(0,t),JSON.stringify({len:gameState.chain.length}));
  respond(0,t);drive();
  ok('盾に: 1500 LP paid; the activation negated and ブラック・ホール destroyed; my monster survives',lp(0)===6500&&z(bh)==='grave'&&z(w)==='mz',JSON.stringify([lp(0),z(bh),z(w)]));
  audit('盾に 1'); }
{ fresh();foeTurn();const t=setCard(SHD,0),w=mon('青眼の白龍',0),t2=setCard('強制脱出装置',0),cy=mk('サイクロン',1);
  gameState.players[0].sz=[t,t2];gameState.players[0].mz=[w];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[uid(t2)]);
  ok('盾に negative: サイクロン (destroys Spells / Traps only) -> not offered',offeredTo(0,t)===false,'');drive(); }
{ fresh();foeTurn();const t=setCard(SHD,0),w=mon('青眼の白龍',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[0].lp=1000;gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('盾に negative: LP under 1500 -> not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== デストラクション・ジャマー ===== */
{ fresh();foeTurn();const t=setCard(JAM,0),w=mon('青眼の白龍',0),hc=mk('ワイト',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[0].hand=[hc];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('ジャマー: ブラック・ホール -> offered',offeredTo(0,t),'');
  respond(0,t,[uid(hc)]);drive();
  ok('ジャマー: the hand card discarded; the activation negated and ブラック・ホール destroyed; my monster survives',z(hc)==='grave'&&z(bh)==='grave'&&z(w)==='mz',JSON.stringify([z(hc),z(bh),z(w)]));
  audit('ジャマー 1'); }
{ fresh();foeTurn();const t=setCard(JAM,0),w=mon('青眼の白龍',0),hc=mk('ワイト',0),fb=mk('ファイヤー・ボール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[0].hand=[hc];gameState.players[1].hand=[fb];baselineA();
  foeCast('ファイヤー・ボール');
  ok('ジャマー negative: a burn Spell is not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== ボム・ガード ===== */
{ fresh();foeTurn();const t=setCard(BMG,0),w=mon('青眼の白龍',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].hand=[bh];baselineA();
  const l1=lp(1);
  foeCast('ブラック・ホール');
  ok('ボム・ガード: offered when a card destroying my monster is activated',offeredTo(0,t),'');
  respond(0,t);drive();
  ok('ボム・ガード: negated and destroyed; 500 damage to the opponent; my monster survives',z(bh)==='grave'&&lp(1)===l1-500&&z(w)==='mz',JSON.stringify([z(bh),l1,lp(1),z(w)]));
  audit('ボム・ガード 1'); }
{ fresh();foeTurn();const t=setCard(BMG,0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('ボム・ガード negative: I control no monster -> not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== ライフ・コーディネイター ===== */
{ fresh();foeTurn();const c=mk(COO,0),fb=mk('ファイヤー・ボール',1);
  gameState.players[0].hand=[c];gameState.players[1].hand=[fb];baselineA();
  foeCast('ファイヤー・ボール');
  ok('コーディネイター: a burn Spell activated -> offered from the hand',offeredTo(0,c),'');
  respond(0,c);drive();
  ok('コーディネイター: discarded as cost; the burn Spell negated and destroyed; no damage',z(c)==='grave'&&z(fb)==='grave'&&lp(0)===8000,JSON.stringify([z(c),z(fb),lp(0)]));
  audit('コーディネイター 1'); }
{ fresh();foeTurn();const c=mk(COO,0),bh=mk('ブラック・ホール',1);
  gameState.players[0].hand=[c];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('コーディネイター negative: a non-burn Spell is not offered',offeredTo(0,c)===false,'');drive(); }

/* ===== 椿姫ティタニアル ===== */
{ fresh();foeTurn();const t=mon(TIT,0),pl=mon('アルラウネ',0),t2=setCard('強制脱出装置',0),cy=mk('サイクロン',1);
  gameState.players[0].mz=[t,pl];gameState.players[0].sz=[t2];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[uid(t2)]);
  ok('ティタニアル: サイクロン targets a card on the field -> offered',offeredTo(0,t),'');
  respond(0,t,[uid(pl)]);drive();
  ok('ティタニアル: the Plant was released; the activation negated and サイクロン destroyed; my set card survives',z(pl)==='grave'&&z(cy)==='grave'&&z(t2)==='sz',JSON.stringify([z(pl),z(cy),z(t2)]));
  audit('ティタニアル 1'); }
{ fresh();foeTurn();const t=mon(TIT,0),t2=setCard('強制脱出装置',0),cy=mk('サイクロン',1);
  gameState.players[0].mz=[t];gameState.players[0].sz=[t2];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[uid(t2)]);
  ok('ティタニアル negative: no other face-up Plant -> not offered',offeredTo(0,t)===false,'');drive(); }
{ fresh();foeTurn();const t=mon(TIT,0),pl=mon('アルラウネ',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].mz=[t,pl];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('ティタニアル negative: a Spell that targets nothing is not offered',offeredTo(0,t)===false,'');drive(); }
`);

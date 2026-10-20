/* S03-U386: ブレイズ・キャノン, クレイジー・ファイヤー, ヴォルカニック・バックショット (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3860001;
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












const CAN='ブレイズ・キャノン',CRZ='クレイジー・ファイヤー',BCK='ヴォルカニック・バックショット';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function canSz(c){return getLegalZoneActions(0,'sz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function flagOf(c){const x=C(c);return x?x.u386Cannon:undefined;}

/* ===== ブレイズ・キャノン ===== */
{ fresh();const t=faceSet(CAN,0),py=mk('きつね火',0),big=mk('ブラック・マジシャン',0),m0=mon('ワイト',0),f=mon('ライオウ',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[m0];gameState.players[0].hand=[py,big];gameState.players[1].mz=[f];baselineA();
  actSzC(t);
  ok('キャノン: the card activation only places it (face-up, nothing destroyed)',C(t).face==='up'&&z(f)==='mz',JSON.stringify([C(t).face,z(f)]));
  ok('キャノン: the effect is activatable (Pyro ATK<=500 in the hand, an opposing monster)',canSz(t)===true,'');
  actSzC(t,[uid(f),uid(py)]);
  ok('キャノン: the Pyro monster (きつね火) sent from the hand to the Graveyard; the chosen opposing monster destroyed',z(py)==='grave'&&z(f)==='grave'&&z(big)==='hand',JSON.stringify([z(py),z(f),z(big)]));
  ok('キャノン: my monsters cannot attack this turn',cannotAttackNow(C(m0))===true,String(cannotAttackNow(C(m0))));
  audit('キャノン 1'); }
{ fresh();const t=faceSet(CAN,0),big=mk('ブラック・マジシャン',0),f=mon('ライオウ',1);gameState.players[0].sz=[t];gameState.players[0].hand=[big];gameState.players[1].mz=[f];baselineA();
  actSzC(t);
  ok('キャノン negative: no Pyro monster with ATK 500 or less in the hand -> the effect is not activatable',canSz(t)===false,''); }

/* ===== ヴォルカニック・バックショット ===== */
{ fresh();const t=faceSet(CAN,0),b1=mk(BCK,0),b2=mk(BCK,0),b3=mk(BCK,0),f1=mon('ライオウ',1),f2=mon('ワイト',1);
  gameState.players[0].sz=[t];gameState.players[0].hand=[b1,b2];gameState.players[0].deck=[b3].concat(gameState.players[0].deck);gameState.players[1].mz=[f1,f2];baselineA();
  actSzC(t);
  const l1=lp(1);
  actSzC(t,[uid(f1),uid(b1),'yes']);
  ok('バックショット: sent by ブレイズ・キャノン -> 500 damage, and the two others (hand + Deck) sent to the Graveyard',z(b1)==='grave'&&z(b2)==='grave'&&z(b3)==='grave',JSON.stringify([z(b1),z(b2),z(b3)]));
  ok('バックショット: the opponent\'s monsters are all destroyed; 3 x 500 damage in total',z(f1)==='grave'&&z(f2)==='grave'&&lp(1)===l1-1500,JSON.stringify([z(f1),z(f2),l1,lp(1)]));
  audit('バックショット 1'); }
{ fresh();const t=faceSet(CAN,0),b1=mk(BCK,0),b2=mk(BCK,0),b3=mk(BCK,0),f1=mon('ライオウ',1),f2=mon('ワイト',1);
  gameState.players[0].sz=[t];gameState.players[0].hand=[b1,b2];gameState.players[0].deck=[b3].concat(gameState.players[0].deck);gameState.players[1].mz=[f1,f2];baselineA();
  actSzC(t);
  const l1=lp(1);
  actSzC(t,[uid(f1),uid(b1),'no']);
  ok('バックショット: answering no -> only its own 500 damage, the others stay and the second opposing monster survives',z(b1)==='grave'&&z(b2)==='hand'&&z(f2)==='mz'&&lp(1)===l1-500,JSON.stringify([z(b1),z(b2),z(f2),l1,lp(1)])); }
{ fresh();const b1=mk(BCK,0),dc=mk('ワイト',0),dis=mk('手札抹殺',0,'up');
  gameState.players[0].hand=[b1,dc,dis];baselineA();
  const l1=lp(1);
  cast(0,'手札抹殺');
  ok('バックショット: sent to the Graveyard by another card (手札抹殺): 500 damage only, no rescue prompt',z(b1)==='grave'&&lp(1)===l1-500&&!pc(),JSON.stringify([z(b1),l1,lp(1),!!pc()])); }

/* ===== クレイジー・ファイヤー ===== */
{ fresh();const t=mk(CAN,0,'up'),cf=mk(CRZ,0,'up'),m0=mon('ワイト',0),f=mon('ライオウ',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[m0];gameState.players[0].hand=[cf];gameState.players[1].mz=[f];baselineA();
  cast(0,CRZ);
  ok('クレイジー・ファイヤー: 500 LP paid; the ブレイズ・キャノン destroyed',lp(0)===7500&&z(t)==='grave',JSON.stringify([lp(0),z(t)]));
  ok('クレイジー・ファイヤー: every monster on the field destroyed',z(m0)==='grave'&&z(f)==='grave',JSON.stringify([z(m0),z(f)]));
  const tk=gameState.players[0].mz.filter(c=>cardName(c)==='クレイジー・ファイヤー・トークン');
  ok('クレイジー・ファイヤー: one クレイジー・ファイヤー・トークン (炎, Lv3, 1000/1000) in Attack Position',tk.length===1&&tk[0].pos==='atk'&&curATK(tk[0])===1000&&curDEF(tk[0])===1000,JSON.stringify(tk.map(c=>[c.pos,curATK(c)])));
  ok('クレイジー・ファイヤー: my monsters (the token) cannot attack this turn',tk.length===1&&cannotAttackNow(tk[0])===true,'');
  audit('クレイジー 1'); }
{ fresh();const cf=mk(CRZ,0,'up');gameState.players[0].hand=[cf];gameState.players[0].mz=[mon('ワイト',0)];baselineA();
  ok('クレイジー・ファイヤー negative: no ブレイズ・キャノン on my field -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }
`);

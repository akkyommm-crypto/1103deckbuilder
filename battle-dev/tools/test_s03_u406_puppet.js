/* S03-U406: 地獄の傀儡魔人, 魔人 ダーク・バルター, 不退の荒武者 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4060001;
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


































const PUP='地獄の傀儡魔人',BAL='魔人 ダーク・バルター',RET='不退の荒武者';
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== 地獄の傀儡魔人 ===== */
{ fresh();const p=mon(PUP,0),dc=mk('ブラック・ホール',0),w1=mon('ワイト',1),w2=mon('ワイト',1),l4=mon('ライオウ',1);
  gameState.players[0].mz=[p];gameState.players[0].hand=[dc];gameState.players[1].mz=[w1,w2,l4];baselineA();
  ok('傀儡魔人: the effect is available (hand card, Level 3 or lower monsters on the opponent field)',canZ(p)===true,'');
  actC(p,[uid(dc)]);
  ok('傀儡魔人: the hand card was discarded (cost); both Level 1 ワイト came under my control; the Level 4 ライオウ did not',z(dc)==='grave'&&pl(w1)===0&&pl(w2)===0&&pl(l4)===1,JSON.stringify([z(dc),pl(w1),pl(w2),pl(l4)]));
  ok('傀儡魔人: they cannot activate effects (negated), cannot be Tributed, cannot be Synchro material',effectNegated(C(w1))===true&&C(w1).cannotTribute===true&&C(w1).noSynchroMaterialTurnS03===gameState.turn,JSON.stringify([effectNegated(C(w1)),C(w1).cannotTribute,C(w1).noSynchroMaterialTurnS03]));
  ok('傀儡魔人: once per turn',canZ(p)===false,'');
  phase('end');
  ok('傀儡魔人: at the End Phase the monsters return to the opponent',pl(w1)===1&&pl(w2)===1,JSON.stringify([pl(w1),pl(w2)]));
  audit('傀儡魔人 1'); }
{ fresh();const p=mon(PUP,0),dc=mk('ブラック・ホール',0),l4=mon('ライオウ',1);gameState.players[0].mz=[p];gameState.players[0].hand=[dc];gameState.players[1].mz=[l4];baselineA();
  ok('傀儡魔人 negative: only a Level 4 monster on the opponent field → not offered',canZ(p)===false,''); }

/* ===== 魔人 ダーク・バルター ===== */
function balterField(){fresh();const b=mon(BAL,1),bh=mk('ブラック・ホール',0),w=mon('ワイト',0),f=mon('ライオウ',1);
  gameState.players[0].hand=[bh];gameState.players[0].mz=[w];gameState.players[1].mz=[b,f];baselineA();return {b,bh,w,f};}
function offerBalter(x){PREFER=[];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];return resp.some(r=>r.card===x.b);}
{ const x=balterField();
  const offered=offerBalter(x);
  ok('バルター: offered against the Normal Spell activation of the opponent',offered===true,'');
  if(offered){duelActivateResponseV2(1,'mz',idx(x.b));drive();}
  ok('バルター: 1000 LP paid and the effect of ブラック・ホール negated: no monster destroyed',lp(1)===7000&&z(x.b)==='mz'&&z(x.f)==='mz'&&z(x.w)==='mz',JSON.stringify([lp(1),z(x.b),z(x.f),z(x.w)]));
  audit('バルター 1'); }
{ const x=balterField();
  offerBalter(x);drive();
  ok('バルター control: without the response ブラック・ホール destroys everything',z(x.b)==='grave'&&z(x.f)==='grave'&&z(x.w)==='grave'&&lp(1)===8000,JSON.stringify([z(x.b),z(x.f),z(x.w),lp(1)])); }
{ fresh();const b=mon(BAL,1),cy=mk('サイクロン',0),st=mk('スクリーン・オブ・レッド',1,'up');gameState.players[0].hand=[cy];gameState.players[1].mz=[b];gameState.players[1].sz=[st];baselineA();
  PREFER=[uid(st)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
  ok('バルター negative: a Quick-Play Spell (サイクロン) is not a Normal Spell → not offered',!resp.some(r=>r.card===b),JSON.stringify(resp.map(r=>r.db.n))); drive(); }

/* ===== 不退の荒武者 ===== */
{ fresh();const r=mon(RET,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,r);
  ok('荒武者: attacked by 青眼 (ATK 3000 > 2400) it is not destroyed and the attacker is destroyed after the damage calculation',z(r)==='mz'&&z(f)==='grave',JSON.stringify([z(r),z(f)]));
  audit('荒武者 1'); }
{ fresh();const r=mon(RET,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,r,f);
  ok('荒武者 negative: when it attacks the stronger monster itself it is destroyed (the protection is for being attacked)',z(r)==='grave'&&z(f)==='mz',JSON.stringify([z(r),z(f)])); }
`);

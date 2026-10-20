/* S03-U432: エレメント・ザウルス, エレメント・ドラゴン, ゴーレム, マンモス・ゾンビ, ブレイドナイト (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4200001;
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
const SAU='エレメント・ザウルス',DRG='エレメント・ドラゴン',GOL='ゴーレム',MAM='マンモス・ゾンビ',BLA='ブレイドナイト';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function H(c){return findCardByUid(c.uid);}
function tk(name){return (API.tokensOf(name)||[]).length;}

/* ===== エレメント・ザウルス ===== */
{ fresh();const s=mon(SAU,0),fi=mon('E・HERO ザ・ヒート',0);gameState.players[0].mz=[s,fi];baselineA();
  ok('ザウルス: a FIRE monster on the field → ATK +500 (1500 → 2000)',curATK(C(s))===2000,String(curATK(C(s)))); }
{ fresh();const s=mon(SAU,0);gameState.players[0].mz=[s];baselineA();
  ok('ザウルス control: no FIRE monster → ATK stays 1500',curATK(C(s))===1500,String(curATK(C(s)))); }
{ fresh();const s=mon(SAU,0),ea=mon('7つの武器を持つハンター',0),kt=mon('キラー・トマト',1);gameState.players[0].mz=[s,ea];gameState.players[1].mz=[kt];baselineA();
  phase('battle');myAttack(s,kt);
  ok('ザウルス: an EARTH monster is on the field → the destroyed キラー・トマト is negated (summons nothing)',z(kt)==='grave'&&gameState.players[1].mz.length===0,JSON.stringify([z(kt),gameState.players[1].mz.map(cardName)]));
  audit('ザウルス 1'); }
{ fresh();const s=mon(SAU,0),kt=mon('キラー・トマト',1);gameState.players[0].mz=[s];gameState.players[1].mz=[kt];baselineA();
  phase('battle');myAttack(s,kt);
  ok('ザウルス control: no EARTH monster → キラー・トマト summons ワイト',z(kt)==='grave'&&gameState.players[1].mz.some(c=>cardName(c)==='ワイト'),JSON.stringify(gameState.players[1].mz.map(cardName))); }

/* ===== エレメント・ドラゴン ===== */
{ fresh();const d=mon(DRG,0),fi=mon('E・HERO ザ・ヒート',0);gameState.players[0].mz=[d,fi];baselineA();
  ok('ドラゴン: a FIRE monster on the field → ATK +500',curATK(C(d))===2000,String(curATK(C(d)))); }
{ fresh();const d=mon(DRG,0),wi=mon('ワイバーン',0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[d,wi];gameState.players[1].mz=[f1,f2];baselineA();
  phase('battle');myAttack(d,f1);myAttack(d,f2);
  ok('ドラゴン: a WIND monster is on the field → after destroying a monster it attacked once more (both ワイト destroyed)',z(f1)==='grave'&&z(f2)==='grave',JSON.stringify([z(f1),z(f2)]));
  audit('ドラゴン 1'); }
{ fresh();const d=mon(DRG,0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[d];gameState.players[1].mz=[f1,f2];baselineA();
  phase('battle');myAttack(d,f1);myAttack(d,f2);
  ok('ドラゴン control: no WIND monster → no second attack (the second ワイト survives)',z(f1)==='grave'&&z(f2)==='mz',JSON.stringify([z(f1),z(f2)])); }

/* ===== ゴーレム ===== */
{ fresh();const g=mon(GOL,0),li=mon('ライオウ',1),dk=mon('ブラック・マジシャン',1);gameState.players[0].mz=[g];gameState.players[1].mz=[li,dk];baselineA();
  ok('ゴーレム: the effect of a face-up LIGHT monster (ライオウ) is negated, a DARK one is not',API.isEffectNegated(H(li))===true&&API.isEffectNegated(H(dk))===false,JSON.stringify([API.isEffectNegated(H(li)),API.isEffectNegated(H(dk))]));
  phase('battle');myAttack(g,dk);
  audit('ゴーレム 1'); }
{ fresh();const li=mon('ライオウ',1);gameState.players[1].mz=[li];baselineA();
  ok('ゴーレム control: without it the LIGHT monster is not negated',API.isEffectNegated(H(li))===false,''); }
{ fresh();const g=mon(GOL,0),li=mon('ライオウ',1),w=mon('ワイト',1);gameState.players[0].mz=[g];gameState.players[1].mz=[li,w];baselineA();
  phase('battle');myAttack(g,li);myAttack(g,w);
  ok('ゴーレム: it destroyed a LIGHT monster in battle → it attacked once more (ワイト destroyed too)',z(li)==='grave'&&z(w)==='grave',JSON.stringify([z(li),z(w)])); }
{ fresh();const g=mon(GOL,0),dk=mon('ブラック・マジシャン',1),w=mon('ワイト',1);boost(g,0);gameState.players[0].mz=[g];gameState.players[1].mz=[dk,w];baselineA();
  phase('battle');myAttack(g,w);myAttack(g,dk);
  ok('ゴーレム negative: it destroyed a non-LIGHT monster → no second attack (ブラック・マジシャン survives)',z(w)==='grave'&&z(dk)==='mz',JSON.stringify([z(w),z(dk)])); }

/* ===== マンモス・ゾンビ ===== */
{ fresh();const m=mon(MAM,0),u=mk('ワイト',0);gameState.players[0].mz=[m];gameState.players[0].grave=[u];baselineA();
  ok('マンモス・ゾンビ: an Undead in my Graveyard → it stays',z(m)==='mz',z(m));
  const l0=lp(0);API.banish(H(u),'test');flushDeferredEventsV2();drive();
  ok('マンモス・ゾンビ: no Undead in my Graveyard → destroyed, and its original ATK (1900) is dealt to its controller',z(m)==='grave'&&l0-lp(0)===1900,JSON.stringify([z(m),l0,lp(0)]));
  audit('マンモス 1'); }

/* ===== ブレイドナイト ===== */
function boost(c,n){c.mods=[{atk:n,def:0,until:'permanent',label:'fixture',turn:5}];}
{ fresh();const b=mon(BLA,0);gameState.players[0].mz=[b];gameState.players[0].hand=[];baselineA();
  ok('ブレイドナイト: my hand is 1 card or fewer → ATK +400 (2000)',curATK(C(b))===2000,String(curATK(C(b)))); }
{ fresh();const b=mon(BLA,0);gameState.players[0].mz=[b];gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0)];baselineA();
  ok('ブレイドナイト control: two cards in the hand → ATK 1600',curATK(C(b))===1600,String(curATK(C(b)))); }
{ fresh();const b=mon(BLA,0),iv=mk('アイヴィ・ウォール',1,'down','def');iv.setTurn=3;gameState.players[0].mz=[b];gameState.players[1].mz=[iv];baselineA();
  phase('battle');myAttack(b,iv);
  ok('ブレイドナイト: alone on my field it destroyed the Flip monster (アイヴィ・ウォール) → its Flip effect was negated (no トークン)',z(iv)==='grave'&&tk('アイヴィトークン')===0,JSON.stringify([z(iv),tk('アイヴィトークン')]));
  audit('ブレイドナイト 1'); }
{ fresh();const b=mon(BLA,0),o=mon('ワイト',0),iv=mk('アイヴィ・ウォール',1,'down','def');iv.setTurn=3;gameState.players[0].mz=[b,o];gameState.players[1].mz=[iv];baselineA();
  phase('battle');myAttack(b,iv);
  ok('ブレイドナイト control: another monster on my field → the Flip effect is not negated (トークン appear)',z(iv)==='grave'&&tk('アイヴィトークン')>0,JSON.stringify([z(iv),tk('アイヴィトークン')])); }
`);

/* S03-U438: アームズ・シーハンター, バブル・ショット (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4260001;
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
const ARM='アームズ・シーハンター',BUB='E・HERO バブルマン',BSH='バブル・ショット';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function H(c){return findCardByUid(c.uid);}
function tk(name){return (API.tokensOf(name)||[]).length;}

/* ===== アームズ・シーハンター ===== */
{ fresh();const a=mon(ARM,0),w=mon('アクア・ドラゴン',0),iv=mk('アイヴィ・ウォール',1,'down','def');iv.setTurn=3;gameState.players[0].mz=[a,w];gameState.players[1].mz=[iv];baselineA();
  phase('battle');myAttack(a,iv);
  ok('シーハンター: with another WATER monster of mine, the Flip effect of the effect monster it fought was negated (no トークン)',z(iv)==='grave'&&tk('アイヴィトークン')===0,JSON.stringify([z(iv),tk('アイヴィトークン')]));
  audit('シーハンター 1'); }
{ fresh();const a=mon(ARM,0),iv=mk('アイヴィ・ウォール',1,'down','def');iv.setTurn=3;gameState.players[0].mz=[a];gameState.players[1].mz=[iv];baselineA();
  phase('battle');myAttack(a,iv);
  ok('シーハンター control: no other WATER monster → the Flip effect is not negated (トークン appear)',z(iv)==='grave'&&tk('アイヴィトークン')>0,JSON.stringify([z(iv),tk('アイヴィトークン')])); }
{ fresh();const a=mon(ARM,0),w=mon('アクア・ドラゴン',0),f=mon('ライオウ',1);gameState.players[0].mz=[a,w];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(a,f);
  ok('シーハンター: the surviving effect monster it fought is negated until the end of the turn',API.isEffectNegated(H(f))===true,String(API.isEffectNegated(H(f)))); }
{ fresh();const a=mon(ARM,0),w=mon('アクア・ドラゴン',0),f=mon('ライオウ',1);gameState.players[0].mz=[a,w];gameState.players[1].mz=[f];baselineA();
  ok('シーハンター: no battle yet → the opponent monster is not negated',API.isEffectNegated(H(f))===false,''); }

/* ===== バブル・ショット ===== */
{ fresh();const b=mon(BUB,0),sh=mk(BSH,0,'up');gameState.players[0].mz=[b];gameState.players[0].sz=[sh];baselineA();
  API.equipSpell(H(sh),H(b),'test');
  ok('バブル・ショット: equipped Bubbleman +800 ATK (800 → 1600)',curATK(C(b))===1600,String(curATK(C(b)))); }
{ fresh();const b=mon(BUB,0),sh=mk(BSH,0,'up'),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[0].sz=[sh];gameState.players[1].mz=[f];baselineA();
  API.equipSpell(H(sh),H(b),'test');const l0=lp(0);
  toOppBattle();foeAttack(f,b);
  ok('バブル・ショット: Bubbleman would be destroyed in battle → the Equip Spell was destroyed instead and I took no battle damage',z(b)==='mz'&&z(sh)==='grave'&&lp(0)===l0,JSON.stringify([z(b),z(sh),l0,lp(0)]));
  audit('バブル・ショット 1'); }
{ fresh();const b=mon(BUB,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  const l0=lp(0);toOppBattle();foeAttack(f,b);
  ok('バブル・ショット control: unequipped Bubbleman is destroyed and the damage is taken',z(b)==='grave'&&lp(0)<l0,JSON.stringify([z(b),l0,lp(0)])); }
{ fresh();const w=mon('ワイト',0),sh=mk(BSH,0);gameState.players[0].mz=[w];gameState.players[0].hand=[sh];baselineA();
  ok('バブル・ショット negative: no Bubbleman on the field → cannot be activated',legalH(0).ok===false,JSON.stringify(legalH(0))); }

{ fresh();const a=mon(ARM,0),sn=mon('アクア・スネーク',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[a,sn];gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[uid(sn)];foeAttack(f,a);PREFER=[];
  ok('シーハンター: it would be destroyed in battle → the controller used the substitute: the Level 3 WATER monster was destroyed instead',z(a)==='mz'&&z(sn)==='grave',JSON.stringify([z(a),z(sn)]));
  audit('シーハンター substitute'); }
`);

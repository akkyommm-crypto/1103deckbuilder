/* S03-U440: モンスターレリーフ, 六武派二刀流, 生命力吸収魔術, A・O・J リサーチャー (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4280001;
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
const REL='モンスターレリーフ',RKB='六武派二刀流',VIT='生命力吸収魔術',AOJ='A・O・J リサーチャー';
function H(c){return findCardByUid(c.uid);}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':target});}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function legalZ(p,zn,i){return {ok:strictScriptLegalityV2(cardName(gameState.players[p][zn][i]),p,zn,i).ok};}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function offered(c){return (getChainResponsesV2(0)||[]).some(r=>r.card===c);}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function atkDecl(tr,prefer){gameState.activePlayer=1;gameState.phase='battle';baselineA();foeAttack(gameState.players[1].mz[0],0);const ok1=toPoint('attackDeclare');const off=ok1&&offered(tr);if(off){PREFER=(prefer||[]).slice();pointActivateV27(0,'sz',0);}drive();PREFER=[];return off;}

/* ===== モンスターレリーフ ===== */
{ fresh();const tr=setTrap(REL,0),a=mk('ワイト',0,'up'),h4=mk('キラー・トマト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[a];gameState.players[0].hand=[h4];gameState.players[1].mz=[f];
  const off=atkDecl(tr,[a.uid,h4.uid]);
  ok('モンスターレリーフ: at the opponent attack declaration — the monster returned to the hand and a Level 4 monster of the hand was Special Summoned',off&&z(a)!=='mz'&&z(h4)==='mz',JSON.stringify([off,z(a),z(h4)]));
  audit('レリーフ 1'); }
{ fresh();const tr=setTrap(REL,0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[f];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();foeAttack(f,'direct');const ok1=toPoint('attackDeclare');
  ok('モンスターレリーフ negative: no monster of mine → not offered',!(ok1&&offered(tr)),String(ok1&&offered(tr))); }

/* ===== 六武派二刀流 ===== */
function rokubuField(extraMine){fresh();const tr=setTrap(RKB,0),r=mon('六武衆－イロウ',0),f1=mon('ワイト',1),f2=mk('ブラック・ホール',1,'down'),f3=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=extraMine?[r,mon('ワイト',0)]:[r];gameState.players[1].mz=[f1,f3];gameState.players[1].sz=[f2];baselineA();return {tr,r,f1,f2,f3};}
{ const x=rokubuField(false);
  ok('六武派二刀流: only one face-up Attack Position 六武衆 on my field → activatable',legalZ(0,'sz',0).ok===true,JSON.stringify(legalZ(0,'sz',0)));
  PREFER=[uid(x.f3),uid(x.f2)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('六武派二刀流: two opponent cards (the chosen monster and the Set card) were returned to the hand',z(x.f3)==='hand'&&z(x.f2)==='hand'&&z(x.f1)==='mz',JSON.stringify([z(x.f3),z(x.f2),z(x.f1)]));
  audit('六武派 1'); }
{ const x=rokubuField(true);
  ok('六武派二刀流 negative: another monster on my field → not activatable',legalZ(0,'sz',0).ok===false,JSON.stringify(legalZ(0,'sz',0))); }

/* ===== 生命力吸収魔術 ===== */
{ fresh();const tr=setTrap(VIT,0),d1=mk('キラー・トマト',0,'down','def'),d2=mk('ワイト',1,'down','def'),u=mon('ライオウ',1);d1.setTurn=3;d2.setTurn=3;gameState.players[0].sz=[tr];gameState.players[0].mz=[d1];gameState.players[1].mz=[d2,u];baselineA();
  const l0=lp(0);PREFER=[];duelActivateFromZone(0,'sz',0);drive();
  ok('生命力吸収魔術: every face-down Defense monster of both fields was turned face-up (Defense Position kept)',C(d1).face==='up'&&C(d1).pos==='def'&&C(d2).face==='up'&&C(d2).pos==='def',JSON.stringify([C(d1).face,C(d1).pos,C(d2).face,C(d2).pos]));
  ok('生命力吸収魔術: I recovered 400 for each Effect Monster on the field (キラー・トマト and ライオウ = 2 → 800; the Normal Monster ワイト does not count)',lp(0)-l0===400*2,JSON.stringify([l0,lp(0)]));
  audit('生命力 1'); }
{ fresh();const tr=setTrap(VIT,0),d=mk('アイヴィ・ウォール',1,'down','def');d.setTurn=3;gameState.players[0].sz=[tr];gameState.players[1].mz=[d];baselineA();
  duelActivateFromZone(0,'sz',0);drive();
  ok('生命力吸収魔術: the Flip effect (アイヴィ・ウォール token) did not activate',C(d).face==='up'&&(API.tokensOf('アイヴィトークン')||[]).length===0,JSON.stringify([C(d).face,(API.tokensOf('アイヴィトークン')||[]).length])); }
{ fresh();const tr=setTrap(VIT,0),u=mon('ライオウ',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[u];baselineA();
  ok('生命力吸収魔術 negative: no face-down Defense monster → not activatable',legalZ(0,'sz',0).ok===false,JSON.stringify(legalZ(0,'sz',0))); }

/* ===== A・O・J リサーチャー ===== */
{ fresh();const a=mon(AOJ,0),h=mk('ワイト',0),d=mk('アイヴィ・ウォール',1,'down','def');d.setTurn=3;gameState.players[0].mz=[a];gameState.players[0].hand=[h];gameState.players[1].mz=[d];baselineA();
  ok('リサーチャー: available (a hand card and a face-down Defense monster of the opponent)',canZ(a)===true,'');
  actC(a,[h.uid,d.uid]);
  ok('リサーチャー: the hand card was discarded and the monster turned face-up Attack Position without its Flip effect (no トークン)',z(h)==='grave'&&C(d).face==='up'&&C(d).pos==='atk'&&(API.tokensOf('アイヴィトークン')||[]).length===0,JSON.stringify([z(h),C(d).face,C(d).pos,(API.tokensOf('アイヴィトークン')||[]).length]));
  ok('リサーチャー: once per turn',canZ(a)===false,'');
  audit('リサーチャー 1'); }
{ fresh();const a=mon(AOJ,0),h=mk('ワイト',0),d=mon('ワイト',1);gameState.players[0].mz=[a];gameState.players[0].hand=[h];gameState.players[1].mz=[d];baselineA();
  ok('リサーチャー negative: no face-down Defense monster → not available',canZ(a)===false,''); }
`);

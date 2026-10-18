/* S03-U441: 手札断殺, リグラス・リーパー, 悪魔への貢物, フェイク・ヒーロー (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4290001;
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
const DAN='手札断殺',REA='リグラス・リーパー',TRI='悪魔への貢物',FAK='フェイク・ヒーロー';
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':target});drive();}
function toOppBattle(){endTurn();phase('battle');}
function H(c){return findCardByUid(c.uid);}

/* ===== 手札断殺 ===== */
{ fresh();const dk=mk(DAN,0),a1=mk('ワイト',0),a2=mk('ブラック・マジシャン',0),a3=mk('青眼の白龍',0),b1=mk('ワイト',1),b2=mk('ブラック・マジシャン',1),b3=mk('青眼の白龍',1);
  gameState.players[0].hand=[dk,a1,a2,a3];gameState.players[1].hand=[b1,b2,b3];baselineA();
  cast(0,DAN,[uid(a1),uid(a2),uid(b1),uid(b2)]);
  ok('手札断殺: each player sent the 2 chosen hand cards to the Graveyard (mine first, then the opponent\'s own choice)',z(a1)==='grave'&&z(a2)==='grave'&&z(b1)==='grave'&&z(b2)==='grave'&&z(a3)==='hand'&&z(b3)==='hand',JSON.stringify([z(a1),z(a2),z(b1),z(b2),z(a3),z(b3)]));
  ok('手札断殺: then both drew 2 (1 + 2 = 3 cards each)',gameState.players[0].hand.length===3&&gameState.players[1].hand.length===3,JSON.stringify([gameState.players[0].hand.length,gameState.players[1].hand.length]));
  audit('手札断殺 1'); }
{ fresh();const dk=mk(DAN,0),a1=mk('ワイト',0),a2=mk('ブラック・マジシャン',0),b1=mk('ワイト',1);
  gameState.players[0].hand=[dk,a1,a2];gameState.players[1].hand=[b1];baselineA();
  ok('手札断殺 negative: the opponent has fewer than 2 hand cards → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
{ fresh();const dk=mk(DAN,0),a1=mk('ワイト',0),b1=mk('ワイト',1),b2=mk('ブラック・マジシャン',1);
  gameState.players[0].hand=[dk,a1];gameState.players[1].hand=[b1,b2];baselineA();
  ok('手札断殺 negative: I have fewer than 2 other hand cards → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== リグラス・リーパー ===== */
{ fresh();const r=mk(REA,0,'down','def');r.setTurn=3;const m1=mk('ワイト',0),m2=mk('ブラック・マジシャン',0),o1=mk('ワイト',1),o2=mk('青眼の白龍',1),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[r];gameState.players[0].hand=[m1,m2];gameState.players[1].mz=[f];gameState.players[1].hand=[o1,o2];baselineA();
  toOppBattle();PREFER=[uid(m1),uid(o1)];foeAttack(f,0);PREFER=[];
  ok('リーパー: flipped by the attack → each player discarded the hand card of their own choice',z(m1)==='grave'&&z(o1)==='grave'&&z(m2)==='hand'&&z(o2)==='hand',JSON.stringify([z(m1),z(o1),z(m2),z(o2)]));
  ok('リーパー: destroyed in battle by a monster → that monster lost 500 ATK / DEF (3000 / 2500 → 2500 / 2000)',z(r)==='grave'&&curATK(C(f))===2500&&curDEF(C(f))===2000,JSON.stringify([z(r),curATK(C(f)),curDEF(C(f))]));
  audit('リーパー 1'); }
{ fresh();const r=mk(REA,0,'down','def');r.setTurn=3;const f=mon('ワイト',1);
  gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,0);
  ok('リーパー: both hands empty → nothing to discard, no stall (it flipped)',pc()===null||pc()===undefined||!pc(),''); }

/* ===== 悪魔への貢物 ===== */
{ fresh();const sp=mon('青眼の白龍',1);sp.specialSummoned=true;const nm=mon('ブラック・マジシャン',1),w=mk('ワイト',0),tr=mk(TRI,0);gameState.players[1].mz=[nm,sp];gameState.players[0].hand=[tr,w];baselineA();
  cast(0,TRI,[uid(sp),uid(w)]);
  ok('悪魔への貢物: the Special Summoned monster was sent to the Graveyard and a Level 4 or lower Normal Monster of the hand was Special Summoned',z(sp)==='grave'&&z(nm)==='mz'&&z(w)==='mz',JSON.stringify([z(sp),z(nm),z(w)]));
  audit('貢物 1'); }
{ fresh();const nm=mon('ブラック・マジシャン',1),w=mk('ワイト',0),tr=mk(TRI,0);gameState.players[1].mz=[nm];gameState.players[0].hand=[tr,w];baselineA();
  ok('悪魔への貢物 negative: no Special Summoned monster on the field → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
{ fresh();const sp=mon('青眼の白龍',1);sp.specialSummoned=true;const e=mk('ライオウ',0),tr=mk(TRI,0);gameState.players[1].mz=[sp];gameState.players[0].hand=[tr,e];baselineA();
  ok('悪魔への貢物 negative: no Normal Monster in my hand (ライオウ is an Effect Monster) → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== フェイク・ヒーロー ===== */
{ fresh();const he=mk('E・HERO クレイマン',0),fk=mk(FAK,0);gameState.players[0].hand=[fk,he];baselineA();
  cast(0,FAK,[uid(he)]);
  ok('フェイク・ヒーロー: the 「E・HERO」 was Special Summoned and cannot attack',z(he)==='mz'&&C(he).cannotAttack===true,JSON.stringify([z(he),C(he)&&C(he).cannotAttack]));
  phase('end');
  ok('フェイク・ヒーロー: at the End Phase it returned to the hand',z(he)==='hand',z(he));
  audit('フェイク 1'); }
{ fresh();const w=mk('ワイト',0),fk=mk(FAK,0);gameState.players[0].hand=[fk,w];baselineA();
  ok('フェイク・ヒーロー negative: no 「E・HERO」 in the hand → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
`);

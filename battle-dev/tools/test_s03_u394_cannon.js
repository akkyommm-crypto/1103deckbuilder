/* S03-U394: リニアキャノン, 絶対不可侵領域, 極限への衝動 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3940001;
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




















const LIN='リニアキャノン',ABS='絶対不可侵領域',IMP='極限への衝動';
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function toMyStandby(){endTurn();phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');}

/* ===== リニアキャノン ===== */
{ fresh();const sp=mk(LIN,0,'up'),bm=mon('ブラック・マジシャン',0),bh=mk('ブラック・ホール',0);gameState.players[0].hand=[sp,bh];gameState.players[0].mz=[bm];gameState.players[1].mz=[mon('ワイト',1)];baselineA();
  cast(0,LIN,[uid(bm)]);
  ok('キャノン: the monster was sacrificed (cost) and the opponent took half of its original ATK: 2500 / 2 = 1250',z(bm)==='grave'&&lp(1)===6750&&z(sp)==='grave',JSON.stringify({bm:z(bm),lp:lp(1),sp:z(sp)}));
  ok('キャノン: no other Spell Card can be activated this turn (ブラック・ホール refused)',legalH(0).ok===false,JSON.stringify(legalH(0)));
  endTurn();endTurn();
  ok('キャノン: the lock is over in my next turn',getLegalHandActions(0,gameState.players[0].hand.findIndex(c=>cardName(c)==='ブラック・ホール')).some(x=>x.id==='activate'),'');
  audit('キャノン 1'); }
{ fresh();const sp=mk(LIN,0,'up');gameState.players[0].hand=[sp];baselineA();
  ok('キャノン negative: no monster on my field → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 絶対不可侵領域 ===== */
{ fresh();const tr=faceSet(ABS,0),dis=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[dis];
  baselineA();
  toMyStandby();
  ok('不可侵: reached my Standby Phase',gameState.phase==='standby'&&gameState.activePlayer===0,JSON.stringify([gameState.phase,gameState.activePlayer,gameState.turn]));
  const hp0=gameState.players[0].hand.length;
  actSzC(tr,[]);
  ok('不可侵: activated in my Standby Phase; a hand card was discarded (cost)',z(tr)==='grave'&&gameState.players[0].hand.length<hp0+0&&gameState.players[0].grave.length>=2,JSON.stringify({tr:z(tr),hand:gameState.players[0].hand.length,hp0,g:gameState.players[0].grave.length}));
  ok('不可侵: no ban yet in this turn (it applies to the next opponent turn)',nsReason(1,'ワイト','normal')==='',nsReason(1,'ワイト','normal'));
  phase('main1');endTurn();
  ok('不可侵: the opponent cannot Normal Summon or Special Summon in their next turn',!!nsReason(1,'ワイト','normal')&&!!nsReason(1,'ワイト','special'),JSON.stringify([nsReason(1,'ワイト','normal'),nsReason(1,'ワイト','special')]));
  endTurn();endTurn();
  ok('不可侵: the ban is over afterwards',nsReason(1,'ワイト','normal')==='',nsReason(1,'ワイト','normal'));
  audit('不可侵 1'); }
{ fresh();const tr=faceSet(ABS,0),dis=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[dis];baselineA();
  actSzC(tr,[]);
  ok('不可侵 negative: in the Main Phase it cannot be activated (stays Set)',z(tr)==='sz'&&C(tr).face==='down',JSON.stringify([z(tr),C(tr)&&C(tr).face])); }

/* ===== 極限への衝動 ===== */
{ fresh();const tr=faceSet(IMP,0),h1=mk('ワイト',0),h2=mk('ライオウ',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[h1,h2];baselineA();
  actSzC(tr,[uid(h1),uid(h2)]);
  const toks=gameState.players[0].mz.filter(c=>c.name==='ソウルトークン'||cardName(c)==='ソウルトークン');
  ok('衝動: two hand cards to the Graveyard (cost); two ソウルトークン (ATK/DEF 0) Special Summoned',z(h1)==='grave'&&z(h2)==='grave'&&z(tr)==='grave'&&toks.length===2&&toks.every(t=>curATK(t)===0&&curDEF(t)===0),JSON.stringify({h1:z(h1),h2:z(h2),tr:z(tr),n:toks.length}));
  ok('衝動: the Tokens can be Tributed for an Advance Summon',tributeCandidates(0,dbOf({id:findCardIndex('ブラック・マジシャン')})).length>=2,'');
  audit('衝動 1'); }
{ fresh();const tr=faceSet(IMP,0),h1=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[h1];baselineA();
  actSzC(tr,[uid(h1)]);
  ok('衝動 negative: only one hand card → not activated (stays Set)',z(tr)==='sz'&&C(tr).face==='down'&&gameState.players[0].mz.length===0,JSON.stringify([z(tr),gameState.players[0].mz.length])); }
{ fresh();const tr=faceSet(IMP,0),h1=mk('ワイト',0),h2=mk('ライオウ',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[h1,h2];gameState.players[0].mz=[mon('ワイト',0),mon('ワイト',0),mon('ワイト',0),mon('ワイト',0)];baselineA();
  actSzC(tr,[uid(h1),uid(h2)]);
  ok('衝動 negative: only one free Monster Zone → not activated (hand cards kept)',z(tr)==='sz'&&z(h1)==='hand'&&z(h2)==='hand',JSON.stringify([z(tr),z(h1),z(h2)])); }
`);

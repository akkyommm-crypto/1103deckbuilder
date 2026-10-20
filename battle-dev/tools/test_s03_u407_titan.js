/* S03-U407: ジュラック・タイタン, サンダー・ユニコーン, 破壊竜ガンドラ (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4070001;
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



































const TIT='ジュラック・タイタン',UNI='サンダー・ユニコーン',GAN='破壊竜ガンドラ';
const SEEN=[];const __pick0=pick;pick=function(){const q=pc();if(q&&q.min!==0&&!(q.min>1))SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});return __pick0();};
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

/* ===== ジュラック・タイタン ===== */
function titanField(){fresh();gameState.activePlayer=1;const d=mon(TIT,0),tr=setCard('強制脱出装置',1),gn=mon('氷結界の龍 グングニール',1),w=mon('ワイト',0);
  gameState.players[0].mz=[d,w];gameState.players[1].sz=[tr];gameState.players[1].mz=[gn];gameState.players[1].hand=[mk('ワイト',1)];baselineA();return {d,tr,gn,w};}
{ const x=titanField();
  SEEN.length=0;PREFER=[uid(x.w)];duelActivateFromZone(1,'sz',idx(x.tr));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const l=SEEN.filter(s=>s.title.indexOf('強制脱出装置')>=0);const c=l.length?l[l.length-1].cands:null;
  ok('タイタン: an opponent Trap (強制脱出装置) cannot target it (only ワイト is offered)',c!==null&&c.indexOf(x.d.uid)<0&&c.indexOf(x.w.uid)>=0,JSON.stringify(c));
  audit('タイタン 1'); }
{ const x=titanField();
  SEEN.length=0;PREFER=[uid(x.w),uid(x.w)];duelActivateFromZone(1,'mz',idx(x.gn));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const lists=SEEN.map(s=>s.cands);
  ok('タイタン: an opponent Effect Monster effect (氷結界の龍 グングニール) cannot target it either',lists.length>0&&lists.every(c=>c.indexOf(x.d.uid)<0)&&lists.some(c=>c.indexOf(x.w.uid)>=0),JSON.stringify(lists)); }
{ fresh();const d=mk(TIT,0);gameState.players[0].hand=[d];baselineA();
  ok('タイタン: cannot be Special Summoned',canEffectSpecialSummonS03(C(d),'hand','test')===false,''); }
{ fresh();const d=mon(TIT,0),j=mk('ジュラック・アウロ',0);gameState.players[0].mz=[d];gameState.players[0].grave=[j];baselineA();
  ok('タイタン: the boost is offered (a 「ジュラック」 with ATK 1700 or less in the Graveyard)',canZ(d)===true,'');
  actC(d,[uid(j)]);
  ok('タイタン: ジュラック・アウロ banished (cost); ATK 3000 + 1000 = 4000; once per turn',z(j)==='banish'&&curATK(C(d))===4000&&canZ(d)===false,JSON.stringify([z(j),curATK(C(d)),canZ(d)]));
  endTurn();
  ok('タイタン: back to ATK 3000 after the End Phase',curATK(C(d))===3000,String(curATK(C(d))));
  audit('タイタン 2'); }
{ fresh();const d=mon(TIT,0);gameState.players[0].mz=[d];baselineA();
  ok('タイタン negative: no 「ジュラック」 in the Graveyard → not offered',canZ(d)===false,''); }

/* ===== サンダー・ユニコーン ===== */
{ fresh();const u=mon(UNI,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[u,w];gameState.players[1].mz=[f];baselineA();
  ok('ユニコーン: the effect is available',canZ(u)===true,'');
  actC(u,[uid(f)]);
  ok('ユニコーン: 青眼 ATK 3000 - 500 x 2 monsters = 2000',curATK(C(f))===2000,String(curATK(C(f))));
  ok('ユニコーン: my other monster cannot attack this turn, the Unicorn itself can; once per turn',cannotAttackNow(C(w))===true&&cannotAttackNow(C(u))===false&&canZ(u)===false,JSON.stringify([cannotAttackNow(C(w)),cannotAttackNow(C(u)),canZ(u)]));
  endTurn();
  ok('ユニコーン: ATK back to 3000 after the End Phase',curATK(C(f))===3000,String(curATK(C(f))));
  audit('ユニコーン 1'); }
{ fresh();const u=mon(UNI,0);gameState.players[0].mz=[u];baselineA();
  ok('ユニコーン negative: no face-up opponent monster → not offered',canZ(u)===false,''); }

/* ===== 破壊竜ガンドラ ===== */
{ fresh();const g=mon(GAN,0),w=mon('ワイト',0),f=mon('青眼の白龍',1),st=setCard('激流葬',1);gameState.players[0].mz=[g,w];gameState.players[1].mz=[f];gameState.players[1].sz=[st];baselineA();
  ok('ガンドラ: cannot be Special Summoned',(function(){const h=mk(GAN,0);return canEffectSpecialSummonS03(h,'hand','test')===false;})(),'');
  actC(g);
  ok('ガンドラ: half of my LP (4000) paid; the other 3 cards of the field were destroyed and banished (ワイト, 青眼, the Set trap)',lp(0)===4000&&z(w)==='banish'&&z(f)==='banish'&&z(st)==='banish'&&z(g)==='mz',JSON.stringify([lp(0),z(w),z(f),z(st),z(g)]));
  ok('ガンドラ: ATK 0 + 300 x 3 = 900',curATK(C(g))===900,String(curATK(C(g))));
  audit('ガンドラ 1'); }
{ fresh();const g=mon(GAN,0);g.summonedTurn=5;gameState.players[0].mz=[g];baselineA();
  phase('end');
  ok('ガンドラ: summoned this turn → sent to the Graveyard at the End Phase',z(g)==='grave',z(g)); }
{ fresh();const g=mon(GAN,0);gameState.players[0].mz=[g];baselineA();
  phase('end');
  ok('ガンドラ negative: not summoned this turn → stays',z(g)==='mz',z(g)); }
`);

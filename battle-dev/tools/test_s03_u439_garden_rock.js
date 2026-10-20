/* S03-U439: 氷結界の御庭番, 幻獣ロックリザード, ローズ・テンタクルス (stale ENGINE_GAP / NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4270001;
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









































































const SEEN=[];const __pick0=pick;pick=function(){const q=pc();if(q&&q.min!==0&&!(q.min>1))SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});return __pick0();};
const GAR='氷結界の御庭番',ROC='幻獣ロックリザード',TEN='ローズ・テンタクルス';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function H(c){return findCardByUid(c.uid);}
function ids(i){return getLegalHandActions(0,i).map(a=>a.id);}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function atkOf(n){return CARD_DB.find(x=>x.n===n).atk;}

/* ===== 氷結界の御庭番 ===== */
function gardenField(){fresh();gameState.activePlayer=1;const g=mon(GAR,0),dr=mon('氷結界の龍 グングニール',0),w=mon('ワイト',0),tr=setCard('強制脱出装置',1),gn=mon('氷結界の龍 グングニール',1);
  gameState.players[0].mz=[g,dr,w];gameState.players[1].sz=[tr];gameState.players[1].mz=[gn];gameState.players[1].hand=[mk('ワイト',1)];baselineA();return {g,dr,w,tr,gn};}
{ const x=gardenField();
  SEEN.length=0;PREFER=[uid(x.w),uid(x.w)];duelActivateFromZone(1,'mz',idx(x.gn));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const lists=SEEN.map(s=>s.cands);
  ok('御庭番: the opponent Effect Monster (氷結界の龍 グングニール) cannot target my 氷結界 monsters (only ワイト is offered)',lists.length>0&&lists.every(c=>c.indexOf(x.dr.uid)<0&&c.indexOf(x.g.uid)<0)&&lists.some(c=>c.indexOf(x.w.uid)>=0),JSON.stringify(lists));
  audit('御庭番 1'); }
{ const x=gardenField();
  SEEN.length=0;PREFER=[uid(x.dr)];duelActivateFromZone(1,'sz',idx(x.tr));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const l=SEEN.filter(s=>s.title.indexOf('強制脱出装置')>=0);const c=l.length?l[l.length-1].cands:null;
  ok('御庭番: a Trap (強制脱出装置) can still target my 氷結界 monster (the text names Effect Monsters only)',c!==null&&c.indexOf(x.dr.uid)>=0,JSON.stringify(c)); }
{ fresh();gameState.activePlayer=1;const dr=mon('氷結界の龍 グングニール',0),w=mon('ワイト',0),gn=mon('氷結界の龍 グングニール',1);
  gameState.players[0].mz=[dr,w];gameState.players[1].mz=[gn];gameState.players[1].hand=[mk('ワイト',1)];baselineA();
  SEEN.length=0;PREFER=[uid(w),uid(w)];duelActivateFromZone(1,'mz',idx(gn));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const lists=SEEN.map(s=>s.cands);
  ok('御庭番 control: without it the opponent Effect Monster can target my 氷結界 monster',lists.some(c=>c.indexOf(dr.uid)>=0),JSON.stringify(lists)); }

/* ===== 幻獣ロックリザード ===== */
{ fresh();const r=mk(ROC,0),g=mon('幻獣王ガゼル',0);gameState.players[0].hand=[r];gameState.players[0].mz=[g];baselineA();
  ok('ロックリザード: a 「幻獣」 monster as the only Tribute → the Advance Summon is offered',ids(0).indexOf('normalSummon')>=0,JSON.stringify(ids(0))); }
{ fresh();const r=mk(ROC,0),g=mon('ワイト',0);gameState.players[0].hand=[r];gameState.players[0].mz=[g];baselineA();
  ok('ロックリザード negative: one non-幻獣 monster is not enough (Level 7 needs two)',ids(0).indexOf('normalSummon')<0,JSON.stringify(ids(0))); }
{ fresh();const r=mon(ROC,0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f1,f2];baselineA();
  const l1=lp(1);phase('battle');myAttack(r,f1);
  ok('ロックリザード: it destroyed a monster in battle → 500 damage on top of the battle damage',z(f1)==='grave'&&l1-lp(1)===500+(2200-atkOf('ワイト')),JSON.stringify([z(f1),l1,lp(1)]));
  audit('ロックリザード 1'); }
{ fresh();const r=mon(ROC,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  const l1=lp(1);phase('battle');myAttack(r,f);
  ok('ロックリザード negative: it destroyed nothing (it was destroyed) → no burn',z(r)==='grave'&&lp(1)===l1,JSON.stringify([z(r),l1,lp(1)])); }
{ fresh();const r=mon(ROC,0);gameState.players[0].mz=[r];baselineA();
  const l1=lp(1);API.destroy(H(r),'test');flushDeferredEventsV2();drive();
  ok('ロックリザード: destroyed by my own effect (not the opponent) → no 2000 damage',z(r)==='grave'&&lp(1)===l1,JSON.stringify([z(r),l1,lp(1)])); }
{ fresh();gameState.activePlayer=1;const r=mon(ROC,0),bh=mk('ブラック・ホール',1);gameState.players[0].mz=[r];gameState.players[1].hand=[bh];baselineA();
  const l1=lp(1);duelActivateFromHand(0);drive();
  ok('ロックリザード: destroyed by an opponent card effect (ブラック・ホール) → 2000 damage to the opponent',z(r)==='grave'&&l1-lp(1)===2000,JSON.stringify([z(r),l1,lp(1)]));
  audit('ロックリザード 2'); }

/* ===== ローズ・テンタクルス ===== */
{ fresh();const t=mon(TEN,0),p1=mon('ウィード',1),p2=mon('ウィード',1),w=mon('ワイト',1);gameState.players[0].mz=[t];gameState.players[1].mz=[p1,p2,w];baselineA();
  const l1=lp(1);phase('battle');myAttack(t,p1);myAttack(t,p2);myAttack(t,w);
  ok('テンタクルス: two opponent Plants → 1 + 2 attacks: all three monsters destroyed',z(p1)==='grave'&&z(p2)==='grave'&&z(w)==='grave',JSON.stringify([z(p1),z(p2),z(w)]));
  const exp=2*(300+(2200-atkOf('ウィード')))+(2200-atkOf('ワイト'));
  ok('テンタクルス: each Plant it destroyed in battle cost the opponent 300 on top of the battle damage',l1-lp(1)===exp,JSON.stringify([l1,lp(1),exp]));
  audit('テンタクルス 1'); }
{ fresh();const t=mon(TEN,0),p1=mon('ワイト',1),p2=mon('ワイト',1);gameState.players[0].mz=[t];gameState.players[1].mz=[p1,p2];baselineA();
  phase('battle');myAttack(t,p1);myAttack(t,p2);
  ok('テンタクルス control: no Plant → one attack only (the second ワイト survives)',z(p1)==='grave'&&z(p2)==='mz',JSON.stringify([z(p1),z(p2)])); }
{ fresh();const t=mk(TEN,0);gameState.players[0].hand=[t];baselineA();
  ok('テンタクルス: cannot be Special Summoned',canEffectSpecialSummonS03(C(t),'hand','test')===false,''); }
`);

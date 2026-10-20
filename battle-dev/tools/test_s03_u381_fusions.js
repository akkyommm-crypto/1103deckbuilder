/* S03-U381: 聖獣セルケト, 地天の騎士ガイアドレイク, ナイトメアを駆る死霊 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3810001;
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







const SETH='聖獣セルケト',DRK='地天の騎士ガイアドレイク',NMR='ナイトメアを駆る死霊';
function foeTurn(){gameState.activePlayer=1;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function toOppBattle(){endTurn();phase('battle');}

/* ===== 聖獣セルケト ===== */
function sethField(temple){fresh();const s=mon(SETH,0),f=mon('ワイト',1),tp=mk('王家の神殿',0,'up');
  gameState.players[0].mz=[s];gameState.players[0].sz=temple?[tp]:[];gameState.players[1].mz=[f];baselineA();return {s,f,tp};}
{ const x=sethField(true);
  phase('battle');const a0=curATK(C(x.s));
  atkTarget(0,x.s,x.f);
  ok('セルケト: the monster it destroyed in battle is banished, not sent to the Graveyard',z(x.f)==='banish',z(x.f));
  ok('セルケト: ATK +500 after destroying a monster in battle',curATK(C(x.s))===a0+500,JSON.stringify([a0,curATK(C(x.s))]));
  audit('セルケト 1'); }
{ const x=sethField(true);
  act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,byDestroy:true,reason:'test'});drive();
  ok('セルケト: without 「王家の神殿」 on my field it is destroyed',z(x.s)==='grave',z(x.s)); }

/* ===== 地天の騎士ガイアドレイク ===== */
function drakeField(){fresh();foeTurn();const d=mon(DRK,0),tr=setCard('強制脱出装置',1),gn=mon('氷結界の龍 グングニール',1),w=mon('ワイト',0),bh=mk('ブラック・ホール',1),mn=mk('月の書',1,'up');
  gameState.players[0].mz=[d,w];gameState.players[1].sz=[tr];gameState.players[1].mz=[gn];gameState.players[1].hand=[mn,bh,mk('ワイト',1)];baselineA();return {d,tr,gn,w,bh,mn};}
{ const x=drakeField();
  SEEN.length=0;PREFER=[uid(x.w)];duelActivateFromZone(1,'sz',idx(x.tr));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const l=SEEN.filter(s=>s.title.indexOf('強制脱出装置')>=0);const c=l.length?l[l.length-1].cands:null;
  ok('ドレイク: an opponent Trap (not an Effect Monster) can still target it — it is offered next to ワイト',c!==null&&c.indexOf(x.d.uid)>=0,JSON.stringify(c));
  audit('ドレイク 1'); }
{ const x=drakeField();
  SEEN.length=0;PREFER=[uid(x.w),uid(x.w)];duelActivateFromZone(1,'mz',idx(x.gn));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const lists=SEEN.map(s=>s.cands);
  ok('ドレイク: an opponent Effect Monster effect (氷結界の龍 グングニール) cannot target it',lists.length>0&&lists.every(c=>c.indexOf(x.d.uid)<0)&&lists.some(c=>c.indexOf(x.w.uid)>=0),JSON.stringify(lists)+' d='+x.d.uid); }
{ drakeField();
  ok('ドレイク: protectV21 declares the Effect Monster destruction immunity',!!CARD_SCRIPTS['地天の騎士ガイアドレイク'].protectV21&&CARD_SCRIPTS['地天の騎士ガイアドレイク'].protectV21.sourceKind.indexOf('m')>=0,''); }

/* ===== ナイトメアを駆る死霊 ===== */
function nmField(){fresh();const n=mon(NMR,0),bl=mon('ワイト',1),h1=mk('ワイト',1),h2=mk('ワイト',1);
  gameState.players[0].mz=[n];gameState.players[1].mz=[bl];gameState.players[1].hand=[h1,h2];baselineA();return {n,bl,h1,h2};}
{ const x=nmField();
  phase('battle');const l1=lp(1);
  atkTarget(0,x.n,'direct');
  ok('死霊: attacks directly although the opponent controls a monster (800 damage)',lp(1)===l1-800,JSON.stringify([l1,lp(1)]));
  ok('死霊: the opponent discarded one random card from the hand',gameState.players[1].hand.length===1&&(z(x.h1)==='grave'||z(x.h2)==='grave'),JSON.stringify([gameState.players[1].hand.length,z(x.h1),z(x.h2)]));
  audit('死霊 1'); }
{ fresh();const n=mon(NMR,0),big=mon('青眼の白龍',1);gameState.players[0].mz=[n];gameState.players[1].mz=[big];baselineA();
  toOppBattle();atkTarget(1,big,n);
  ok('死霊: not destroyed by battle (青眼の白龍 attacks it)',z(n)==='mz',z(n)); }
{ fresh();foeTurn();const n=mon(NMR,0),mn=mk('月の書',1,'up');gameState.players[0].mz=[n];gameState.players[1].hand=[mn];baselineA();
  PREFER=[uid(n)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  ok('死霊: targeted by a Spell (月の書) -> destroyed',z(n)!=='mz',z(n)); }
{ fresh();foeTurn();const n=mon(NMR,0),w=mon('ワイト',0),mn=mk('月の書',1,'up');gameState.players[0].mz=[n,w];gameState.players[1].hand=[mn];baselineA();
  PREFER=[uid(w)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  ok('死霊 negative: another monster targeted -> it stays',z(n)==='mz',z(n)); }
`);

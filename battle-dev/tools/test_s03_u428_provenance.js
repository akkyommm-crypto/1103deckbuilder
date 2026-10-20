/* S03-U428: グリード・グラード, バルーン・リザード, ブリザード・ウォリアー, ジュラック・イグアノン, コカローチ・ナイト, インフェルニティ・ナイト (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x41C0001;
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
const GRE='グリード・グラード',BAL='バルーン・リザード',BLI='ブリザード・ウォリアー',IGU='ジュラック・イグアノン',ROA='コカローチ・ナイト',INF='インフェルニティ・ナイト';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function boost(c,n){c.mods=[{atk:n,def:0,until:'permanent',label:'fixture',turn:5}];}
function H(c){return findCardByUid(c.uid);}
function bcount(c){const x=C(c);return (x&&x.counters&&Number(x.counters['カウンター']))||0;}

/* ===== グリード・グラード ===== */
{ fresh();const a=mon('青眼の白龍',0),s=mon('大地の騎士ガイアナイト',1),g=mk(GRE,0,'up');gameState.players[0].mz=[a];gameState.players[1].mz=[s];gameState.players[0].hand=[g];baselineA();
  ok('グリード・グラード: not activatable before I destroyed a Synchro Monster this turn',legalH(0).ok===false,JSON.stringify(legalH(0)));
  phase('battle');myAttack(a,s);phase('main2');
  ok('グリード・グラード: activatable after destroying the opponent\'s face-up Synchro Monster in battle',z(s)==='grave'&&legalH(0).ok===true,JSON.stringify([z(s),legalH(0)]));
  const n0=gameState.players[0].hand.length;cast(0,GRE);
  ok('グリード・グラード: I drew 2 cards (the Quick-Play Spell left the hand)',gameState.players[0].hand.length===n0-1+2,JSON.stringify([n0,gameState.players[0].hand.length]));
  audit('グリード 1'); }
{ fresh();const a=mon('青眼の白龍',0),w=mon('ワイト',1),g=mk(GRE,0,'up');gameState.players[0].mz=[a];gameState.players[1].mz=[w];gameState.players[0].hand=[g];baselineA();
  phase('battle');myAttack(a,w);phase('main2');
  ok('グリード・グラード negative: the destroyed monster was not a Synchro Monster → not activatable',z(w)==='grave'&&legalH(0).ok===false,JSON.stringify([z(w),legalH(0)])); }

/* ===== バルーン・リザード ===== */
{ fresh();const b=mon(BAL,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  endTurn();endTurn();
  ok('バルーン・リザード: a counter at my Standby Phase',bcount(b)===1,String(bcount(b)));
  endTurn();endTurn();
  ok('バルーン・リザード: another counter at my next Standby Phase (2)',bcount(b)===2&&C(b).u428Cnt===2,JSON.stringify([bcount(b),C(b).u428Cnt]));
  const l1=lp(1);toOppBattle();foeAttack(f,b);
  ok('バルーン・リザード: destroyed by 青眼 → the controller of the destroying card took 2 x 400 damage',z(b)==='grave'&&l1-lp(1)===800,JSON.stringify([z(b),l1,lp(1)]));
  audit('バルーン 1'); }
{ fresh();const b=mon(BAL,0);gameState.players[0].mz=[b];baselineA();
  const l1=lp(1),l0=lp(0);API.destroy(H(b),'test',1);flushDeferredEventsV2();drive();
  ok('バルーン・リザード negative: destroyed with no counter on it → no damage',z(b)==='grave'&&lp(1)===l1&&lp(0)===l0,JSON.stringify([z(b),l0,lp(0),l1,lp(1)])); }

/* ===== ブリザード・ウォリアー ===== */
{ fresh();const w=mon(BLI,0),f=mon('ワイト',1),top=mk('青眼の白龍',1);boost(w,2000);gameState.players[0].mz=[w];gameState.players[1].mz=[f];gameState.players[1].deck.unshift(top);baselineA();
  phase('battle');PREFER=['no'];myAttack(w,f);PREFER=[];
  const D=gameState.players[1].deck;
  ok('ブリザード・ウォリアー: destroyed a monster in battle → the opponent\'s top card was looked at and (answer no) put to the bottom',z(f)==='grave'&&D[D.length-1].uid===top.uid&&D[0].uid!==top.uid,JSON.stringify([z(f),D[0].uid,D[D.length-1].uid,top.uid]));
  audit('ブリザード 1'); }
{ fresh();const w=mon(BLI,0),f=mon('ワイト',1),top=mk('青眼の白龍',1);boost(w,2000);gameState.players[0].mz=[w];gameState.players[1].mz=[f];gameState.players[1].deck.unshift(top);baselineA();
  phase('battle');PREFER=['yes'];myAttack(w,f);PREFER=[];
  ok('ブリザード・ウォリアー: answer yes → the top card stays on top',z(f)==='grave'&&gameState.players[1].deck[0].uid===top.uid,JSON.stringify([z(f),gameState.players[1].deck[0].uid,top.uid])); }

/* ===== ジュラック・イグアノン ===== */
{ fresh();const i=mon(IGU,0),f=mon('ワイト',1),t=setCard('激流葬',1);gameState.players[0].mz=[i];gameState.players[1].mz=[f];gameState.players[1].sz=[t];baselineA();
  phase('battle');PREFER=[uid(t)];myAttack(i,f);PREFER=[];
  ok('ジュラック・イグアノン: destroyed a monster in battle → the opponent\'s Set card returned to their hand',z(f)==='grave'&&z(t)==='hand',JSON.stringify([z(f),z(t)]));
  audit('イグアノン 1'); }
{ fresh();const i=mon(IGU,0),f=mon('ワイト',1);gameState.players[0].mz=[i];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(i,f);
  ok('ジュラック・イグアノン negative: no Set card on the opponent field → nothing happens',z(f)==='grave'&&z(i)==='mz',JSON.stringify([z(f),z(i)])); }

/* ===== コカローチ・ナイト ===== */
{ fresh();const r=mon(ROA,0);gameState.players[0].mz=[r];baselineA();
  API.sendToGrave(H(r),'test');flushDeferredEventsV2();drive();
  ok('コカローチ・ナイト: sent to the Graveyard → returned to the top of the Deck',z(r)==='deck'&&gameState.players[0].deck[0].uid===r.uid,JSON.stringify([z(r),gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid,r.uid]));
  audit('コカローチ 1'); }

/* ===== インフェルニティ・ナイト ===== */
{ fresh();const n=mon(INF,0),h1=mk('ワイト',0),h2=mk('ブラック・マジシャン',0);gameState.players[0].mz=[n];gameState.players[0].hand=[h1,h2];baselineA();
  PREFER=[uid(h1),uid(h2)];API.destroy(H(n),'test');flushDeferredEventsV2();drive();PREFER=[];
  ok('インフェルニティ・ナイト: destroyed on the field → two hand cards discarded and it was Special Summoned from the Graveyard',z(n)==='mz'&&z(h1)==='grave'&&z(h2)==='grave',JSON.stringify([z(n),z(h1),z(h2)]));
  audit('インフェルニティ 1'); }
{ fresh();const n=mon(INF,0),h1=mk('ワイト',0);gameState.players[0].mz=[n];gameState.players[0].hand=[h1];baselineA();
  API.destroy(H(n),'test');flushDeferredEventsV2();drive();
  ok('インフェルニティ・ナイト negative: only one card in the hand → stays in the Graveyard',z(n)==='grave'&&z(h1)==='hand',JSON.stringify([z(n),z(h1)])); }
`);

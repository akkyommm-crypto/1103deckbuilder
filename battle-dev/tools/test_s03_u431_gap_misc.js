/* S03-U431: マザー・スパイダー, 薔薇の妖精, ローズ・バード, 戦士ラーズ, ダーク・ヴァージャー, ホープ・オブ・フィフス (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x41F0001;
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
const MOT='マザー・スパイダー',FAI='薔薇の妖精',BIR='ローズ・バード',RAZ='戦士ラーズ',VER='ダーク・ヴァージャー',HOP='ホープ・オブ・フィフス';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function H(c){return findCardByUid(c.uid);}

/* ===== マザー・スパイダー ===== */
{ fresh();const m=mk(MOT,0),f1=mon('ワイト',1,'def'),f2=mon('ブラック・マジシャン',1,'def'),ins=mk('C・ラーバ',0);gameState.players[0].hand=[m];gameState.players[0].grave=[ins];gameState.players[1].mz=[f1,f2];baselineA();
  ok('マザー・スパイダー: Special Summonable (only Insects in my Graveyard, two face-up Defense Position opponent monsters)',procOk(MOT,0)===true,'');
  PREFER=[uid(f1),uid(f2)];procRun(MOT,0);PREFER=[];
  ok('マザー・スパイダー: both opponent monsters were sent to the Graveyard and it stands on the field',z(m)==='mz'&&z(f1)==='grave'&&z(f2)==='grave',JSON.stringify([z(m),z(f1),z(f2)]));
  audit('マザー 1'); }
{ fresh();const m=mk(MOT,0),f1=mon('ワイト',1,'def'),f2=mon('ブラック・マジシャン',1,'def'),nb=mk('ブラック・マジシャン',0);gameState.players[0].hand=[m];gameState.players[0].grave=[nb];gameState.players[1].mz=[f1,f2];baselineA();
  ok('マザー・スパイダー negative: a non-Insect monster in my Graveyard → not Special Summonable',procOk(MOT,0)===false,''); }
{ fresh();const m=mk(MOT,0),f1=mon('ワイト',1,'def'),f2=mon('ブラック・マジシャン',1,'atk');gameState.players[0].hand=[m];gameState.players[1].mz=[f1,f2];baselineA();
  ok('マザー・スパイダー negative: only one face-up Defense Position opponent monster → not Special Summonable',procOk(MOT,0)===false,''); }

/* ===== 薔薇の妖精 ===== */
{ fresh();const r=mk(FAI,0);gameState.players[0].deck.push(r);baselineA();
  API.searchDeck(0,gameState.players[0].deck.indexOf(r),'ワイト');flushDeferredEventsV2();drive();
  ok('薔薇の妖精: added to the hand from the Deck by an effect → Special Summoned',z(r)==='mz',z(r));
  audit('薔薇の妖精 1'); }
{ fresh();const r=mk(FAI,0);gameState.players[0].grave=[r];baselineA();
  API.returnToHand(H(r),'test');flushDeferredEventsV2();drive();
  ok('薔薇の妖精 negative: added to the hand from the Graveyard → stays in the hand (or Graveyard)',z(r)!=='mz',z(r)); }

/* ===== ローズ・バード ===== */
{ fresh();const b=mon(BIR,0),f=mon('青眼の白龍',1),t1=mk('ウィード',0),t2=mk('グローアップ・バルブ',0);gameState.players[0].mz=[b];gameState.players[1].mz=[f];gameState.players[0].deck.push(t1,t2);baselineA();
  toOppBattle();PREFER=[uid(t1),uid(t2)];foeAttack(f,b);PREFER=[];
  ok('ローズ・バード: destroyed in Attack Position by a monster\'s attack → two Plant Tuners of the Deck were Special Summoned in Defense Position',z(b)==='grave'&&z(t1)==='mz'&&z(t2)==='mz'&&C(t1).pos==='def'&&C(t1).face==='up',JSON.stringify([z(b),z(t1),z(t2),C(t1)&&C(t1).pos]));
  audit('ローズ・バード 1'); }
{ fresh();const b=mon(BIR,0,'def'),f=mon('青眼の白龍',1),t1=mk('ウィード',0),t2=mk('グローアップ・バルブ',0);gameState.players[0].mz=[b];gameState.players[1].mz=[f];gameState.players[0].deck.push(t1,t2);baselineA();
  toOppBattle();foeAttack(f,b);
  ok('ローズ・バード negative: destroyed in Defense Position → nothing happens',z(b)==='grave'&&z(t1)==='deck'&&z(t2)==='deck',JSON.stringify([z(b),z(t1),z(t2)])); }

/* ===== 戦士ラーズ ===== */
{ fresh();const r=mk(RAZ,0),w=mk('7つの武器を持つハンター',0),w2=mk('C・リペアラー',0);gameState.players[0].hand=[r];gameState.players[0].deck.push(w,w2);baselineA();
  PREFER=[uid(w2)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('戦士ラーズ: Normal Summoned → the chosen Warrior (Level 4 or lower) was put on top of the Deck',z(r)==='mz'&&gameState.players[0].deck[0].uid===w2.uid,JSON.stringify([z(r),gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid,w2.uid]));
  audit('ラーズ 1'); }
{ fresh();const r=mk(RAZ,0);gameState.players[0].hand=[r];baselineA();
  const top0=gameState.players[0].deck[0].uid;doNormalSummon(0,'atk');drive();
  ok('戦士ラーズ negative: no Warrior in the Deck → the Deck is unchanged',z(r)==='mz'&&gameState.players[0].deck[0].uid===top0,''); }

/* ===== ダーク・ヴァージャー ===== */
{ fresh();const v=mk(VER,0),t=mk('ウィード',0);gameState.players[0].grave=[v];gameState.players[0].hand=[t];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('ダーク・ヴァージャー: a Plant Tuner was Normal Summoned → it was Special Summoned from the Graveyard in Attack Position',z(t)==='mz'&&z(v)==='mz'&&C(v).pos==='atk',JSON.stringify([z(t),z(v),C(v)&&C(v).pos]));
  audit('ヴァージャー 1'); }
{ fresh();const v=mk(VER,0),t=mk('ワイト',0);gameState.players[0].grave=[v];gameState.players[0].hand=[t];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('ダーク・ヴァージャー negative: a non-Plant-Tuner was summoned → stays in the Graveyard',z(t)==='mz'&&z(v)==='grave',JSON.stringify([z(t),z(v)])); }

/* ===== ホープ・オブ・フィフス ===== */
{ fresh();const s=mk(HOP,0,'up'),hs=[1,2,3,4,5].map(()=>mk('E・HERO クレイマン',0)),o=mk('ワイト',0);gameState.players[0].hand=[s,o];gameState.players[0].grave=hs.slice();baselineA();
  const n0=gameState.players[0].hand.length,dk0=gameState.players[0].deck.length;
  cast(0,HOP,hs.map(h=>uid(h)));
  ok('ホープ・オブ・フィフス: five 「E・HERO」 returned to the Deck and I drew 2 (another card was in my hand)',hs.every(h=>z(h)==='deck'||z(h)==='hand')&&gameState.players[0].hand.length===n0-1+2&&gameState.players[0].deck.length===dk0+5-2,JSON.stringify([n0,gameState.players[0].hand.length,dk0,gameState.players[0].deck.length]));
  audit('ホープ 1'); }
{ fresh();const s=mk(HOP,0,'up'),hs=[1,2,3,4,5].map(()=>mk('E・HERO クレイマン',0));gameState.players[0].hand=[s];gameState.players[0].grave=hs.slice();baselineA();
  const n0=gameState.players[0].hand.length;
  cast(0,HOP,hs.map(h=>uid(h)));
  ok('ホープ・オブ・フィフス: no other card in my hand or on my field → I drew 3',gameState.players[0].hand.length===n0-1+3,JSON.stringify([n0,gameState.players[0].hand.length])); }
{ fresh();const s=mk(HOP,0,'up'),hs=[1,2,3,4].map(()=>mk('E・HERO クレイマン',0));gameState.players[0].hand=[s];gameState.players[0].grave=hs.slice();baselineA();
  ok('ホープ・オブ・フィフス negative: only four 「E・HERO」 in the Graveyard → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
`);

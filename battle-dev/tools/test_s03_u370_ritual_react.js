/* S03-U370: 昇華する魂, 宣告者の預言, 神光の宣告者.
   Real DUEL paths (the Ritual Summon success event: a Continuous Spell and a Ritual Spell retrieve a released monster, a Ritual Monster negates an opponent activation), Replay-audited. */
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
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3700001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}



const SOU='昇華する魂',PRO='宣告者の預言',HER='神光の宣告者';
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function foeTurn(){gameState.activePlayer=1;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}

/* ===== 昇華する魂 ===== */
{ fresh();const t=mk(SOU,0);t.face='up';const sp=mk('踊りによる誘発',0),rm=mk('ダンシング・ソルジャー',0),mat=mon('青眼の白龍',0);
  gameState.players[0].sz=[t];gameState.players[0].hand=[sp,rm];gameState.players[0].mz=[mat];baselineA();
  PREFER=[rm.uid,mat.uid,mat.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('昇華する魂: a Ritual Summon (ダンシング・ソルジャー released 青眼の白龍) -> 青眼 returned to my hand from the Graveyard',pz(rm)==='mz'&&pz(mat)==='hand',JSON.stringify({rm:pz(rm),mat:pz(mat)}));
  audit('昇華する魂 1'); }
{ fresh();const t=mk(SOU,0);t.face='up';const w=mk('ワイト',0),g=mk('もけもけ',0);gameState.players[0].sz=[t];gameState.players[0].grave=[g];gameState.players[0].hand=[w];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('昇華する魂 negative: a Normal Summon does not trigger it',pz(g)==='grave',pz(g)); }

/* ===== 宣告者の預言 ===== */
{ fresh();const sp=mk(PRO,0),h=mk(HER,0),a=mk('ウィング・エッグ・エルフ',0),b=mk('ウェザー・コントロール',0),c=mk('キーメイス',0);
  /* Level 3 + 2 + 1 = 6 exactly */
  gameState.players[0].hand=[sp,h];gameState.players[0].mz=[mon('ウィング・エッグ・エルフ',0),mon('ウェザー・コントロール',0),mon('キーメイス',0)];baselineA();
  const mz=gameState.players[0].mz.slice();
  ok('宣告者の預言: Levels 3 + 2 + 1 = 6 -> activatable',API.ritualCanActivate(0,PRO)===true,'');
  PREFER=[h.uid].concat(mz.map(x=>x.uid));duelActivateFromHand(0);drive();PREFER=[];
  ok('宣告者の預言: 神光の宣告者 Ritual Summoned by the three monsters (Levels 3 + 2 + 1)',pz(h)==='mz',pz(h));
  ok('宣告者の預言: the Spell was banished from the Graveyard (cost) and ONE released monster returned to the hand, the other two stay in the Graveyard',pz(sp)==='banish'&&mz.filter(x=>pz(x)==='hand').length===1&&mz.filter(x=>pz(x)==='grave').length===2,JSON.stringify({sp:pz(sp),m:mz.map(pz)}));
  audit('宣告者の預言 1'); }
{ fresh();const sp=mk(PRO,0),h=mk(HER,0);gameState.players[0].hand=[sp,h];gameState.players[0].mz=[mon('青眼の白龍',0)];baselineA();
  ok('宣告者の預言 negative: Level 8 alone is not "exactly 6" -> not activatable',API.ritualCanActivate(0,PRO)===false,''); }

/* ===== 神光の宣告者 ===== */
{ fresh();foeTurn();const h=mon(HER,0),an=mk('もけもけ',0),cy=mk('サイクロン',1),st=mk('ブラック・ホール',0);st.face='down';st.setTurn=4;
  gameState.players[0].mz=[h];gameState.players[0].hand=[an];gameState.players[0].sz=[st];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[st.uid]);
  const offered=(gameState.chainWindow&&gameState.chain.length)?getChainResponsesV2(0).some(x=>x.card===h):false;
  ok('神光の宣告者: the opponent\'s サイクロン activation -> offered (a hand Angel is available)',offered===true,JSON.stringify({len:gameState.chain.length}));
  const hh=findCardByUid(h.uid);PREFER=[an.uid];duelActivateResponseV2(0,'mz',hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  ok('神光の宣告者: サイクロン negated and destroyed, the Angel discarded, my set card survives',pz(cy)==='grave'&&pz(an)==='grave'&&pz(st)==='sz',JSON.stringify({cy:pz(cy),an:pz(an),st:pz(st)}));
  audit('神光の宣告者 1'); }
{ fresh();foeTurn();const h=mon(HER,0),cy=mk('サイクロン',1),st=mk('ブラック・ホール',0);st.face='down';st.setTurn=4;
  gameState.players[0].mz=[h];gameState.players[0].sz=[st];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[st.uid]);
  const offered=(gameState.chainWindow&&gameState.chain.length)?getChainResponsesV2(0).some(x=>x.card===h):false;
  ok('神光の宣告者 negative: no Angel in my hand -> not offered',offered===false,'');drive(); }

console.log('U370 done');
{ fresh();const s=mk(SOU,0,'up');gameState.players[0].hand=[s];baselineA();
  ok('昇華する魂: the Continuous Spell can be activated from the hand (S03-U390: the activation guard looked at the logical zone)',getLegalHandActions(0,0).some(a=>a.id==='activate'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }
`);

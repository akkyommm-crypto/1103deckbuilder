/* S03-U355: 透破抜き, 王家の呪い, 六尺瓊勾玉, エンペラー・オーダー.
   Real DUEL chains: the opponent starts a chain and the Counter Trap is answered from the Spell & Trap Zone, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3550001;
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



const TOH='透破抜き',OUR='王家の呪い',MAG='六尺瓊勾玉',EMP='エンペラー・オーダー';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){
  const h=findCardByUid(c.uid); if(!h) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,h.zone,h.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  return true;
}
/* the opponent (player 1) is the turn player and starts the chain from its hand; player 0 holds the Counter Trap */
function foeTurn(){gameState.activePlayer=1;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}

/* ===== 透破抜き ===== */
{ fresh();foeTurn();const t=setCard(TOH,0),pu=mk('傀儡虫',1),fz=mon('ワイト',0),hx=mon('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[fz];gameState.players[1].hand=[pu];gameState.players[1].mz=[];baselineA();
  foeCast('傀儡虫',[fz.uid]);
  ok('透破抜き: a monster effect activated from the hand (傀儡虫) -> offered',offeredTo(0,t),JSON.stringify({len:gameState.chain.length,win:!!gameState.chainWindow}));
  respond(0,t);drive();
  ok('透破抜き: the activation is negated and 傀儡虫 is banished; the target stays mine',pz(pu)==='banish'&&pz(fz)==='mz'&&pp(fz)===0,JSON.stringify({pu:pz(pu),fz:pz(fz),p:pp(fz)}));
  audit('透破抜き 1'); }
{ fresh();foeTurn();const t=setCard(TOH,0),cy=mk('サイクロン',1),tg=setCard('ブラック・ホール',0);
  gameState.players[0].sz=[t,tg];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[tg.uid]);
  ok('透破抜き negative: a Spell activation is not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== 王家の呪い ===== */
{ fresh();foeTurn();const t=setCard(OUR,0),cy=mk('サイクロン',1),tg=setCard('ブラック・ホール',0);
  gameState.players[0].sz=[t,tg];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[tg.uid]);
  ok('王家の呪い: サイクロン targeting one Spell/Trap -> offered',offeredTo(0,t),'');
  respond(0,t);drive();
  ok('王家の呪い: サイクロン negated and destroyed, my set card survives',pz(cy)==='grave'&&pz(tg)==='sz',JSON.stringify({cy:pz(cy),tg:pz(tg)}));
  audit('王家の呪い 1'); }
{ fresh();foeTurn();const t=setCard(OUR,0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[mon('ワイト',0)];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('王家の呪い negative: ブラック・ホール (no Spell/Trap target) is not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== 六尺瓊勾玉 ===== */
{ fresh();foeTurn();const t=setCard(MAG,0),six=mon('六武衆－ザンジ',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[six];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('六尺瓊勾玉: a destroying Spell (ブラック・ホール) with a 六武衆 on my field -> offered',offeredTo(0,t),'');
  respond(0,t);drive();
  ok('六尺瓊勾玉: ブラック・ホール negated and destroyed, my 六武衆 survives',pz(bh)==='grave'&&pz(six)==='mz',JSON.stringify({bh:pz(bh),six:pz(six)}));
  audit('六尺瓊勾玉 1'); }
{ fresh();foeTurn();const t=setCard(MAG,0),w=mon('ワイト',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('六尺瓊勾玉 negative: no 六武衆 on my field -> not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== エンペラー・オーダー ===== */
{ fresh();foeTurn();const t=setCard(EMP,0),mm=mk('ものマネ幻想師',1),tg=mon('青眼の白龍',0);
  gameState.players[0].sz=[t];gameState.players[0].mz=[tg];gameState.players[1].hand=[mm];baselineA();
  const dk1=gameState.players[1].deck.length;
  doNormalSummon(0,'atk');
  for(let i=0;i<20&&typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE&&!gameState.chain.length;i++){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length){PREFER=[tg.uid];eventPickV2(0);for(let j=0;j<10&&pc();j++)pick();PREFER=[];break;}eventSkipGroupV2();}
  ok('エンペラー・オーダー: the opponent Normal Summon trigger effect (ものマネ幻想師) -> offered',offeredTo(0,t),JSON.stringify({len:gameState.chain.length,win:!!gameState.chainWindow}));
  respond(0,t);drive();
  ok('エンペラー・オーダー: the effect is negated and its owner drew 1 card',gameState.players[1].deck.length===dk1-1,JSON.stringify({d:dk1-gameState.players[1].deck.length}));
  audit('エンペラー 1'); }

{ fresh();foeTurn();const t=setCard(EMP,0),cy=mk('サイクロン',1),tg=setCard('ブラック・ホール',0);
  gameState.players[0].sz=[t,tg];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[tg.uid]);
  ok('エンペラー・オーダー negative: a Spell activation is not offered',offeredTo(0,t)===false,'');drive(); }

console.log('U355 done');
`);

/* S03-U368: 大火葬, アヌビスの裁き, ギブ&テイク.
   Real DUEL chains (the opponent starts the chain and the Trap answers from the Spell & Trap Zone) and a Trap that gives a monster to the opponent, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3680001;
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



const CRE='大火葬',ANU='アヌビスの裁き',GIV='ギブ&テイク';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const h=findCardByUid(c.uid); if(!h) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,h.zone,h.index);for(let i=0;i<10&&pc();i++){const q=pc();if(q.min===0)break;pick();}PREFER=[];return true;}
function driveToOptional(){for(let i=0;i<400;i++){
  if(pc()){const q=pc();if(q.min===0)return 'choice';pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function foeTurn(){gameState.activePlayer=1;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}

/* ===== 大火葬 ===== */
{ fresh();foeTurn();const t=setCard(CRE,0),rv=mk('死者蘇生',1),gm=mk('ワイト',0),gf=mk('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].grave=[gm];gameState.players[1].grave=[gf];gameState.players[1].hand=[rv];baselineA();
  foeCast('死者蘇生',[gm.uid]);
  ok('大火葬: the opponent\'s 死者蘇生 targeting a Graveyard monster -> offered',offeredTo(0,t),JSON.stringify({len:gameState.chain.length}));
  respond(0,t);drive();
  ok('大火葬: every monster in both Graveyards banished; the revival finds no target',pz(gm)==='banish'&&pz(gf)==='banish'&&gameState.players[1].mz.length===0&&gameState.players[0].mz.length===0,JSON.stringify({gm:pz(gm),gf:pz(gf),m1:gameState.players[1].mz.length}));
  audit('大火葬 1'); }
{ fresh();foeTurn();const t=setCard(CRE,0),cy=mk('サイクロン',1),tg=setCard('ブラック・ホール',0);
  gameState.players[0].sz=[t,tg];gameState.players[0].grave=[mk('ワイト',0)];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[tg.uid]);
  ok('大火葬 negative: a card that targets no Graveyard monster is not answered',offeredTo(0,t)===false,'');drive(); }

/* ===== アヌビスの裁き ===== */
{ fresh();foeTurn();const t=setCard(ANU,0),hc=mk('ワイト',0),st=setCard('ブラック・ホール',0),ts=mk('大嵐',1),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[t,st];gameState.players[0].hand=[hc];gameState.players[1].hand=[ts];gameState.players[1].mz=[f];baselineA();
  foeCast('大嵐');
  ok('アヌビスの裁き: the opponent\'s 大嵐 (destroys Spell / Trap cards) -> offered',offeredTo(0,t),'');
  const l1=lp(1);respond(0,t,[hc.uid]);driveToOptional();
  const q=pc();
  ok('アヌビスの裁き: after the negation an optional choice of an opposing monster is open',!!q&&q.min===0,JSON.stringify(q&&{min:q.min,n:q.candidates.length}));
  if(q){const c=q.candidates.find(x=>x.uid===f.uid)||q.candidates[0];answerChoiceV49([c.key]);}
  drive();
  ok('アヌビスの裁き: 大嵐 negated and destroyed (my set card survives), the hand card discarded',pz(ts)==='grave'&&pz(st)==='sz'&&pz(hc)==='grave',JSON.stringify({ts:pz(ts),st:pz(st),hc:pz(hc)}));
  ok('アヌビスの裁き: 青眼の白龍 destroyed and 3000 damage to the opponent',pz(f)==='grave'&&lp(1)===l1-3000,JSON.stringify({f:pz(f),loss:l1-lp(1)}));
  audit('アヌビス 1'); }
{ fresh();foeTurn();const t=setCard(ANU,0),hc=mk('ワイト',0),ts=mk('大嵐',1),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].hand=[hc];gameState.players[1].hand=[ts];gameState.players[1].mz=[f];baselineA();
  foeCast('大嵐');respond(0,t,[hc.uid]);driveToOptional();
  const q=pc();if(q)answerChoiceV49([]);drive();
  ok('アヌビスの裁き: the second half is optional - declining leaves 青眼 alone',pz(ts)==='grave'&&pz(f)==='mz',JSON.stringify({ts:pz(ts),f:pz(f)})); }
{ fresh();foeTurn();const t=setCard(ANU,0),hc=mk('ワイト',0),rv=mk('死者蘇生',1),g=mk('ワイト',1);
  gameState.players[0].sz=[t];gameState.players[0].hand=[hc];gameState.players[1].hand=[rv];gameState.players[1].grave=[g];baselineA();
  foeCast('死者蘇生',[g.uid]);
  ok('アヌビスの裁き negative: a Spell that does not destroy Spell / Trap cards is not answered',offeredTo(0,t)===false,'');drive(); }

/* ===== ギブ&テイク ===== */
{ fresh();const t=setCard(GIV,0),bm=mk('ブラック・マジシャン',0),w=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].grave=[bm];gameState.players[0].mz=[w];baselineA();
  PREFER=[bm.uid,w.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('ギブ&テイク: ブラック・マジシャン (Level 7) is on the opponent field in Defense Position',pz(bm)==='mz'&&pp(bm)===1&&C(bm).pos==='def',JSON.stringify({z:pz(bm),p:pp(bm)}));
  ok('ギブ&テイク: ワイト Level 1 + 7 = 8 until the End of the turn',curLV(C(w))===8,String(curLV(C(w))));
  audit('ギブ&テイク 1');
  endTurn();
  ok('ギブ&テイク: the Level boost ends',curLV(C(w))===1,String(curLV(C(w)))); }
{ fresh();const t=setCard(GIV,0),w=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[w];baselineA();
  PREFER=[w.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('ギブ&テイク negative: no monster in my Graveyard -> cannot activate',pz(t)==='sz',pz(t)); }

console.log('U368 done');
`);

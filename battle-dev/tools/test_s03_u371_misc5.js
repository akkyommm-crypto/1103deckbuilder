/* S03-U371: 魔知ガエル, 赤蟻アスカトル, 神竜アクアバザル, 英知の代行者 マーキュリー.
   Real DUEL paths (a name override and a forced attack target, a battle-destroyed revival that is negated and buried, a release-cost recycle, a delayed draw), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3710001;
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



const TOA='魔知ガエル',ANT='赤蟻アスカトル',AQU='神竜アクアバザル',MER='英知の代行者 マーキュリー';
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== 魔知ガエル ===== */
{ fresh();const t=mon(TOA,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t,w];gameState.players[1].mz=[f];baselineA();
  ok('魔知ガエル: face-up -> its name is 「デスガエル」',currentNameV17(C(t))==='デスガエル',String(currentNameV17(C(t))));
  toOppBattle();const l0=lp(0);foeAttack(f,w);
  ok('魔知ガエル: the opponent cannot target the other monster (ワイト untouched)',pz(w)==='mz'&&lp(0)===l0,JSON.stringify({w:pz(w),loss:l0-lp(0)}));
  audit('魔知ガエル 1'); }
{ fresh();const t=mon(TOA,0),dg=mk('悪魔ガエル',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t];gameState.players[0].deck=[dg].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[dg.uid];foeAttack(f,t);PREFER=[];
  ok('魔知ガエル: destroyed -> 悪魔ガエル added from the Deck to my hand',pz(t)==='grave'&&pz(dg)==='hand',JSON.stringify({t:pz(t),dg:pz(dg)}));
  audit('魔知ガエル 2'); }
{ fresh();const t=mon(TOA,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,t);
  ok('魔知ガエル negative: no other 「ガエル」 -> only destroyed',pz(t)==='grave',pz(t)); }

/* ===== 赤蟻アスカトル ===== */
{ fresh();const a=mon(ANT,0),g=mk('3万年の白亀',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[a];gameState.players[0].grave=[g];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,a);
  ok('アスカトル: destroyed by battle -> 3万年の白亀 (Level 5) Special Summoned, its effect negated',pz(a)==='grave'&&pz(g)==='mz'&&effectNegated(C(g)),JSON.stringify({a:pz(a),g:pz(g)}));
  phase('end');drive();
  ok('アスカトル: sent to the Graveyard at the End Phase',pz(g)==='grave',pz(g));
  audit('アスカトル 1'); }
{ fresh();const a=mon(ANT,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[a];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,a);
  ok('アスカトル negative: no Level 5 monster in the Graveyard -> only destroyed',pz(a)==='grave',pz(a)); }

/* ===== 神竜アクアバザル ===== */
{ fresh();const q=mon(AQU,0),s=mon('アクア・スネーク',0),sp=mk('D－フォーメーション',0);gameState.players[0].mz=[q,s];gameState.players[0].grave=[sp];baselineA();
  ok('アクアバザル: another WATER monster and a Continuous Spell in the Graveyard -> can activate',canZ(q),'');
  actC(q,[s.uid,sp.uid]);
  ok('アクアバザル: アクア・スネーク released; D－フォーメーション is on top of my Deck',pz(s)==='grave'&&pz(sp)==='deck'&&API.deckTop(0,1)[0].card.uid===sp.uid,JSON.stringify({s:pz(s),sp:pz(sp)}));
  ok('アクアバザル: once per turn',!canZ(q),'');
  audit('アクアバザル 1'); }
{ fresh();const q=mon(AQU,0),sp=mk('D－フォーメーション',0);gameState.players[0].mz=[q];gameState.players[0].grave=[sp];baselineA();
  ok('アクアバザル negative: no other WATER monster -> cannot activate',!canZ(q),''); }

/* ===== 英知の代行者 マーキュリー ===== */
{ fresh();const m=mon(MER,0);gameState.players[0].mz=[m];baselineA();
  const d0=gameState.players[0].deck.length;
  endTurn();endTurn();
  ok('マーキュリー: the opponent End Phase with my hand empty -> at my Standby Phase I drew 1 extra (2 cards in hand: draw + effect)',gameState.players[0].hand.length===2&&gameState.players[0].deck.length===d0-2,JSON.stringify({h:gameState.players[0].hand.length,d:d0-gameState.players[0].deck.length}));
  audit('マーキュリー 1'); }
{ fresh();const m=mon(MER,0),h=mk('ワイト',0);gameState.players[0].mz=[m];gameState.players[0].hand=[h];baselineA();
  const d0=gameState.players[0].deck.length;
  endTurn();endTurn();
  ok('マーキュリー negative: a card in hand at their End Phase -> only the normal draw',gameState.players[0].deck.length===d0-1,JSON.stringify({d:d0-gameState.players[0].deck.length})); }

console.log('U371 done');
`);

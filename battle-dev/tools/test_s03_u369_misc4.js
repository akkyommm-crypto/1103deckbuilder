/* S03-U369: 地獄詩人ヘルポエマー, 闇晦ましの城, レベル調整, リチュアルバスター.
   Real DUEL paths (a Graveyard trigger at the opponent's Battle Phase End, a Flip / Standby boost, a conditionless revival with negation, a lingering Spell / Trap lock after a Ritual Summon), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3690001;
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



const POE='地獄詩人ヘルポエマー',CAS='闇晦ましの城',LVA='レベル調整',RIB='リチュアルバスター';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function foeCan(name,idx1){const r=strictScriptLegalityV2(name,1,'hand',idx1,{});return !!(r&&r.ok);}

/* ===== 地獄詩人ヘルポエマー ===== */
{ fresh();const p=mon(POE,0),f=mon('青眼の白龍',1),h1=mk('ワイト',1),h2=mk('ワイト',1);gameState.players[0].mz=[p];gameState.players[1].mz=[f];gameState.players[1].hand=[h1,h2];baselineA();
  toOppBattle();foeAttack(f,p);const h0=gameState.players[1].hand.length;
  ok('ヘルポエマー: destroyed by battle on the opponent turn (still in the Battle Phase); the opponent hand is untouched so far',pz(p)==='grave'&&h0>=2,JSON.stringify({p:pz(p),h:h0}));
  phase('main2');drive();
  ok('ヘルポエマー: at the end of the opponent Battle Phase one random card of their hand is discarded',gameState.players[1].hand.length===h0-1,JSON.stringify({h0,h:gameState.players[1].hand.length}));
  audit('ヘルポエマー 1'); }
{ fresh();const g=mk(POE,0),rv=mk('死者蘇生',0);gameState.players[0].grave=[g];gameState.players[0].hand=[rv];baselineA();
  cast(0,'死者蘇生',[g.uid]);
  ok('ヘルポエマー: cannot be Special Summoned from the Graveyard (死者蘇生 does not revive it)',pz(g)==='grave',pz(g)); }
{ fresh();const p=mon(POE,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[p];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,p);phase('main2');drive();
  ok('ヘルポエマー negative: the opponent hand is empty -> nothing happens',gameState.players[1].hand.length===0,String(gameState.players[1].hand.length)); }

/* ===== 闇晦ましの城 ===== */
{ fresh();const c=mon(CAS,0),u=mon('さまよえる亡者',0),fu=mon('さまよえる亡者',1),f=mon('ワイト',1);c.face='down';c.pos='def';
  gameState.players[0].mz=[c,u];gameState.players[1].mz=[fu,f];baselineA();
  toOppBattle();foeAttack(f,c);
  ok('闇晦ましの城: flipped by an attack -> every face-up Undead monster on the field +200 (800 -> 1000, both sides)',C(c).face==='up'&&curATK(C(u))===1000&&curATK(C(fu))===1000,JSON.stringify({face:C(c).face,u:curATK(C(u)),fu:curATK(C(fu))}));
  endTurn();
  ok('闇晦ましの城: my next Standby Phase -> another +200 (1200)',curATK(C(u))===1200&&curATK(C(fu))===1200,JSON.stringify({u:curATK(C(u)),fu:curATK(C(fu))}));
  audit('闇晦まし 1'); }

/* ===== レベル調整 ===== */
{ fresh();const sp=mk(LVA,0),lv=mk('アームド・ドラゴン LV3',0),f=mon('ワイト',1);gameState.players[0].hand=[sp];gameState.players[0].grave=[lv];gameState.players[1].mz=[f];baselineA();
  const d1=gameState.players[1].deck.length;cast(0,LVA,[lv.uid]);
  ok('レベル調整: the opponent drew 2 cards',gameState.players[1].deck.length===d1-2,String(d1-gameState.players[1].deck.length));
  ok('レベル調整: アームド・ドラゴン LV3 Special Summoned from the Graveyard, its effect negated',pz(lv)==='mz'&&pp(lv)===0&&effectNegated(C(lv)),JSON.stringify({z:pz(lv),n:effectNegated(C(lv))}));
  phase('battle');const l1=lp(1);atkTarget(0,lv,f);
  ok('レベル調整: it cannot attack this turn',pz(f)==='mz'&&lp(1)===l1,JSON.stringify({f:pz(f)}));
  audit('レベル調整 1'); }
{ fresh();const sp=mk(LVA,0);gameState.players[0].hand=[sp];baselineA();
  const r=strictScriptLegalityV2(LVA,0,'hand',0,{});
  ok('レベル調整 negative: no 「LV」 monster in the Graveyard -> not activatable',!(r&&r.ok),JSON.stringify(r)); }

/* ===== リチュアルバスター ===== */
{ fresh();const t=setCard(RIB,0),sp=mk('踊りによる誘発',0),rm=mk('ダンシング・ソルジャー',0),mat=mon('青眼の白龍',0),cy=mk('サイクロン',1);
  gameState.players[0].sz=[t];gameState.players[0].hand=[sp,rm];gameState.players[0].mz=[mat];gameState.players[1].hand=[cy];baselineA();
  ok('リチュアルバスター: set, not yet used',pz(t)==='sz',pz(t));
  PREFER=[rm.uid,mat.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('リチュアルバスター: the Ritual Summon succeeded and the Trap was used',pz(rm)==='mz'&&pz(t)==='grave',JSON.stringify({rm:pz(rm),t:pz(t)}));
  endTurn();
  ok('リチュアルバスター: during the opponent turn it cannot activate a Spell Card',foeCan('サイクロン',0)===false,'');
  audit('リチュアルバスター 1'); }

console.log('U369 done');
`);

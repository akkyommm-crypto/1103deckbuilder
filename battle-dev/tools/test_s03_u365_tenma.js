/* S03-U365: 天魔神 ノーレラス, 天魔神 エンライズ, 怨念の魂 業火.
   Real DUEL paths (banish-from-Graveyard procedures, a wipe for 1000 LP, a banish ignition, a hand procedure with a self-burn, a Standby token), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3650001;
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



const NOR='天魔神 ノーレラス',ENR='天魔神 エンライズ',GOU='怨念の魂 業火';
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
const LA=['もけもけ','ウィング・エッグ・エルフ','ウェザー・コントロール'],DF=['B・プラント','D・ナポレオン','なぞの手','インプ'];
function gyAngels(n){return LA.slice(0,n).map(x=>mk(x,0));}
function gyFiends(n){return DF.slice(0,n).map(x=>mk(x,0));}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}

/* ===== 天魔神 ノーレラス ===== */
{ fresh();const n=mk(NOR,0),a=gyAngels(1),d=gyFiends(3);gameState.players[0].hand=[n];gameState.players[0].grave=a.concat(d);baselineA();
  ok('ノーレラス: 1 LIGHT Angel + 3 DARK Fiends in the Graveyard -> the procedure is legal',procOk(NOR,0)===true,'');
  procRun(NOR,0);
  ok('ノーレラス: Special Summoned, the 4 monsters banished',pz(n)==='mz'&&a.concat(d).every(c=>pz(c)==='banish'),JSON.stringify({n:pz(n),b:a.concat(d).map(pz)}));
  audit('ノーレラス 1'); }
{ fresh();const n=mk(NOR,0),a=gyAngels(1),d=gyFiends(2);gameState.players[0].hand=[n];gameState.players[0].grave=a.concat(d);baselineA();
  ok('ノーレラス negative: only 2 Fiends -> illegal',procOk(NOR,0)===false,''); }
{ fresh();const n=mon(NOR,0),h1=mk('ワイト',0),m1=mon('ワイト',0),f1=mon('青眼の白龍',1),h2=mk('ワイト',1),st=mk('ブラック・ホール',1);st.face='up';
  gameState.players[0].mz=[n,m1];gameState.players[0].hand=[h1];gameState.players[1].mz=[f1];gameState.players[1].hand=[h2];gameState.players[1].sz=[st];baselineA();
  const d0=gameState.players[0].deck.length;actC(n);
  ok('ノーレラス: 1000 LP paid; both hands and fields sent to the Graveyard (itself included)',lp(0)===7000&&[n,m1,h1,f1,h2,st].every(c=>pz(c)==='grave'),JSON.stringify({lp:lp(0),z:[n,m1,h1,f1,h2,st].map(pz)}));
  ok('ノーレラス: I drew 1 card from my Deck',gameState.players[0].deck.length===d0-1&&gameState.players[0].hand.length===1,JSON.stringify({d:d0-gameState.players[0].deck.length,h:gameState.players[0].hand.length}));
  audit('ノーレラス 2'); }
{ fresh();const n=mon(NOR,0);gameState.players[0].mz=[n];gameState.players[0].lp=900;baselineA();
  ok('ノーレラス negative: less than 1000 LP -> cannot activate',!canZ(n),''); }

/* ===== 天魔神 エンライズ ===== */
{ fresh();const e=mk(ENR,0),a=gyAngels(3),d=gyFiends(1);gameState.players[0].hand=[e];gameState.players[0].grave=a.concat(d);baselineA();
  ok('エンライズ: 3 LIGHT Angels + 1 DARK Fiend in the Graveyard -> the procedure is legal',procOk(ENR,0)===true,'');
  procRun(ENR,0);
  ok('エンライズ: Special Summoned, the 4 monsters banished',pz(e)==='mz'&&a.concat(d).every(c=>pz(c)==='banish'),JSON.stringify({e:pz(e)}));
  audit('エンライズ 1'); }
{ fresh();const e=mk(ENR,0),a=gyAngels(2),d=gyFiends(2);gameState.players[0].hand=[e];gameState.players[0].grave=a.concat(d);baselineA();
  ok('エンライズ negative: only 2 Angels -> illegal',procOk(ENR,0)===false,''); }
{ fresh();const e=mon(ENR,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[e];gameState.players[1].mz=[f];baselineA();
  actC(e,[f.uid]);
  ok('エンライズ: the opposing monster is banished',pz(f)==='banish',pz(f));
  ok('エンライズ: once per turn',!canZ(e),'');
  phase('battle');const l1=lp(1);atkTarget(0,e,'direct');
  ok('エンライズ: it cannot attack this turn',lp(1)===l1,String(l1-lp(1)));
  audit('エンライズ 2'); }
{ fresh();const e=mon(ENR,0);gameState.players[0].mz=[e];baselineA();
  ok('エンライズ negative: no other face-up monster -> cannot activate',!canZ(e),''); }

/* ===== 怨念の魂 業火 ===== */
{ fresh();const g=mk(GOU,0),b=mon('E・HERO バーストレディ',0);gameState.players[0].hand=[g];gameState.players[0].mz=[b];baselineA();
  ok('業火: a FIRE monster on my field -> the hand procedure is legal',procOk(GOU,0)===true,'');
  procRun(GOU,0);
  ok('業火: Special Summoned; the other FIRE monster (バーストレディ) was destroyed (second effect)',pz(g)==='mz'&&pz(b)==='grave',JSON.stringify({g:pz(g),b:pz(b)}));
  audit('業火 1'); }
{ fresh();const g=mk(GOU,0),w=mon('ワイト',0);gameState.players[0].hand=[g];gameState.players[0].mz=[w];baselineA();
  ok('業火 negative: no FIRE monster -> illegal',procOk(GOU,0)===false,''); }
{ fresh();const g=mon(GOU,0),b=mon('E・HERO バーストレディ',0);gameState.players[0].mz=[g,b];baselineA();
  ok('業火: another FIRE monster to release -> can activate',canZ(g),'');
  actC(g,[b.uid]);
  ok('業火: バーストレディ released; ATK 2200 + 500 = 2700 until the End Phase',pz(b)==='grave'&&curATK(C(g))===2700,JSON.stringify({b:pz(b),a:curATK(C(g))}));
  endTurn();
  ok('業火: the bonus ends',curATK(C(g))===2200,String(curATK(C(g)))); }
{ fresh();const g=mon(GOU,0);gameState.players[0].mz=[g];baselineA();
  endTurn();endTurn();
  const tk=gameState.players[0].mz.filter(c=>c&&dbOf(c).n==='火の玉トークン');
  ok('業火: my Standby Phase -> a 火の玉トークン in Defense Position',tk.length===1&&tk[0].pos==='def',JSON.stringify({n:tk.length,pos:tk[0]&&tk[0].pos}));
  audit('業火 2'); }

console.log('U365 done');
`);

/* S03-U361: エーリアン・マザー, 異界空間－Aゾーン, エーリアン・ブレイン, 昇霊術師 ジョウゲン.
   Real DUEL paths (A Counter battles, a battle-end revival, a control steal after a battle destruction, a Special Summon purge and lock), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3610001;
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



const MOT='エーリアン・マザー',AZO='異界空間－Aゾーン',BRA='エーリアン・ブレイン',JOU='昇霊術師 ジョウゲン';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== エーリアン・マザー ===== */
{ fresh();const m=mon(MOT,0),w=mon('ワイト',1);w.counters={'A':1};gameState.players[0].mz=[m];gameState.players[1].mz=[w];baselineA();
  phase('battle');atkTarget(0,m,w);
  ok('マザー: destroyed the A Counter monster (ワイト) in battle',pz(w)==='grave'||pz(w)==='mz',pz(w));
  phase('main2');drive();
  ok('マザー: at the end of the Battle Phase the destroyed monster is Special Summoned to my field',pz(w)==='mz'&&pp(w)===0,JSON.stringify({w:pz(w),p:pp(w)}));
  audit('マザー 1');
  endTurn();
  const f=mon('青眼の白龍',1);gameState.players[1].mz.push(f);
  phase('battle');foeAttack(f,m);
  ok('マザー: Mother leaves the field -> the revived monster is destroyed too',pz(m)==='grave'&&pz(w)==='grave',JSON.stringify({m:pz(m),w:pz(w)})); }
{ fresh();const m=mon(MOT,0),w=mon('ワイト',1);gameState.players[0].mz=[m];gameState.players[1].mz=[w];baselineA();
  phase('battle');atkTarget(0,m,w);phase('main2');drive();
  ok('マザー negative: a monster without an A Counter is not revived',pz(w)==='grave',pz(w)); }

/* ===== 異界空間－Aゾーン ===== */
{ fresh();const z=mk(AZO,0),a=mon('エーリアン・ソルジャー',0),f=mon('サファイアドラゴン',1);gameState.players[0].hand=[z];gameState.players[0].mz=[a];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);drive();
  ok('Aゾーン: activated and stays on the field',pz(z)==='field',pz(z));
  phase('battle');const l1=lp(1);atkTarget(0,a,f);
  ok('Aゾーン: エーリアン・ソルジャー (1900) vs サファイアドラゴン (1900 -> 1600 in the calculation): the opponent monster is destroyed, mine survives, 300 damage',pz(f)==='grave'&&pz(a)==='mz'&&lp(1)===l1-300,JSON.stringify({f:pz(f),a:pz(a),loss:l1-lp(1)}));
  audit('Aゾーン 1'); }
{ fresh();const a=mon('エーリアン・ソルジャー',0),f=mon('サファイアドラゴン',1);gameState.players[0].mz=[a];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,a,f);
  ok('Aゾーン control: without the Spell it is a 1900 vs 1900 tie (both destroyed)',pz(f)==='grave'&&pz(a)==='grave',JSON.stringify({f:pz(f),a:pz(a)})); }

/* ===== エーリアン・ブレイン ===== */
{ fresh();const t=setCard(BRA,0),r=mon('C・スネーク',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,r);
  ok('ブレイン: my Reptile destroyed by 青眼 -> the attacker is mine and treated as a Reptile',pz(r)==='grave'&&pz(f)==='mz'&&pp(f)===0&&currentRaceV17(C(f))==='爬虫類',JSON.stringify({r:pz(r),f:pz(f),p:pp(f),race:C(f)&&currentRaceV17(C(f))}));
  audit('ブレイン 1'); }
{ fresh();const t=setCard(BRA,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,w);
  ok('ブレイン negative: a non-Reptile destroyed -> not triggered',pp(f)===1&&pz(t)==='sz',JSON.stringify({p:pp(f),t:pz(t)})); }

/* ===== 昇霊術師 ジョウゲン ===== */
{ fresh();const j=mon(JOU,0),h=mk('ワイト',0),a=mon('ワイト',0),b=mon('ワイト',1),c=mon('青眼の白龍',1);a.specialSummoned=true;b.specialSummoned=true;
  gameState.players[0].mz=[j,a];gameState.players[0].hand=[h];gameState.players[1].mz=[b,c];baselineA();
  ok('ジョウゲン: a card in hand and Special Summoned monsters on the field -> can activate',canZ(j),'');
  actC(j);
  ok('ジョウゲン: the hand card discarded; every Special Summoned monster destroyed (both fields), the Normal Summoned ones stay',pz(h)==='grave'&&pz(a)==='grave'&&pz(b)==='grave'&&pz(c)==='mz'&&pz(j)==='mz',JSON.stringify({h:pz(h),a:pz(a),b:pz(b),c:pz(c),j:pz(j)}));
  audit('ジョウゲン 1'); }
{ fresh();const j=mon(JOU,0),rv=mk('死者蘇生',0),g=mk('ワイト',0);gameState.players[0].mz=[j];gameState.players[0].hand=[rv];gameState.players[0].grave=[g];baselineA();
  cast(0,'死者蘇生',[g.uid]);
  ok('ジョウゲン: while it is face-up neither player can Special Summon (死者蘇生 does not revive)',pz(g)==='grave',pz(g)); }
{ fresh();const j=mon(JOU,0),h=mk('ワイト',0);gameState.players[0].mz=[j];gameState.players[0].hand=[h];baselineA();
  ok('ジョウゲン negative: no Special Summoned monster on the field -> cannot activate',!canZ(j),''); }

console.log('U361 done');
`);

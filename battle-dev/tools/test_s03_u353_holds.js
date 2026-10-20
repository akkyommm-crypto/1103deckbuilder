/* S03-U353: 平和の使者, 闇の呪縛, 拷問車輪.
   Real DUEL paths (a Continuous Spell and two Continuous Traps: attack locks, a Standby upkeep, a Standby burn, link destruction), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3530001;
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



const YAM='闇の呪縛',WHE='拷問車輪',PEA='平和の使者';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function activateSet(i){duelActivateFromZone(0,'sz',i);drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}

/* ===== 闇の呪縛 ===== */
{ fresh();const t=setCard(YAM,0),f=mon('青眼の白龍',1),w=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  PREFER=[f.uid];activateSet(0);PREFER=[];
  ok('闇の呪縛: the target loses 700 ATK (3000 -> 2300)',curATK(C(f))===2300&&pz(t)==='sz',JSON.stringify({a:curATK(C(f)),t:pz(t)}));
  audit('呪縛 1');
  endTurn();
  ok('闇の呪縛: the bound monster cannot change its position',getLegalZoneActions(1,'mz',idx(f)).map(x=>x.id).indexOf('position')<0,JSON.stringify(getLegalZoneActions(1,'mz',idx(f)).map(x=>x.id)));
  phase('battle');const l0=lp(0);foeAttack(f,w);
  ok('闇の呪縛: the bound monster cannot attack',z(w)==='mz'&&lp(0)===l0,JSON.stringify({w:z(w),loss:l0-lp(0)})); }
{ fresh();const t=setCard(YAM,0),f=mon('青眼の白龍',1),bh=mk('ブラック・ホール',0);gameState.players[0].sz=[t];gameState.players[0].hand=[bh];gameState.players[1].mz=[f];baselineA();
  PREFER=[f.uid];activateSet(0);PREFER=[];
  cast(0,'ブラック・ホール');
  ok('闇の呪縛: the monster leaves the field -> the trap is destroyed',z(f)==='grave'&&pz(t)==='grave',JSON.stringify({f:z(f),t:pz(t)})); }
{ fresh();const t=setCard(YAM,0),f=mon('青眼の白龍',1),cy=mk('サイクロン',0);gameState.players[0].sz=[t];gameState.players[0].hand=[cy];gameState.players[1].mz=[f];baselineA();
  PREFER=[f.uid];activateSet(0);PREFER=[];
  cast(0,'サイクロン',[t.uid]);
  ok('闇の呪縛 control: the trap destroyed -> the monster is back to 3000 ATK',pz(t)==='grave'&&curATK(C(f))===3000,JSON.stringify({t:pz(t),a:curATK(C(f))})); }

/* ===== 拷問車輪 ===== */
{ fresh();const t=setCard(WHE,0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[1].mz=[f];baselineA();
  PREFER=[f.uid];activateSet(0);PREFER=[];
  ok('拷問車輪: the target keeps its ATK (no drop)',curATK(C(f))===3000&&pz(t)==='sz',JSON.stringify({a:curATK(C(f)),t:pz(t)}));
  endTurn();ok('拷問車輪: the opponent Standby Phase deals nothing to them',lp(1)===8000,String(lp(1)));
  phase('battle');const l0=lp(0);foeAttack(f,'direct');
  ok('拷問車輪: the target cannot attack',lp(0)===l0,String(l0-lp(0)));
  endTurn();
  ok('拷問車輪: my Standby Phase -> 500 damage to the opponent',lp(1)===7500,String(lp(1)));
  audit('車輪 1'); }
{ fresh();const t=setCard(WHE,0),f=mon('青眼の白龍',1),bh=mk('ブラック・ホール',0);gameState.players[0].sz=[t];gameState.players[0].hand=[bh];gameState.players[1].mz=[f];baselineA();
  PREFER=[f.uid];activateSet(0);PREFER=[];
  cast(0,'ブラック・ホール');
  ok('拷問車輪: the target leaves -> the trap is destroyed, no later burn',pz(t)==='grave',pz(t));
  endTurn();endTurn();ok('拷問車輪: ... and no 500 damage at my Standby Phase',lp(1)===8000,String(lp(1))); }

/* ===== 平和の使者 ===== */
{ fresh();const p=mk(PEA,0),big=mon('青眼の白龍',0),small=mon('ワイト',0),f=mon('ワイト',1);gameState.players[0].hand=[p];gameState.players[0].mz=[big,small];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);drive();
  ok('平和の使者: activated and stays on the field',pz(p)==='sz',pz(p));
  phase('battle');const l1=lp(1);atkTarget(0,big,f);
  ok('平和の使者: a monster with ATK 1500 or more cannot attack',z(f)==='mz'&&lp(1)===l1,JSON.stringify({f:z(f),loss:l1-lp(1)}));
  atkTarget(0,small,f);
  ok('平和の使者 control: ワイト (ATK 300) can attack (a tie: both destroyed)',z(f)==='grave'||z(small)==='grave'||lp(1)<l1,JSON.stringify({f:z(f),s:z(small)}));
  audit('平和 1'); }
{ fresh();const p=mk(PEA,0);p.face='up';gameState.players[0].sz=[p];baselineA();
  endTurn();ok('平和の使者: the opponent Standby Phase costs nothing',lp(0)===8000,String(lp(0)));
  endTurn();ok('平和の使者: my Standby Phase -> 100 LP paid',lp(0)===7900&&pz(p)==='sz',JSON.stringify({lp:lp(0),p:pz(p)})); }
{ fresh();const p=mk(PEA,0);p.face='up';gameState.players[0].sz=[p];gameState.players[0].lp=50;baselineA();
  endTurn();endTurn();
  ok('平和の使者: cannot pay 100 -> destroyed',pz(p)==='grave',pz(p)); }

console.log('U353 done');
`);

/* S03-U366: ファイヤー・ウォール, 吠え猛る大地, 援護射撃, 奇跡の軌跡.
   Real DUEL paths (a direct-attack negation with an upkeep, a Beast pierce and weakening, a Damage Step ATK boost, a lingering double-attack trap), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3660001;
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



const FWA='ファイヤー・ウォール',ROA='吠え猛る大地',SUP='援護射撃',MIR='奇跡の軌跡';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function upCard(n,p){const c=mk(n,p,'up');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== ファイヤー・ウォール ===== */
{ fresh();const t=upCard(FWA,0),py=mk('スティング',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[0].grave=[py];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,'direct');
  ok('ファイヤー・ウォール: a direct attack -> the Pyro (スティング) banished, the attack negated (no damage)',pz(py)==='banish'&&lp(0)===l0,JSON.stringify({py:pz(py),loss:l0-lp(0)}));
  audit('ファイヤー・ウォール 1'); }
{ fresh();const t=upCard(FWA,0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,'direct');
  ok('ファイヤー・ウォール negative: no Pyro in the Graveyard -> the direct attack hits (3000)',lp(0)===l0-3000,String(l0-lp(0))); }
{ fresh();const t=upCard(FWA,0);gameState.players[0].sz=[t];baselineA();
  endTurn();ok('ファイヤー・ウォール: the opponent Standby Phase costs nothing',lp(0)===8000,String(lp(0)));
  endTurn();ok('ファイヤー・ウォール: my Standby Phase -> 500 LP paid',lp(0)===7500&&pz(t)==='sz',JSON.stringify({lp:lp(0),t:pz(t)})); }
{ fresh();const t=upCard(FWA,0);gameState.players[0].sz=[t];gameState.players[0].lp=400;baselineA();
  endTurn();endTurn();
  ok('ファイヤー・ウォール: cannot pay 500 -> destroyed',pz(t)==='grave',pz(t)); }

/* ===== 吠え猛る大地 ===== */
{ fresh();const t=upCard(ROA,0),b=mon('イビル・ラット',0),fd=mon('ワイト',1);fd.pos='def';const f2=mon('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[b];gameState.players[1].mz=[fd,f2];baselineA();
  phase('battle');const l1=lp(1);PREFER=[f2.uid];atkTarget(0,b,fd);PREFER=[];
  ok('吠え猛る大地: Beast (750) vs Defense ワイト (DEF 200): destroyed, 550 piercing damage',pz(fd)==='grave'&&lp(1)===l1-550,JSON.stringify({fd:pz(fd),loss:l1-lp(1)}));
  ok('吠え猛る大地: ... and the opposing 青眼 loses 500 ATK / DEF (2500 / 2000)',curATK(C(f2))===2500&&curDEF(C(f2))===2000,JSON.stringify({a:curATK(C(f2)),d:curDEF(C(f2))}));
  audit('吠え猛る大地 1'); }
{ fresh();const t=upCard(ROA,0),b=mon('バーニングソルジャー',0),fd=mon('ワイト',1);fd.pos='def';gameState.players[0].sz=[t];gameState.players[0].mz=[b];gameState.players[1].mz=[fd];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,b,fd);
  ok('吠え猛る大地 control: a non-Beast (バーニングソルジャー) attack gets no piercing damage',pz(fd)==='grave'&&lp(1)===l1,JSON.stringify({fd:pz(fd),loss:l1-lp(1)})); }

/* ===== 援護射撃 ===== */
{ fresh();const t=setCard(SUP,0),a=mon('ワイト',0),b=mon('サファイアドラゴン',0),f=mon('サファイアドラゴン',1);gameState.players[0].sz=[t];gameState.players[0].mz=[a,b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);foeAttack(f,a);
  ok('援護射撃: the attacked ワイト (300) gets サファイアドラゴン\'s 1900 -> 2200 beats 1900: the attacker is destroyed, 300 damage to its controller',pz(f)==='grave'&&pz(a)==='mz'&&lp(1)===l1-300,JSON.stringify({f:pz(f),a:pz(a),loss:l1-lp(1)}));
  audit('援護射撃 1'); }
{ fresh();const a=mon('ワイト',0),b=mon('サファイアドラゴン',0),f=mon('サファイアドラゴン',1);gameState.players[0].mz=[a,b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,a);
  ok('援護射撃 control: without the trap ワイト (300) is destroyed',pz(a)==='grave',pz(a)); }

/* ===== 奇跡の軌跡 ===== */
{ fresh();const t=setCard(MIR,0),m=mon('ワイト',0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].sz=[t];gameState.players[0].mz=[m];gameState.players[1].mz=[f1,f2];baselineA();
  const d1=gameState.players[1].deck.length;PREFER=[m.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('奇跡の軌跡: the opponent drew 1; ワイト ATK 300 + 1000 = 1300',gameState.players[1].deck.length===d1-1&&curATK(C(m))===1300,JSON.stringify({d:d1-gameState.players[1].deck.length,a:curATK(C(m))}));
  phase('battle');const l1=lp(1);atkTarget(0,m,f1);atkTarget(0,m,f2);
  ok('奇跡の軌跡: it attacked twice (both ワイト destroyed) and the opponent took no battle damage',pz(f1)==='grave'&&pz(f2)==='grave'&&lp(1)===l1,JSON.stringify({f1:pz(f1),f2:pz(f2),loss:l1-lp(1)}));
  audit('奇跡の軌跡 1'); }
{ fresh();const m=mon('ワイト',0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f1,f2];baselineA();
  phase('battle');atkTarget(0,m,f1);atkTarget(0,m,f2);
  ok('奇跡の軌跡 control: without the trap only one attack (the second ワイト survives)',pz(f2)==='mz',pz(f2)); }

console.log('U366 done');
`);

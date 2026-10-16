/* S03-U356: 魔鏡導士リフレクト・バウンダー, 魔導アーマー エグゼ, 海底に潜む深海竜, 静寂のサイコウィッチ.
   Real DUEL paths (a reflected attack, Standby upkeep and counters, a leave trigger, a delayed return), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3560001;
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



const BOU='魔鏡導士リフレクト・バウンダー',EXE='魔導アーマー エグゼ',OCE='海底に潜む深海竜',WIT='静寂のサイコウィッチ';
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}

/* ===== 魔鏡導士リフレクト・バウンダー ===== */
{ fresh();const b=mon(BOU,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1),l0=lp(0);foeAttack(f,b);
  ok('リフレクト・バウンダー: attacked in Attack Position -> the attacker\'s ATK (3000) as damage to its controller before damage calculation',lp(1)<=l1-3000,JSON.stringify({loss1:l1-lp(1)}));
  ok('リフレクト・バウンダー: destroyed after the damage calculation',z(b)==='grave',z(b));
  audit('バウンダー 1'); }
{ fresh();const b=mon(BOU,0),f=mon('ワイト',1);b.pos='def';gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);foeAttack(f,b);
  ok('リフレクト・バウンダー negative: in Defense Position -> only the normal 700 (DEF 1000 - ATK 300) battle damage, no reflection, not destroyed',lp(1)===l1-700&&z(b)==='mz',JSON.stringify({loss:l1-lp(1),b:z(b)})); }

/* ===== 魔導アーマー エグゼ ===== */
{ fresh();const e=mon(EXE,0),cs=mk('魔法都市エンディミオン',0);cs.face='up';cs.counters={'魔力':2};gameState.players[0].mz=[e];gameState.players[0].field=cs;baselineA();
  endTurn();
  ok('エグゼ: the opponent Standby Phase -> one 魔力 counter removed (2 -> 1), not destroyed',z(e)==='mz'&&((findCardByUid(cs.uid)||{card:{counters:{}}}).card.counters||{})['魔力']===1,JSON.stringify({e:z(e),c:(C(cs)||{}).counters}));
  endTurn();
  ok('エグゼ: my Standby Phase -> the last counter removed (1 -> 0), still not destroyed',z(e)==='mz'&&!(((findCardByUid(cs.uid)||{card:{}}).card.counters||{})['魔力']>0),JSON.stringify({e:z(e),c:(C(cs)||{}).counters}));
  endTurn();
  ok('エグゼ: no counter left at the next Standby Phase -> destroyed',z(e)==='grave',z(e));
  audit('エグゼ 1'); }
{ fresh();const e=mk(EXE,0),f=mon('ワイト',1);gameState.players[0].hand=[e];gameState.players[1].mz=[f];baselineA();
  doNormalSummon(0,'atk');drive();
  phase('battle');const l1=lp(1);atkTarget(0,e,f);
  ok('エグゼ: cannot attack the turn it was summoned (ワイト untouched)',z(e)==='mz'&&z(f)==='mz'&&lp(1)===l1,JSON.stringify({e:z(e),f:z(f),loss:l1-lp(1)})); }

/* ===== 海底に潜む深海竜 ===== */
{ fresh();const d=mon(OCE,0),fish=mon('ホワイト・ドルフィン',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[d,fish];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  ok('深海竜: a counter at the opponent Standby Phase',API.countCounter({p:0,zone:'mz',index:idx(d)},'オーシャン')===1,String(API.countCounter({p:0,zone:'mz',index:idx(d)},'オーシャン')));
  foeAttack(f,d);
  ok('深海竜: destroyed by battle with 1 counter -> my Fish monster ATK +200 (500 -> 700) until the End Phase',z(d)==='grave'&&curATK(C(fish))===700,JSON.stringify({d:z(d),a:curATK(C(fish))}));
  audit('深海竜 1');
  endTurn();
  ok('深海竜: the bonus ends at the End Phase',curATK(C(fish))===500,String(curATK(C(fish)))); }
{ fresh();const d=mon(OCE,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  endTurn();endTurn();
  ok('深海竜: a counter at each Standby Phase (opponent and mine) -> 2',API.countCounter({p:0,zone:'mz',index:idx(d)},'オーシャン')===2,String(API.countCounter({p:0,zone:'mz',index:idx(d)},'オーシャン'))); }

/* ===== 静寂のサイコウィッチ ===== */
{ fresh();const w=mon(WIT,0),pk=mk('サイコ・コマンダー',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[w];gameState.players[0].deck=[pk].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[pk.uid];foeAttack(f,w);PREFER=[];
  ok('サイコウィッチ: destroyed by battle -> サイコ・コマンダー banished from the Deck',z(w)==='grave'&&pz(pk)==='banish',JSON.stringify({w:z(w),pk:pz(pk)}));
  endTurn();
  ok('サイコウィッチ: Special Summoned at the next Standby Phase (mine)',pz(pk)==='mz'&&pp(pk)===0,JSON.stringify({pk:pz(pk),p:pp(pk)}));
  audit('サイコウィッチ 1'); }
{ fresh();const w=mon(WIT,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,w);
  ok('サイコウィッチ negative: no Psychic monster in the Deck -> only destroyed',z(w)==='grave',z(w)); }

console.log('U356 done');
`);

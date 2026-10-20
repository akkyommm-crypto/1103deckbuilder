/* S03-U359: D・スコープン, D・マグネンU, D・マグネンI, D・キャメラン.
   Real DUEL paths (position-dependent effects: ignition, attack-target restrictions, attack bans, a battle-destroyed trigger, targeting immunity), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3590001;
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



const SCO='D・スコープン',MAU='D・マグネンU',MAI='D・マグネンI',CAM='D・キャメラン';
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== D・スコープン ===== */
{ fresh();const s=mon(SCO,0),v=mk('D・ビデオン',0);gameState.players[0].mz=[s];gameState.players[0].hand=[v];baselineA();
  ok('スコープン: Attack Position, a D Level 4 monster in hand -> can activate',canZ(s),'');
  actC(s,[v.uid]);
  ok('スコープン: D・ビデオン Special Summoned',pz(v)==='mz',pz(v));
  ok('スコープン: once per turn',!canZ(s),'');
  audit('スコープン 1');
  phase('end');drive();
  ok('スコープン: the summoned D is destroyed in the End Phase',pz(v)==='grave',pz(v)); }
{ fresh();const s=mon(SCO,0,'def'),v=mk('D・ビデオン',0);s.pos='def';gameState.players[0].mz=[s];gameState.players[0].hand=[v];baselineA();
  ok('スコープン: Defense Position -> the call is not offered',!canZ(s),'');
  ok('スコープン: Defense Position -> Level 4',curLV(C(s))===4,String(curLV(C(s)))); }
{ fresh();const s=mon(SCO,0);gameState.players[0].mz=[s];baselineA();
  ok('スコープン: Attack Position -> Level 3 (printed)',curLV(C(s))===3,String(curLV(C(s))));
  ok('スコープン negative: no D Level 4 in hand',!canZ(s),''); }

/* ===== D・マグネンU ===== */
{ fresh();const u=mon(MAU,0),hi=mon('青眼の白龍',1),lo=mon('ワイト',1);gameState.players[0].mz=[u];gameState.players[1].mz=[hi,lo];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,u,lo);
  ok('マグネンU: Attack Position -> cannot attack the weaker monster (ワイト untouched)',z(lo)==='mz'&&z(u)==='mz'&&lp(1)===l1,JSON.stringify({lo:z(lo),u:z(u)}));
  atkTarget(0,u,hi);
  ok('マグネンU: the highest-ATK monster (青眼) can be attacked (and wins)',z(u)==='grave',z(u));
  audit('マグネンU 1'); }
{ fresh();const u=mon(MAU,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);u.pos='def';gameState.players[0].mz=[u,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,w);
  ok('マグネンU: Defense Position -> the opponent cannot target the other monster (ワイト untouched)',z(w)==='mz'&&lp(0)===l0,JSON.stringify({w:z(w),loss:l0-lp(0)}));
  foeAttack(f,u);
  ok('マグネンU: ... but the Defense Position マグネンU itself can be attacked',z(u)==='grave',z(u));
  audit('マグネンU 2'); }

/* ===== D・マグネンI ===== */
{ fresh();const i=mon(MAI,0),w=mon('ワイト',0),f=mon('ワイト',1);i.pos='def';gameState.players[0].mz=[i,w];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,w,f);
  ok('マグネンI: Defense Position -> my monsters cannot attack',z(f)==='mz'&&lp(1)===l1,JSON.stringify({f:z(f),loss:l1-lp(1)})); }
{ fresh();const i=mon(MAI,0),a=mon('サファイアドラゴン',0),b=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[i,a,b];gameState.players[1].mz=[f];baselineA();
  ok('マグネンI: Attack Position with exactly two other Attack Position monsters -> can activate',canZ(i),'');
  actC(i);
  ok('マグネンI: ATK 100 + 1900 + 300 = 2300 until the End Phase',curATK(C(i))===2300,String(curATK(C(i))));
  ok('マグネンI: once per turn',!canZ(i),'');
  audit('マグネンI 1');
  phase('battle');const l1=lp(1);atkTarget(0,a,f);
  ok('マグネンI: the other monsters cannot attack this turn',z(a)==='mz'&&lp(1)===l1&&z(f)==='mz',JSON.stringify({a:z(a),f:z(f)}));
  atkTarget(0,i,f);
  ok('マグネンI: マグネンI itself can attack (2300 < 3000: it is destroyed)',z(i)==='grave',z(i)); }
{ fresh();const i=mon(MAI,0),a=mon('サファイアドラゴン',0);gameState.players[0].mz=[i,a];baselineA();
  ok('マグネンI negative: only one other monster',!canZ(i),''); }

/* ===== D・キャメラン ===== */
{ fresh();const c=mon(CAM,0),n=mk('D・ナポレオン',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[c];gameState.players[0].hand=[n];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,c);
  ok('キャメラン: destroyed by battle in Attack Position -> D・ナポレオン (Level 2) Special Summoned from the hand',z(c)==='grave'&&pz(n)==='mz',JSON.stringify({c:z(c),n:pz(n)}));
  audit('キャメラン 1'); }
{ fresh();const c=mon(CAM,0),n=mk('D・ナポレオン',0),f=mon('青眼の白龍',1);c.pos='def';gameState.players[0].mz=[c];gameState.players[0].hand=[n];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,c);
  ok('キャメラン negative: destroyed in Defense Position -> no recruit',z(c)==='grave'&&pz(n)==='hand',JSON.stringify({c:z(c),n:pz(n)})); }
{ fresh();const c=mon(CAM,0),n=mon('D・ナポレオン',0),cc=mk('心変わり',1);c.pos='def';gameState.activePlayer=1;
  gameState.players[0].mz=[c,n];gameState.players[1].hand=[cc];baselineA();
  PREFER=[n.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('キャメラン: Defense Position -> a D monster cannot be targeted by 心変わり (stays mine)',pp(n)===0,String(pp(n))); }
{ fresh();const c=mon(CAM,0),n=mon('D・ナポレオン',0),cc=mk('心変わり',1);gameState.activePlayer=1;
  gameState.players[0].mz=[c,n];gameState.players[1].hand=[cc];baselineA();
  PREFER=[n.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('キャメラン control: Attack Position -> 心変わり takes D・ナポレオン',pp(n)===1,String(pp(n))); }

console.log('U359 done');
`);

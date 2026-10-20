/* S03-U362: ライトロード・ドルイド オルクス, ライトエンド・ドラゴン, ライトニング・トライコーン, ダーク・クリエイター, ダーク・カタパルター.
   Real DUEL paths (targeting immunity, End Phase mill, attack-declaration weakening, a revive after being destroyed by the opponent, a hand procedure, counters), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3620001;
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



const ORC='ライトロード・ドルイド オルクス',LED='ライトエンド・ドラゴン',TRI='ライトニング・トライコーン',CRE='ダーク・クリエイター',CAT='ダーク・カタパルター';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== ライトロード・ドルイド オルクス ===== */
{ fresh();const o=mon(ORC,0),g=mon('ライトロード・ウォリアー ガロス',0),cc=mk('心変わり',1);gameState.activePlayer=1;gameState.players[0].mz=[o,g];gameState.players[1].hand=[cc];baselineA();
  PREFER=[g.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('オルクス: a 「ライトロード」 monster cannot be targeted by an effect (心変わり)',pp(g)===0,String(pp(g))); }
{ fresh();const o=mon(ORC,0),w=mon('ワイト',0),cc=mk('心変わり',1);gameState.activePlayer=1;gameState.players[0].mz=[o,w];gameState.players[1].hand=[cc];baselineA();
  PREFER=[w.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('オルクス control: ワイト can be targeted (taken)',pp(w)===1,String(pp(w))); }
{ fresh();const o=mon(ORC,0);gameState.players[0].mz=[o];baselineA();
  const d0=gameState.players[0].deck.length;phase('end');drive();
  ok('オルクス: my End Phase -> the top 2 cards of my Deck to the Graveyard',gameState.players[0].deck.length===d0-2,String(d0-gameState.players[0].deck.length));
  audit('オルクス 1'); }
{ fresh();const o=mon(ORC,0);gameState.players[0].mz=[o];baselineA();
  endTurn();const d0=gameState.players[0].deck.length;phase('end');drive();
  ok('オルクス: the opponent End Phase mills nothing',gameState.players[0].deck.length===d0,String(d0-gameState.players[0].deck.length)); }

/* ===== ライトエンド・ドラゴン ===== */
{ fresh();const l=mon(LED,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[l];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,l,f);
  ok('ライトエンド: attacking 青眼 -> ATK 2100 vs 1500: 青眼 destroyed, 600 damage',pz(f)==='grave'&&pz(l)==='mz'&&lp(1)===l1-600,JSON.stringify({f:pz(f),l:pz(l),loss:l1-lp(1)}));
  audit('ライトエンド 1'); }
{ fresh();const l=mon(LED,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[l];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);foeAttack(f,l);
  ok('ライトエンド: attacked by 青眼 -> the same effect: 青眼 destroyed, its controller takes 600',pz(f)==='grave'&&pz(l)==='mz'&&lp(1)===l1-600,JSON.stringify({f:pz(f),l:pz(l),loss:l1-lp(1)})); }
{ fresh();const l=mon(LED,0);gameState.players[0].mz=[l];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,l,'direct');
  ok('ライトエンド control: a direct attack -> no weakening (2600 damage)',lp(1)===l1-2600,String(l1-lp(1))); }

/* ===== ライトニング・トライコーン ===== */
{ fresh();const t=mon(TRI,0),u=mk('サンダー・ユニコーン',0),f=mon('青眼の白龍',1);u.properlySummonedS03=true;gameState.players[0].mz=[t];gameState.players[0].grave=[u];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,t);
  ok('トライコーン: destroyed by the opponent -> サンダー・ユニコーン Special Summoned from the Graveyard',pz(t)==='grave'&&pz(u)==='mz',JSON.stringify({t:pz(t),u:pz(u)}));
  audit('トライコーン 1'); }
{ fresh();const t=mon(TRI,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,t);
  ok('トライコーン negative: no target in the Graveyard -> only destroyed',pz(t)==='grave',pz(t)); }

/* ===== ダーク・クリエイター ===== */
{ fresh();const c=mk(CRE,0);const gy=[1,2,3,4,5].map(()=>mk('D・ナポレオン',0));gameState.players[0].hand=[c];gameState.players[0].grave=gy;baselineA();
  ok('クリエイター: 5 DARK monsters in the Graveyard, empty field -> the procedure is legal',procOk(CRE,0)===true,'');
  procRun(CRE,0);
  ok('クリエイター: Special Summoned',pz(c)==='mz',pz(c));
  audit('クリエイター 1'); }
{ fresh();const c=mk(CRE,0);const gy=[1,2,3,4].map(()=>mk('D・ナポレオン',0));gameState.players[0].hand=[c];gameState.players[0].grave=gy;baselineA();
  ok('クリエイター negative: only 4 DARK monsters -> illegal',procOk(CRE,0)===false,''); }
{ fresh();const c=mk(CRE,0),w=mon('ワイト',0);const gy=[1,2,3,4,5].map(()=>mk('D・ナポレオン',0));gameState.players[0].hand=[c];gameState.players[0].mz=[w];gameState.players[0].grave=gy;baselineA();
  ok('クリエイター negative: a monster on my field -> illegal',procOk(CRE,0)===false,''); }
{ fresh();const c=mon(CRE,0),a=mk('D・ナポレオン',0),b=mk('インプ',0);gameState.players[0].mz=[c];gameState.players[0].grave=[a,b];baselineA();
  ok('クリエイター: 2 DARK monsters in the Graveyard -> can activate',canZ(c),'');
  actC(c,[a.uid,b.uid]);
  ok('クリエイター: one banished (cost), the other Special Summoned',pz(a)==='banish'&&pz(b)==='mz',JSON.stringify({a:pz(a),b:pz(b)}));
  ok('クリエイター: once per turn',!canZ(c),'');
  audit('クリエイター 2'); }

/* ===== ダーク・カタパルター ===== */
{ fresh();const k=mon(CAT,0);k.pos='def';gameState.players[0].mz=[k];baselineA();
  endTurn();endTurn();
  ok('カタパルター: Defense Position at my Standby Phase -> 1 counter',API.countCounter({p:0,zone:'mz',index:idx(k)},'カウンター')===1,String(API.countCounter({p:0,zone:'mz',index:idx(k)},'カウンター')));
  audit('カタパルター 1'); }
{ fresh();const k=mon(CAT,0);gameState.players[0].mz=[k];baselineA();
  endTurn();endTurn();
  ok('カタパルター negative: Attack Position -> no counter',API.countCounter({p:0,zone:'mz',index:idx(k)},'カウンター')===0,''); }
{ fresh();const k=mon(CAT,0),g1=mk('ワイト',0),g2=mk('ワイト',0),st=setCard('ブラック・ホール',1);k.pos='def';gameState.players[0].mz=[k];gameState.players[0].grave=[g1,g2];gameState.players[1].sz=[st];baselineA();
  endTurn();endTurn();
  ok('カタパルター: with 1 counter it can activate',canZ(k),'');
  actC(k,[g1.uid,st.uid]);
  ok('カタパルター: 1 Graveyard card banished (cost), 1 Spell / Trap destroyed, the counters removed',pz(g1)==='banish'&&pz(st)==='grave'&&API.countCounter({p:0,zone:'mz',index:idx(k)},'カウンター')===0,JSON.stringify({g1:pz(g1),st:pz(st),n:API.countCounter({p:0,zone:'mz',index:idx(k)},'カウンター')})); }

console.log('U362 done');
`);

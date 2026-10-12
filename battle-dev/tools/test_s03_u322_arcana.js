/* S03-U322: 「アルカナフォース」 — III－THE EMPRESS, XIV－TEMPERANCE, EX－THE LIGHT RULER (the coin toss: each side of each card). Real DUEL paths, Replay-audited.
   The coin is the replay-safe duelRandomInt: a scenario runs with successive seeds until the wanted side comes up (the winning run is the one asserted and audited). */
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
function fresh(seed){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=seed;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function coinOf(c){const k=C(c);return k?k.u322Coin||null:null;}
function seeded(want,run){for(let s=1;s<=80;s++){const r=run(0x3220000+s*7919);if(r&&r.coin===want)return r;}return null;}
function handIdx(p,c){return gameState.players[p].hand.indexOf(c);}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
const EMP='アルカナフォースIII－THE EMPRESS',TEMP='アルカナフォースXIV－TEMPERANCE',LR='アルカナフォースEX－THE LIGHT RULER';

/* ===== EMPRESS: the opponent Normal Summon success → heads: Special Summon an Arcana from my hand; tails: I send a hand card to the Graveyard ===== */
/* doNormalSummon(i, pos) takes the HAND INDEX of the active player */
function empress(seed,extras){
  fresh(seed);const em=mk(EMP,0),ex=extras(),w=mk('ワイト',1);
  gameState.players[0].hand=[em].concat(ex);gameState.players[1].hand=[w];baselineA();
  doNormalSummon(0,'atk');drive();
  return {coin:coinOf(em),em,ex,w};
}
{ const r=seeded('heads',s=>empress(s,()=>[mk('アルカナフォースI－THE MAGICIAN',0)]));
  ok('EMPRESS: Normal Summoned, the coin came up heads',!!r&&coinOf(r.em)==='heads'&&z(r.em)==='mz',JSON.stringify({coin:r&&r.coin}));
  const a1=r.ex[0],w=r.w;
  endTurn();
  doNormalSummon(0,'atk');drive();
  ok('EMPRESS heads: the opponent Normal Summon → アルカナフォースI Special Summoned from my hand',z(w)==='mz'&&pl(w)===1&&z(a1)==='mz'&&pl(a1)===0,JSON.stringify({w:z(w),a1:z(a1)}));
  audit('EMPRESS heads'); }
{ const r=seeded('tails',s=>empress(s,()=>[mk('強欲な壺',0),mk('サイクロン',0)]));
  ok('EMPRESS: coin tails',!!r&&coinOf(r.em)==='tails',JSON.stringify({coin:r&&r.coin}));
  const h1=r.ex[0],x1=r.ex[1],w=r.w;
  endTurn();
  PREFER=[uid(x1)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('EMPRESS tails: the opponent Normal Summon → I send a chosen hand card to the Graveyard',z(w)==='mz'&&z(x1)==='grave'&&z(h1)==='hand',JSON.stringify({w:z(w),x1:z(x1),h1:z(h1)}));
  audit('EMPRESS tails'); }
{ const r=seeded('heads',s=>{fresh(s);const em=mon(EMP,0),a1=mk('アルカナフォースI－THE MAGICIAN',0);em.u322Coin='heads';gameState.players[0].mz=[em];gameState.players[0].hand=[a1];baselineA();doNormalSummon(0,'atk');drive();return {coin:'heads',em,a1};});
  ok('EMPRESS heads negative: my own Normal Summon does not trigger it (the Arcana was only summoned, no second summon)',z(r.a1)==='mz'&&gameState.players[0].mz.length===2,JSON.stringify({a1:z(r.a1),n:gameState.players[0].mz.length})); }

/* ===== TEMPERANCE: the coin halves battle damage (heads: mine, tails: the opponent); the hand effect makes the damage of that battle 0 ===== */
function temperance(seed,mine,foes){
  fresh(seed);const tp=mk(TEMP,0),tr=mon('ワイト',0),m=mine(),f=foes();gameState.players[0].hand=[tp];gameState.players[0].mz=[tr].concat(m);gameState.players[1].mz=f;baselineA();
  PREFER=[uid(tr)];doNormalSummon(0,'atk');drive();PREFER=[];
  return {coin:coinOf(tp),tp,m,f};
}
{ const r=seeded('heads',s=>temperance(s,()=>[mon('ワイト',0)],()=>[mon('青眼の白龍',1)]));const tp=r.tp;
  ok('TEMPERANCE heads: Summoned with 1 Tribute',z(tp)==='mz'&&coinOf(tp)==='heads',JSON.stringify({coin:r.coin}));
  toOppBattle();const l0=lp(0);atkTarget(1,r.f[0],r.m[0]);
  ok('TEMPERANCE heads: the battle damage I take is halved (3000-300 = 2700 → 1350)',l0-lp(0)===1350,JSON.stringify({loss:l0-lp(0)}));
  audit('TEMPERANCE heads'); }
{ const r=seeded('tails',s=>temperance(s,()=>[mon('青眼の白龍',0)],()=>[]));const tp=r.tp;
  ok('TEMPERANCE tails: coin tails',coinOf(tp)==='tails',JSON.stringify({coin:r.coin}));
  phase('battle');const l1=lp(1);atkTarget(0,r.m[0],'direct');
  ok('TEMPERANCE tails: the battle damage the opponent takes is halved (3000 → 1500)',l1-lp(1)===1500,JSON.stringify({loss:l1-lp(1)}));
  audit('TEMPERANCE tails'); }
/* the hand effect */
{ fresh(0x3220100);const tp=mk(TEMP,0),wy=mon('ワイト',0),f=mon('青眼の白龍',1),f2=mon('青眼の白龍',1);
  gameState.players[0].hand=[tp];gameState.players[0].mz=[wy];gameState.players[1].mz=[f,f2];baselineA();
  toOppBattle();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(f),target:idx(wy)});
  let used=false;const l0=lp(0);
  for(let k=0;k<400;k++){const w=gameState.processorWaiting;
    if(!used&&w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind==='damageStep'&&(w.payload||{}).step==='calc'){pointActivateV27(0,'hand',0,0);used=true;continue;}
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    break;}
  ok('TEMPERANCE hand effect: discarded at the damage calculation → no battle damage to me (ワイト still destroyed)',used&&z(tp)==='grave'&&z(wy)==='grave'&&lp(0)===l0,JSON.stringify({used,tp:z(tp),wy:z(wy),loss:l0-lp(0)}));
  audit('TEMPERANCE hand');
  const wy2=mon('ワイト',0);gameState.players[0].mz=[wy2];
  const l1=lp(0);atkTarget(1,f2,wy2);
  ok('TEMPERANCE hand effect: only that battle — the next attack deals damage normally',l1-lp(0)===2700,JSON.stringify({loss:l1-lp(0)})); }

/* ===== LIGHT RULER: hand procedure (send 3 monsters), coin: heads → recover on a battle kill; tails → negates targeting activations, −1000 ATK each ===== */
function ruler(seed){
  fresh(seed);const lr=mk(LR,0),m1=mon('ワイト',0),m2=mon('ワイト',0),m3=mon('ワイト',0);
  gameState.players[0].hand=[lr];gameState.players[0].mz=[m1,m2,m3];baselineA();
  ok('LIGHT RULER ('+seed+'): the procedure is legal with three monsters',procOk(LR,0)===true,'');
  procRun(LR,0);
  return {coin:coinOf(lr),lr,m:[m1,m2,m3]};
}
{ fresh(1);const lr=mk(LR,0);gameState.players[0].hand=[lr];gameState.players[0].mz=[mon('ワイト',0),mon('ワイト',0)];baselineA();
  ok('LIGHT RULER negative: only two monsters → not legal',procOk(LR,0)===false,''); }
{ const r=seeded('heads',s=>{fresh(s);const lr=mk(LR,0),m1=mon('ワイト',0),m2=mon('ワイト',0),m3=mon('ワイト',0);gameState.players[0].hand=[lr];gameState.players[0].mz=[m1,m2,m3];baselineA();procRun(LR,0);return {coin:coinOf(lr),lr,m:[m1,m2,m3]};});
  ok('LIGHT RULER heads: Special Summoned, the three monsters in the Graveyard',z(r.lr)==='mz'&&r.m.every(m=>z(m)==='grave'),JSON.stringify({lr:z(r.lr),m:r.m.map(z)}));
  audit('LIGHT RULER ①');
  const gy=mk('死者蘇生',0);gameState.players[0].grave.push(gy);const f=mon('ワイト',1);gameState.players[1].mz=[f];
  phase('battle');PREFER=[uid(gy)];atkTarget(0,r.lr,f);PREFER=[];
  ok('LIGHT RULER heads: destroyed ワイト by battle → a chosen card of my Graveyard back to the hand',z(f)==='grave'&&z(gy)==='hand',JSON.stringify({f:z(f),gy:z(gy)})); }
{ const r=seeded('tails',s=>{fresh(s);const lr=mk(LR,0),m1=mon('ワイト',0),m2=mon('ワイト',0),m3=mon('ワイト',0),ec=mk('エネミーコントローラー',1);gameState.players[0].hand=[lr];gameState.players[0].mz=[m1,m2,m3];gameState.players[1].hand=[ec];baselineA();procRun(LR,0);return {coin:coinOf(lr),lr,ec};});
  ok('LIGHT RULER tails: coin tails',z(r.lr)==='mz'&&coinOf(r.lr)==='tails',JSON.stringify({coin:r.coin}));
  endTurn();
  const a0=curATK(C(r.lr));PREFER=['yes',uid(r.lr)];duelActivateFromHand(0);drive();PREFER=[];
  ok('LIGHT RULER tails: the opponent\'s エネミーコントローラー targeting it is negated and destroyed, its ATK −1000',z(r.ec)==='grave'&&C(r.lr).pos===(C(r.lr).pos)&&curATK(C(r.lr))===a0-1000&&z(r.lr)==='mz',JSON.stringify({ec:z(r.ec),atk:curATK(C(r.lr)),was:a0,pos:C(r.lr).pos}));
  audit('LIGHT RULER tails'); }

console.log('U322 done');
`);

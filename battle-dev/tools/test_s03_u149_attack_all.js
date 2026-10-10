/* S03-U149: 「相手フィールド上の全てのモンスターに1回ずつ攻撃できる」 as a continuous rule (engine/1ZQ) — ジュラック・モノロフ /
   神機王ウル (TESTED, but their second attack was refused), ヴァリュアブル・アーマー (Gemini), E・HERO ワイルドジャギーマン.
   Real DUEL path (phase change, Gemini Summon and attacks through the processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function drive(){for(let i=0;i<600;i++){
  if(pc()){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(name){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  const m=mk(name,0,'up');m.summonedTurn=3;m.properlySummonedS03=true;gameState.players[0].mz=[m];return m;}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function tIdx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function toBattle(){requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();}
function attack(c,t){TOASTS.length=0;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:t});drive();}
function activated(name){return (gameState.log||[]).some(x=>new RegExp(name+'（SS\\d+）を発動').test(x.msg));}
`;

/* ===== A. ジュラック・モノロフ ===== */
harness(COMMON+String.raw`
const m=fresh('ジュラック・モノロフ');
const wall=mk('ビッグ・シールド・ガードナー',1,'up');wall.pos='def';const w=mk('ワイト',1,'up');gameState.players[1].mz=[wall,w];
baselineA();
toBattle();
ok('A: entering the Battle Phase activates nothing (continuous rule, not a chain link)',!activated('ジュラック・モノロフ'));
attack(m,tIdx(wall));
ok('A: 1st attack — ビッグ・シールド・ガードナー (DEF 2600) survives',z(wall)==='mz'&&attackCountV48(m)===1);
ok('A: it may still attack (a monster it has not attacked remains)',canDeclareAttackV48(m));
attack(m,tIdx(wall));
ok('A: the same monster cannot be attacked twice (refused, no second battle)',z(wall)==='mz'&&attackCountV48(m)===1&&TOASTS.some(t=>/既に攻撃/.test(t)),JSON.stringify(TOASTS));
attack(m,tIdx(w));
ok('A: 2nd attack on ワイト — destroyed, 1200 damage',z(w)==='grave'&&gameState.players[1].lp===6800,JSON.stringify({w:z(w),lp:gameState.players[1].lp}));
ok('A: every opponent monster attacked → no more attacks',!canDeclareAttackV48(m));
audit('A');
/* direct attack only as the first attack, and only once */
const m2=fresh('ジュラック・モノロフ');gameState.players[1].mz=[];
baselineA();
toBattle();attack(m2,'direct');
ok('A: no opponent monster → one direct attack (1500)',gameState.players[1].lp===6500,String(gameState.players[1].lp));
ok('A: … and no second attack',!canDeclareAttackV48(m2));
audit('A direct');
`);

/* ===== B. 神機王ウル: attacks each monster; the opponent takes no battle damage ===== */
harness(COMMON+String.raw`
const u=fresh('神機王ウル');const a=mk('ワイト',1,'up'),b=mk('ワイト',1,'up');gameState.players[1].mz=[a,b];
baselineA();
toBattle();attack(u,tIdx(a));attack(u,tIdx(b));
ok('B: both monsters destroyed by two attacks, 0 battle damage to the opponent',z(a)==='grave'&&z(b)==='grave'&&gameState.players[1].lp===8000,
  JSON.stringify({a:z(a),b:z(b),lp:gameState.players[1].lp}));
audit('B');
`);

/* ===== C. ヴァリュアブル・アーマー (Gemini) ===== */
harness(COMMON+String.raw`
const v=fresh('ヴァリュアブル・アーマー');const a=mk('ワイト',1,'up'),b=mk('ワイト',1,'up');gameState.players[1].mz=[a,b];
baselineA();
toBattle();attack(v,tIdx(a));
ok('C: as a Normal Monster (not Gemini Summoned) — one attack only',z(a)==='grave'&&!canDeclareAttackV48(v));
const v2=fresh('ヴァリュアブル・アーマー');const c=mk('ワイト',1,'up'),d=mk('ワイト',1,'up');gameState.players[1].mz=[c,d];
baselineA();
{const h=findCardByUid(v2.uid);doGeminiSummonS03(0,h.zone,h.index);drive();}
toBattle();attack(v2,tIdx(c));attack(v2,tIdx(d));
ok('C: Gemini Summoned — attacks both monsters',z(c)==='grave'&&z(d)==='grave',JSON.stringify({c:z(c),d:z(d)}));
audit('C');
`);

/* ===== D. E・HERO ワイルドジャギーマン ===== */
harness(COMMON+String.raw`
const j=fresh('E・HERO ワイルドジャギーマン');const a=mk('ワイト',1,'up'),b=mk('ワイト',1,'up'),c=mk('ワイト',1,'up');gameState.players[1].mz=[a,b,c];
baselineA();
toBattle();attack(j,tIdx(a));attack(j,tIdx(b));attack(j,tIdx(c));
ok('D: attacks all three monsters (3 × 2300 damage)',z(a)==='grave'&&z(b)==='grave'&&z(c)==='grave'&&gameState.players[1].lp===8000-3*2300,
  JSON.stringify({lp:gameState.players[1].lp}));
ok('D: … then no more attacks, and no direct attack',!canDeclareAttackV48(j));
audit('D');
`);

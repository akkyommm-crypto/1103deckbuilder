/* S03-U154: 光の護封剣 (3-turn self-destruction was a reminder only), リミッター解除 (End Phase destruction was a reminder only),
   名推理 / マインドクラッシュ (browser prompt(), not journaled). Real DUEL path (activations, choices, phases and turns through the
   processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];const CHOOSERS=[];
function pick(){const q=pc();CHOOSERS.push({p:q.player,title:q.title});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function step(){
  if(pc()){pick();return true;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return true;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return true;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return true;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return true;}
  return false;}
function drive(){for(let i=0;i<800;i++){if(!step())return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=0x5331a5e5;gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++){gameState.players[p].deck=[];for(let k=0;k<12;k++)gameState.players[p].deck.push(mk('ワイト',p));}}
`;

/* ===== A. 光の護封剣 ===== */
harness(COMMON+String.raw`
fresh();
const sw=mk('光の護封剣',0);gameState.players[0].hand=[sw];
const fd=mk('ゴブリン突撃部隊',1,'down');fd.pos='def';gameState.players[1].mz=[fd];
baselineA();
duelActivateFromHand(0);drive();
ok('A: activated — stays on the field, the face-down monster is turned face-up',z(sw)==='sz'&&findCardByUid(fd.uid).card.face==='up');
nextTurn();
ok('A: in the opponent turn its monsters cannot attack',gameState.activePlayer===1&&!canDeclareAttackV48(findCardByUid(fd.uid).card));
nextTurn();nextTurn();nextTurn();
ok('A: after the opponent 1st and 2nd End Phases it is still on the field (turn 9)',gameState.turn===9&&z(sw)==='sz',JSON.stringify({t:gameState.turn,sw:z(sw)}));
nextTurn();nextTurn();
ok('A: at the opponent 3rd End Phase (turn 10) it is destroyed',gameState.turn===11&&z(sw)==='grave',JSON.stringify({t:gameState.turn,sw:z(sw)}));
audit('A');
`);

/* ===== B. リミッター解除 ===== */
harness(COMMON+String.raw`
fresh();
const cd=mk('サイバー・ドラゴン',0,'up'),wt=mk('ワイト',0,'up');gameState.players[0].mz=[cd,wt];
const lm=mk('リミッター解除',0);gameState.players[0].hand=[lm];
baselineA();
duelActivateFromHand(0);drive();
ok('B: サイバー・ドラゴン (Machine) ATK doubled to 4200; ワイト unchanged',curATK(findCardByUid(cd.uid).card)===4200&&curATK(findCardByUid(wt.uid).card)===300);
phase('end');drive();
ok('B: in the End Phase the Machine is destroyed; ワイト stays',z(cd)==='grave'&&z(wt)==='mz',JSON.stringify({cd:z(cd),wt:z(wt)}));
audit('B');
`);

/* ===== C. 名推理 ===== */
harness(COMMON+String.raw`
fresh();
const mr=mk('名推理',0);gameState.players[0].hand=[mr];
const top=mk('サイクロン',0),mon=mk('ゴブリン突撃部隊',0);gameState.players[0].deck=[top,mon].concat(gameState.players[0].deck);
baselineA();
PREFER=['lv4'];duelActivateFromHand(0);drive();PREFER=[];
ok('C: the opponent (player II) declares the level',CHOOSERS.some(c=>/名推理/.test(c.title||'')&&c.p===1),JSON.stringify(CHOOSERS));
ok('C: declared 4 = ゴブリン突撃部隊 (Lv4) → all revealed cards to the GY',z(top)==='grave'&&z(mon)==='grave',JSON.stringify({top:z(top),mon:z(mon)}));
audit('C');
fresh();
const mr2=mk('名推理',0);gameState.players[0].hand=[mr2];
const top2=mk('サイクロン',0),mon2=mk('ゴブリン突撃部隊',0);gameState.players[0].deck=[top2,mon2].concat(gameState.players[0].deck);
baselineA();
PREFER=['lv1'];duelActivateFromHand(0);drive();PREFER=[];
ok('C: declared 1 ≠ 4 → ゴブリン突撃部隊 is Special Summoned, サイクロン to the GY',z(mon2)==='mz'&&z(top2)==='grave',JSON.stringify({top:z(top2),mon:z(mon2)}));
audit('C2');
`);

/* ===== D. マインドクラッシュ ===== */
harness(COMMON+String.raw`
fresh();
const code=String(canonicalCardCodeV4(dbOf(mk('ワイト',1))));
const mc=mk('マインドクラッシュ',0,'down');mc.setTurn=3;gameState.players[0].sz=[mc];
const f1=mk('ワイト',1),f2=mk('ワイト',1),f3=mk('サイクロン',1);gameState.players[1].hand=[f1,f2,f3];
baselineA();
PREFER=['code:'+code];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('D: declared ワイト at activation → the opponent discards both ワイト, keeps サイクロン',z(f1)==='grave'&&z(f2)==='grave'&&z(f3)==='hand',JSON.stringify({f1:z(f1),f2:z(f2),f3:z(f3)}));
audit('D');
fresh();
const mc2=mk('マインドクラッシュ',0,'down');mc2.setTurn=3;gameState.players[0].sz=[mc2];
gameState.players[1].hand=[mk('サイクロン',1)];const o1=mk('ワイト',0),o2=mk('ワイト',0);gameState.players[0].hand=[o1,o2];
baselineA();
PREFER=['code:'+code];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
const discardedByChoice=CHOOSERS.some(c=>/捨てる手札/.test(c.title||''));
ok('D: declared ワイト not in the opponent hand → its controller discards 1 card at random (no choice)',gameState.players[0].hand.length===1&&!discardedByChoice,
  JSON.stringify({hand:gameState.players[0].hand.length,choosers:CHOOSERS.map(c=>c.title)}));
audit('D2');
`);

/* S03-U124: 超融合 — the Fusion Monster and materials are chosen at resolution, by the player, from all combinations
   (either field). Measured on U123: they were chosen at activation and the materials were always the FIRST combination
   found (at most 5 searched) — e.g. the player could not choose the opponent's monster. Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function owner(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
function drive(){for(let i=0;i<300;i++){
  if(pc())return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
`;

harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const sp=mk('超融合',0),fodder=mk('青眼の白龍',0);gameState.players[0].hand=[sp,fodder];
const hero=mk('E・HERO エアーマン',0,'up'),myWater=mk('アンモ・ナイト',0,'up');gameState.players[0].mz=[hero,myWater];
const foeWater=mk('アンモ・ナイト',1,'up');gameState.players[1].mz=[foeWater];
const az=mk('E・HERO アブソルートZero',0);gameState.players[0].ex=[az];
baselineA();
duelActivateFromHand(0);
const q0=pc();
ok('A: at activation only the discard cost is chosen',!!q0&&/コストで捨てる/.test(q0.title||''),JSON.stringify(q0&&q0.title));
__choicePickV49(0);
ok('A: 超融合 is on the chain with no Fusion Monster / materials chosen yet',gameState.chain.length===1&&gameState.chain[0].name==='超融合'&&!pc()&&z(az)==='ex',JSON.stringify(gameState.chain.map(l=>l.name)));
ok('A: nobody can respond (U97 lock kept)',getChainResponsesV2(1).length===0&&getChainResponsesV2(0).length===0);
drive();
const q1=pc();
ok('A: at resolution: choose the Fusion Monster',!!q1&&/融合召喚する融合モンスター/.test(q1.title||'')&&q1.candidates.some(c=>c.uid===uid(az)),JSON.stringify(q1&&q1.title));
answerChoiceV49([q1.candidates.find(c=>c.uid===uid(az)).key]);
const q2=pc();
ok('A: then the material combination — both WATER choices are offered, labelled 自分 / 相手',!!q2&&q2.candidates.length===2&&q2.candidates.some(c=>/相手/.test(c.label))&&q2.candidates.some(c=>/アンモ・ナイト（自分）/.test(c.label)),JSON.stringify(q2&&q2.candidates.map(c=>c.label)));
answerChoiceV49([q2.candidates.find(c=>/アンモ・ナイト（相手）/.test(c.label)).key]);
drive();
{const qp=pc();if(qp&&/表示形式/.test(qp.title||'')){answerChoiceV49(['atk']);drive();}}   /* S03-U133: the position question */
ok('A: the chosen materials (own エアーマン + the OPPONENT\'s アンモ・ナイト) go to their owners\' GYs; own アンモ・ナイト stays',z(hero)==='grave'&&z(foeWater)==='grave'&&owner(foeWater)===1&&z(myWater)==='mz',JSON.stringify({hero:z(hero),foe:[z(foeWater),owner(foeWater)],mine:z(myWater)}));
ok('A: E・HERO アブソルートZero is Fusion Summoned (specialSummonKind fusion; fusionMaterialCount 2)',z(az)==='mz'&&az.specialSummonKind==='fusion'&&az.fusionMaterialCount===2,JSON.stringify({z:z(az),k:az.specialSummonKind,n:az.fusionMaterialCount}));
audit('A');
`);

/* ===== B. materials that leave the field before resolution → no Fusion Summon (re-validated) ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const sp=mk('超融合',0),fodder=mk('青眼の白龍',0);gameState.players[0].hand=[sp,fodder];
const hero=mk('E・HERO エアーマン',0,'up');gameState.players[0].mz=[hero];
const foeWater=mk('アンモ・ナイト',1,'up');gameState.players[1].mz=[foeWater];
const az=mk('E・HERO アブソルートZero',0);gameState.players[0].ex=[az];
baselineA();
duelActivateFromHand(0);__choicePickV49(0);
/* only one legal combination: no material choice is asked */
drive();
const q1=pc();answerChoiceV49([q1.candidates[0].key]);drive();
{const qp=pc();if(qp&&/表示形式/.test(qp.title||'')){answerChoiceV49(['atk']);drive();}}   /* S03-U133: the position question */
ok('B: with a single combination no material question is asked; the Fusion Summon happens',z(az)==='mz'&&z(hero)==='grave'&&z(foeWater)==='grave',JSON.stringify({az:z(az)}));
audit('B');
`);

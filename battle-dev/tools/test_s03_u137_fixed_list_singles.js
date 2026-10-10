/* S03-U137: fixed-list singles — 魂を削る死霊 (its 「カードの効果の対象になった時、このカードを破壊する」 was missing), and real-duel
   audits of メタモルポット, N・グラン・モール and ライトロード・マジシャン ライラ. Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[],SEEN=[];
function pick(){const q=pc();SEEN.push({title:q.title,cands:q.candidates.map(x=>x.name||x.label||(x.card?nm(x.card):x.value))});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
`;

/* ===== A. 魂を削る死霊 ===== */
harness(COMMON+String.raw`
fresh();
const sr=mk('魂を削る死霊',0,'up');gameState.players[0].mz=[sr];
const moon=mk('月の書',1,'down');moon.setTurn=3;gameState.players[1].sz=[moon];
baselineA();
duelActivateFromZone(1,'sz',0);for(let i=0;i<5&&pc();i++)pick();
ok('A: targeted by the opponent\'s 月の書 → destroyed at once (no chain block of its own)',z(sr)==='grave'&&gameState.chain.length===1&&gameState.chain[0].name==='月の書',JSON.stringify({sr:z(sr),chain:gameState.chain.map(l=>l.name)}));
drive();
ok('A: 月の書 then resolves with nothing to turn face-down',z(moon)==='grave');
audit('A1');
/* own effect too */
fresh();
const sr2=mk('魂を削る死霊',0,'up');gameState.players[0].mz=[sr2];gameState.players[0].hand=[mk('月の書',0)];
baselineA();
duelActivateFromHand(0);for(let i=0;i<5&&pc();i++)pick();
ok('A: targeted by its controller\'s own 月の書 → destroyed as well',z(sr2)==='grave');
drive();
audit('A2');
/* not destroyed by battle */
fresh();gameState.activePlayer=1;gameState.phase='battle';
const sr3=mk('魂を削る死霊',0,'up');gameState.players[0].mz=[sr3];
const gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[gob];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('A: attacked by ゴブリン突撃部隊 (2300) → not destroyed by battle; its controller takes 2000',z(sr3)==='mz'&&gameState.players[0].lp===6000,JSON.stringify({sr:z(sr3),lp:gameState.players[0].lp}));
audit('A3');
/* direct attack → a random card of the opponent's hand is discarded */
fresh();gameState.phase='battle';
const sr4=mk('魂を削る死霊',0,'up');gameState.players[0].mz=[sr4];
gameState.players[1].hand=[mk('ワイト',1),mk('サンダー・ボルト',1)];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('A: direct attack → 300 damage and 1 random card of the opponent\'s hand discarded',gameState.players[1].lp===7700&&gameState.players[1].hand.length===1&&gameState.players[1].grave.length===1,JSON.stringify({lp:gameState.players[1].lp,hand:names(1,'hand'),g:names(1,'grave')}));
audit('A4');
`);

/* ===== B. メタモルポット: reversal → both hands discarded, then both draw 5 ===== */
harness(COMMON+String.raw`
fresh();
const mp=mk('メタモルポット',0,'down');mp.pos='def';mp.setTurn=3;gameState.players[0].mz=[mp];
gameState.players[0].hand=[mk('ワイト',0)];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];
[0,1].forEach(p=>{gameState.players[p].deck=[1,2,3,4,5,6].map(()=>mk('サンダー・ボルト',p));});
baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('B: both hands discarded (1 + 2 cards) and both players drew 5',gameState.players[0].hand.length===5&&gameState.players[1].hand.length===5&&gameState.players[0].grave.length===1&&gameState.players[1].grave.length===2&&gameState.players[0].deck.length===1,JSON.stringify({h0:gameState.players[0].hand.length,h1:gameState.players[1].hand.length,g0:gameState.players[0].grave.length,g1:gameState.players[1].grave.length}));
audit('B');
`);

/* ===== C. N・グラン・モール: at the start of the Damage Step it returns itself and the battled monster to the hand ===== */
harness(COMMON+String.raw`
fresh();gameState.phase='battle';
const gm=mk('N・グラン・モール',0,'up');gameState.players[0].mz=[gm];
const foe=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[foe];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('C: attacking ゴブリン突撃部隊 → both returned to their owners\' hands, no damage',z(gm)==='hand'&&z(foe)==='hand'&&gameState.players[0].lp===8000&&gameState.players[1].lp===8000,JSON.stringify({gm:z(gm),foe:z(foe),lp:[gameState.players[0].lp,gameState.players[1].lp]}));
audit('C');
`);

/* ===== D. ライトロード・マジシャン ライラ ===== */
harness(COMMON+String.raw`
fresh();
const ly=mk('ライトロード・マジシャン ライラ',0,'up');gameState.players[0].mz=[ly];
const tr=mk('聖なるバリア －ミラーフォース－',1,'down');tr.setTurn=3;gameState.players[1].sz=[tr];
gameState.players[0].deck=[1,2,3,4,5].map(()=>mk('ワイト',0));
baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('D ①: ライラ to Defense Position and the set ミラーフォース destroyed',ly.pos==='def'&&z(tr)==='grave');
ok('D ①: its position cannot be changed now',!getLegalZoneActions(0,'mz',0).some(a=>/changePos|position/i.test(a.id)),JSON.stringify(getLegalZoneActions(0,'mz',0).map(a=>a.id)));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();
ok('D ②: End Phase → the top 3 cards of the Deck are sent to the GY',gameState.players[0].grave.length===3&&gameState.players[0].deck.length===2,JSON.stringify({g:gameState.players[0].grave.length,d:gameState.players[0].deck.length}));
audit('D');
fresh();
const ly2=mk('ライトロード・マジシャン ライラ',0,'up');ly2.pos='def';gameState.players[0].mz=[ly2];
const tr2=mk('聖なるバリア －ミラーフォース－',1,'down');gameState.players[1].sz=[tr2];
ok('D ①: in Defense Position → illegal',strictScriptLegalityV2('ライトロード・マジシャン ライラ',0,'mz',0,{}).ok===false);
`);

/* ===== C (limit): a direct attack is not a battle with an opponent monster → N・グラン・モール stays ===== */
harness(COMMON+String.raw`
fresh();gameState.phase='battle';
const gm=mk('N・グラン・モール',0,'up');gameState.players[0].mz=[gm];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('C: direct attack → no return to the hand; 900 damage',z(gm)==='mz'&&gameState.players[1].lp===7100,JSON.stringify({gm:z(gm),lp:gameState.players[1].lp,SEEN}));
audit('C2');
`);

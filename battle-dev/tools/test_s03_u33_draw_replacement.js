/* S03-U33 C-S03-26 DRAW_REPLACEMENT
   Requirement: 「自分のドローフェイズ時に通常のドローを行う代わりに、デッキから…を手札に加える事ができる」 is offered at the normal draw,
   instead of drawing — not as a Main Phase search.
   2011 wiki: 10/06/11 the effect is a trigger effect; 09/09/30 only one card is added; 10/03/24 effect negated -> no draw,
   activation negated -> the player draws; 10/03/24 not activatable with 0 cards in the Deck; 11/01/10 (円盤ムスキー) not applied
   unless it is face-up on the field at resolution.
   Before this unit: the three cards were AUTO_DECK_TABLE Main Phase ignition searches (no limit) and nothing was offered at the draw.
   Cards named here: 無敗将軍 フリード and 円盤ムスキー (promoted by this unit), ダーク・ジェネラル フリード (kept PARTIAL by an explicit
   override because its other effect is not implemented — a recorded exception to the TESTED/GENERIC_OK naming rule), and
   ワイト, マジック・ストライカー, エーリアン・ソルジャー, ダーク・グレファー, 天罰, スキルドレイン (TESTED or GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function title(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function labels(){const q=pendingChoiceV49(gameState);return q?q.candidates.map(x=>String(x.label||x.key||'')):[];}
function pick(m){const q=pendingChoiceV49(gameState);if(!q){TOASTS.push('PICK_MISS:'+m);return false;}
  const i=q.candidates.findIndex(x=>String(x.label||x.key||'').includes(m)||(x.uid!=null&&findCardByUid(x.uid)&&nm(findCardByUid(x.uid).card)===m));
  if(i<0){TOASTS.push('PICK_MISS:'+m+' in '+JSON.stringify(labels()));return false;}__choicePickV49(i);return true;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function hand(p){return gameState.players[p].hand.map(nm);}
function deck(p){return gameState.players[p].deck.map(nm);}
function drawPhaseBoard(replacer,deckNames){
  fresh();
  const r=mk(replacer,0);gameState.players[0].mz=[r];
  gameState.players[0].deck=deckNames.map(n=>mk(n,0,'down'));
  gameState.players[0].hand=[];
  gameState.activePlayer=0;gameState.phase='draw';gameState.drawnThisTurn=false;
  baselineA();
  return r;
}
function requestNormalDraw(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:0,n:1,normal:true});}

/* ===== A. 無敗将軍 フリード: the replacement is offered at the normal draw and replaces it ===== */
let fr=drawPhaseBoard('無敗将軍 フリード',['ワイト','マジック・ストライカー']);
requestNormalDraw();drive();
ok('A: at the normal draw a choice is offered — draw normally, or activate 無敗将軍 フリード instead',
  /通常のドロー/.test(title()||'')&&labels().length===2&&labels().some(l=>l.includes('無敗将軍 フリード')),JSON.stringify({title:title(),labels:labels()}));
pick('無敗将軍 フリード');
for(let k=0;k<8;k++){const r=drive();if(r==='choice'){pick('マジック・ストライカー');continue;}break;}
ok('A: the replacement adds マジック・ストライカー and there is no normal draw (ワイト stays on top of the Deck)',
  JSON.stringify(hand(0))===JSON.stringify(['マジック・ストライカー'])&&deck(0)[0]==='ワイト'&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),deck:deck(0),drawn:gameState.drawnThisTurn,toasts:TOASTS.slice(-3)}));
const handA=hand(0).length;
requestNormalDraw();drive();
ok('A: the normal draw is used — requesting it again draws nothing',hand(0).length===handA&&!pendingChoiceV49(gameState),
  JSON.stringify({hand:hand(0),toasts:TOASTS.slice(-2)}));
audit('A replacement');

/* ===== B. declining the replacement draws normally ===== */
fr=drawPhaseBoard('無敗将軍 フリード',['ワイト','マジック・ストライカー']);
requestNormalDraw();drive();
pick('通常のドローを行う');drive();
ok('B: choosing the normal draw draws ワイト and searches nothing',
  JSON.stringify(hand(0))===JSON.stringify(['ワイト'])&&deck(0).includes('マジック・ストライカー')&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),deck:deck(0),drawn:gameState.drawnThisTurn}));
audit('B decline');

/* ===== C. the coarse Main Phase search is gone ===== */
fresh();
const frC=mk('無敗将軍 フリード',0);gameState.players[0].mz=[frC];
gameState.players[0].deck=[mk('マジック・ストライカー',0,'down')];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
const actsC=getLegalZoneActions(0,'mz',0);
ok('C: in the Main Phase 無敗将軍 フリード offers no search effect',!actsC.some(a=>a.id==='effect'),JSON.stringify(actsC.map(a=>a.id)));

/* ===== D. activation negated (天罰) -> the player draws normally (10/03/24) ===== */
fr=drawPhaseBoard('無敗将軍 フリード',['ワイト','マジック・ストライカー']);
const wrath=mk('天罰',1,'down');wrath.setTurn=gameState.turn-1;gameState.players[1].sz=[wrath];
gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
requestNormalDraw();drive();
pick('無敗将軍 フリード');
const respD=getChainResponsesV2(1).map(x=>x.db.n);
ok('D setup: P2 can respond to the replacement with 天罰',respD.includes('天罰'),JSON.stringify({resp:respD,chain:gameState.chain.map(l=>l.name)}));
if(respD.includes('天罰')){duelActivateResponseV2(1,'sz',0);}
for(let k=0;k<10;k++){const r=drive();if(r==='choice'){const t=title()||'';if(/天罰/.test(t))pick('ワイト');else pick('マジック・ストライカー');continue;}break;}
ok('D: the activation is negated, so P1 draws ワイト normally and マジック・ストライカー is not searched',
  hand(0).includes('ワイト')&&!hand(0).includes('マジック・ストライカー')&&deck(0).includes('マジック・ストライカー'),
  JSON.stringify({hand:hand(0),deck:deck(0),freed:(findCardByUid(fr.uid)||{}).zone,toasts:TOASTS.slice(-3)}));
audit('D activation negated');

/* ===== E. effect negated (スキルドレイン) -> no draw (10/03/24) ===== */
fr=drawPhaseBoard('無敗将軍 フリード',['ワイト','マジック・ストライカー']);
gameState.players[1].sz=[mk('スキルドレイン',1)];
baselineA();
requestNormalDraw();drive();
const offeredE=labels().some(l=>l.includes('無敗将軍 フリード'));
ok('E setup: under スキルドレイン the replacement can still be activated',offeredE,JSON.stringify({title:title(),labels:labels(),hand:hand(0)}));
if(offeredE){pick('無敗将軍 フリード');for(let k=0;k<8;k++){const r=drive();if(r==='choice'){pick('マジック・ストライカー');continue;}break;}}
ok('E: its effect is negated, so nothing is added and there is no normal draw',
  hand(0).length===0&&deck(0).length===2,JSON.stringify({hand:hand(0),deck:deck(0),toasts:TOASTS.slice(-3)}));
audit('E effect negated');

/* ===== F. 円盤ムスキー: an エーリアン card instead of the draw ===== */
drawPhaseBoard('円盤ムスキー',['ワイト','エーリアン・ソルジャー']);
requestNormalDraw();drive();
pick('円盤ムスキー');
for(let k=0;k<8;k++){const r=drive();if(r==='choice'){pick('エーリアン・ソルジャー');continue;}break;}
ok('F: 円盤ムスキー adds エーリアン・ソルジャー instead of drawing',
  JSON.stringify(hand(0))===JSON.stringify(['エーリアン・ソルジャー'])&&deck(0)[0]==='ワイト',JSON.stringify({hand:hand(0),deck:deck(0)}));
audit('F 円盤ムスキー');

/* ===== G. ダーク・ジェネラル フリード: a Level 4 DARK monster instead of the draw ===== */
drawPhaseBoard('ダーク・ジェネラル フリード',['ワイト','ダーク・グレファー']);
requestNormalDraw();drive();
pick('ダーク・ジェネラル フリード');
for(let k=0;k<8;k++){const r=drive();if(r==='choice'){pick('ダーク・グレファー');continue;}break;}
ok('G: ダーク・ジェネラル フリード adds ダーク・グレファー instead of drawing',
  JSON.stringify(hand(0))===JSON.stringify(['ダーク・グレファー'])&&deck(0)[0]==='ワイト',JSON.stringify({hand:hand(0),deck:deck(0)}));
audit('G ダーク・ジェネラル フリード');

/* ===== H. no matching card in the Deck -> no offer, the normal draw happens ===== */
drawPhaseBoard('無敗将軍 フリード',['ワイト','エーリアン・ソルジャー']);
requestNormalDraw();drive();
ok('H: with no Level 4 or lower Warrior in the Deck nothing is offered and ワイト is drawn',
  !pendingChoiceV49(gameState)&&JSON.stringify(hand(0))===JSON.stringify(['ワイト']),JSON.stringify({title:title(),hand:hand(0)}));
`);

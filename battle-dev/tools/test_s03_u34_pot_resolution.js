/* S03-U34 C-S03-27 ACTIVATION_NEGATED_RELEASE — 強欲で謙虚な壺 on the real DUEL path.
   Requirement (2011 wiki 《強欲で謙虚な壺》 2011/08/25 revision):
   10/04/17 the top 3 are revealed and one is chosen at resolution; the cards are public and the Deck is shuffled afterwards;
   10/05/18 no Special Summon in chain to its activation (緊急テレポート etc.);
   10/05/19 if its activation is negated (by a Counter Trap) the player can Special Summon that turn and can activate another copy.
   Before this unit: the reveal and the pick happened at activation (before the chain link existed); a save while the reveal was open
   left the card in the Spell & Trap Zone with no chain link; after マジック・ジャマー negated it a second copy was refused
   「1ターンに1度までです」.
   Cards named here: 強欲で謙虚な壺, マジック・ジャマー, サイクロン, オネスト, クリッター (TESTED); ワイト, はにわ (GENERIC_OK). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;REVEAL_ITEMS=null;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function title(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function candUids(){const q=pendingChoiceV49(gameState);return q?q.candidates.map(x=>x.uid):[];}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)return false;const i=q.candidates.findIndex(x=>x.uid===uid);if(i<0)return false;__choicePickV49(i);return true;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function hand(p){return gameState.players[p].hand.map(nm);}
function potBoard(extraHand){
  fresh();
  const pot=mk('強欲で謙虚な壺',0);
  const deck=[mk('ワイト',0,'down'),mk('はにわ',0,'down'),mk('サイクロン',0,'down'),mk('オネスト',0,'down'),mk('クリッター',0,'down')];
  gameState.players[0].hand=[pot].concat(extraHand||[]);gameState.players[0].deck=deck.slice();
  gameState.activePlayer=0;gameState.phase='main1';
  return {pot,deck};
}
`;
const first=harness(COMMON+String.raw`
/* ===== A. activation reveals nothing; the choice comes at resolution ===== */
let B=potBoard();baselineA();
duelActivateFromHand(0);
ok('A: activating 強欲で謙虚な壺 reveals and picks nothing — a chain link exists, P2 has priority, no choice is pending',
  !(Array.isArray(REVEAL_ITEMS)&&REVEAL_ITEMS.length)&&!pendingChoiceV49(gameState)&&gameState.chain.length===1&&gameState.chain[0].name==='強欲で謙虚な壺'
  &&!!gameState.chainWindow&&gameState.chainWindow.priority===1&&gameState.players[0].deck.length===5,
  JSON.stringify({reveal:REVEAL_ITEMS&&REVEAL_ITEMS.length,pending:!!pendingChoiceV49(gameState),chain:gameState.chain.map(l=>l.name),win:gameState.chainWindow,deck:gameState.players[0].deck.length}));
ok('A: while its activation is on the chain P1 cannot Special Summon (10/05/18)',
  /特殊召喚できません/.test(v46GlobalSpecialSummonRestrictionReason(0)||''),JSON.stringify(v46GlobalSpecialSummonRestrictionReason(0)));
drive();
ok('A: at resolution P1 chooses among exactly the top three cards',/強欲で謙虚な壺/.test(title()||'')
  &&JSON.stringify(candUids().slice().sort())===JSON.stringify(B.deck.slice(0,3).map(c=>c.uid).sort()),JSON.stringify({title:title(),cand:candUids(),top:B.deck.slice(0,3).map(c=>c.uid)}));
pickUid(B.deck[1].uid);drive();
ok('A: the chosen はにわ is added; the other four stay in the Deck; 強欲で謙虚な壺 is in the GY',
  JSON.stringify(hand(0))===JSON.stringify(['はにわ'])&&gameState.players[0].deck.length===4&&zoneOf(B.pot)==='grave'&&zoneOf(B.deck[0])==='deck'&&zoneOf(B.deck[2])==='deck',
  JSON.stringify({hand:hand(0),deck:gameState.players[0].deck.length,pot:zoneOf(B.pot)}));
ok('A: after resolution P1 cannot Special Summon this turn',!!v46GlobalSpecialSummonRestrictionReason(0));
ok('A: the reveal and the choice are logged for both players (public)',gameState.log.some(x=>/めくった（ワイト、はにわ、サイクロン）/.test(String(x&&(x.msg||x.text)||x)))&&gameState.log.some(x=>/「はにわ」を選んだ/.test(String(x&&(x.msg||x.text)||x))),
  JSON.stringify(gameState.log.slice(-6)));
audit('A resolution choice');

/* ===== B. activation negated by マジック・ジャマー: no Special Summon lock, and another copy can be activated (10/05/19) ===== */
const pot2=mk('強欲で謙虚な壺',0);
B=potBoard([pot2]);
const mj=mk('マジック・ジャマー',1,'down');mj.setTurn=gameState.turn-1;gameState.players[1].sz=[mj];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
duelActivateFromHand(0);
const respB=getChainResponsesV2(1).map(x=>x.db.n);
ok('B setup: P2 can respond with マジック・ジャマー',respB.includes('マジック・ジャマー'),JSON.stringify(respB));
if(respB.includes('マジック・ジャマー'))duelActivateResponseV2(1,'sz',0);
for(let k=0;k<6;k++){const r=drive();if(r==='choice'&&!/強欲で謙虚な壺/.test(title()||'')){__choicePickV49(0);continue;}break;}
ok('B: the negated 強欲で謙虚な壺 goes to the GY without a choice; nothing is added',zoneOf(B.pot)==='grave'&&!pendingChoiceV49(gameState)&&JSON.stringify(hand(0))===JSON.stringify(['強欲で謙虚な壺']),
  JSON.stringify({pot:zoneOf(B.pot),hand:hand(0),title:title()}));
ok('B: P1 can Special Summon this turn',!v46GlobalSpecialSummonRestrictionReason(0),JSON.stringify(v46GlobalSpecialSummonRestrictionReason(0)));
const i2=gameState.players[0].hand.findIndex(c=>c.uid===pot2.uid);
const L2=strictScriptLegalityV2('強欲で謙虚な壺',0,'hand',i2,{cardOverride:pot2,logicalZone:'sz',prospectiveIndex:gameState.players[0].sz.length});
ok('B: the second 強欲で謙虚な壺 is legal this turn',L2.ok,JSON.stringify(L2));
duelActivateFromHand(i2);drive();
ok('B: the second copy resolves and offers its choice',/強欲で謙虚な壺/.test(title()||'')&&candUids().length===3,JSON.stringify({title:title(),toasts:TOASTS.slice(-3)}));
if(pendingChoiceV49(gameState)){pickUid(candUids()[0]);drive();}
ok('B: after the second copy resolves, a third activation is refused (the limit counts resolved activations)',
  (()=>{const c3=mk('強欲で謙虚な壺',0);gameState.players[0].hand.push(c3);const i3=gameState.players[0].hand.length-1;
    const L3=strictScriptLegalityV2('強欲で謙虚な壺',0,'hand',i3,{cardOverride:c3,logicalZone:'sz',prospectiveIndex:gameState.players[0].sz.length});
    gameState.players[0].hand.pop();return !L3.ok;})());
audit('B activation negated');

/* ===== C. save while the resolution choice is open ===== */
B=potBoard();baselineA();
duelActivateFromHand(0);drive();
ok('C setup: the resolution choice is open',/強欲で謙虚な壺/.test(title()||''),JSON.stringify({title:title()}));
globalThis.__C={deck:B.deck.map(c=>c.uid),pot:B.pot.uid};
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';const CU='+JSON.stringify(first.__C)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  ok('C: after load in a fresh VM the choice is still pending with the same three candidates',
    r&&/強欲で謙虚な壺/.test(title()||'')&&JSON.stringify(candUids().slice().sort())===JSON.stringify(CU.deck.slice(0,3).slice().sort()),
    JSON.stringify({r,title:title(),cand:candUids()}));
  pickUid(CU.deck[2]);drive();
  const potH=findCardByUid(CU.pot);
  ok('C: answering it adds サイクロン and 強欲で謙虚な壺 reaches the GY',JSON.stringify(hand(0))===JSON.stringify(['サイクロン'])&&potH&&potH.zone==='grave',
    JSON.stringify({hand:hand(0),pot:potH&&potH.zone,toasts:TOASTS.slice(-3)}));
  audit('C resume');
  `);
}else{console.log('FAIL C did not reach the save point');process.exitCode=2;}

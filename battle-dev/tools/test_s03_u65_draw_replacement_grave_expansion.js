/* S03-U65 C-S03-26 DRAW_REPLACEMENT — GY expansion.
   Requirement: closes the "② Remaining: GY / Field-based cards with the same wording are undeclared" gap left
   by S03-U33 (see docs/S03_U33_REPORT.md / logs/CAPABILITY_NOTES.md C-S03-26). The engine's own candidate scan
   (`drawReplacementCandidatesS03` in engine/1V_draw_replacement_s03.js) only looked at the face-up Monster
   Zone, so a declared GY-based Spell/Trap could never be offered even though `prepareDuelActivation` already
   supports Spell/Trap `activateFrom:['grave']` generically (precedent: 突風, cards/9L_class_a_recovery_04.js's
   equip spell). Extended the scan to also check `P.grave`, and generalized the choice-handler's hardcoded
   `'mz'` zone to the candidate's real zone.
   Declared 5 more cards (cards/HG_claude_s03u65_draw_replacement_grave.js): コアキメイルの鋼核,
   スピリット・バーナー, マジックブラスト, メテオ・プロミネンス (all: add this card from the GY to hand,
   instead of the normal draw) and スカル・フレイム (MZ-declared like the original 3, but its own replacement
   pool is a named GY search, not a Deck search, so it needed a new factory). マジックブラスト and
   メテオ・プロミネンス also got their primary (non-draw-replacement) effect implemented in full; コアキメイルの
   鋼核 / スピリット・バーナー / スカル・フレイム keep an unrelated secondary effect unimplemented (PARTIAL,
   declared in data/script_status_overrides.json — same precedent as ダーク・ジェネラル フリード in S03-U33). */
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
function grave(p){return gameState.players[p].grave.map(nm);}
function requestNormalDraw(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:0,n:1,normal:true});}
function graveDrawPhaseBoard(replacer,deckNames){
  fresh();
  const r=mk(replacer,0);gameState.players[0].grave=[r];
  gameState.players[0].deck=deckNames.map(n=>mk(n,0,'down'));
  gameState.players[0].hand=[];
  gameState.activePlayer=0;gameState.phase='draw';gameState.drawnThisTurn=false;
  baselineA();
  return r;
}

/* ===== A. コアキメイルの鋼核: offered from the GY at the normal draw, adds itself, no normal draw. ===== */
graveDrawPhaseBoard('コアキメイルの鋼核',['ワイト']);
requestNormalDraw();drive();
ok('A: at the normal draw a choice is offered including the GY card (engine scan now covers grave, not just mz)',
  /通常のドロー/.test(title()||'')&&labels().some(l=>l.includes('コアキメイルの鋼核')),JSON.stringify({title:title(),labels:labels()}));
pick('コアキメイルの鋼核');drive();
ok('A: it adds itself from the GY to hand, and there is no normal draw (ワイト stays on top of the Deck)',
  JSON.stringify(hand(0))===JSON.stringify(['コアキメイルの鋼核'])&&grave(0).length===0&&deck(0)[0]==='ワイト'&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),grave:grave(0),deck:deck(0)}));
audit('A コアキメイルの鋼核');

/* ===== B. スピリット・バーナー: same GY self-recursion shape. ===== */
graveDrawPhaseBoard('スピリット・バーナー',['ワイト']);
requestNormalDraw();drive();
pick('スピリット・バーナー');drive();
ok('B: スピリット・バーナー adds itself from the GY to hand',
  JSON.stringify(hand(0))===JSON.stringify(['スピリット・バーナー'])&&grave(0).length===0&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),grave:grave(0)}));
audit('B スピリット・バーナー');

/* ===== C. マジックブラスト: ① hand activation burns 200 per face-up Spellcaster on the field (real path). ===== */
fresh();
const mb=mk('マジックブラスト',0);
const sc1=mk('D・D・M',0),sc2=mk('THE トリッキー',0);
gameState.players[0].hand=[mb];gameState.players[0].mz=[sc1,sc2];
gameState.players[0].lp=8000;gameState.players[1].lp=8000;
baselineA();
const lpBefore=gameState.players[1].lp;
duelActivateFromHand(0);drive();
ok('C: マジックブラスト deals 400 (2 face-up Spellcasters × 200) to the opponent for real',
  gameState.players[1].lp===lpBefore-400,JSON.stringify({lp:gameState.players[1].lp}));
audit('C マジックブラスト burn');

/* ===== D. マジックブラスト: ② offered from the GY at the normal draw, adds itself. ===== */
graveDrawPhaseBoard('マジックブラスト',['ワイト']);
requestNormalDraw();drive();
pick('マジックブラスト');drive();
ok('D: マジックブラスト adds itself from the GY to hand instead of the normal draw',
  JSON.stringify(hand(0))===JSON.stringify(['マジックブラスト'])&&grave(0).length===0&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),grave:grave(0)}));
audit('D マジックブラスト draw replacement');

/* ===== E. メテオ・プロミネンス: set trap, real activation — opponent LP>3000, discard 2, deal 2000. ===== */
fresh();
const mp=mk('メテオ・プロミネンス',0,'down');mp.setTurn=gameState.turn-1;
gameState.players[0].sz=[mp];
gameState.players[0].hand=[mk('ワイト',0),mk('もけもけ',0)];
gameState.players[1].lp=8000;
baselineA();
const lpBeforeE=gameState.players[1].lp;
duelActivateFromZone(0,'sz',0);drive();
pick('ワイト');drive();
pick('もけもけ');drive();
ok('E: メテオ・プロミネンス discards both hand cards as cost and deals 2000 to the opponent for real',
  gameState.players[0].hand.length===0&&gameState.players[0].grave.some(c=>nm(c)==='ワイト')&&gameState.players[0].grave.some(c=>nm(c)==='もけもけ')&&gameState.players[1].lp===lpBeforeE-2000,
  JSON.stringify({hand:hand(0),grave:grave(0),lp:gameState.players[1].lp}));
audit('E メテオ・プロミネンス damage');

/* ===== F. メテオ・プロミネンス: illegal when the opponent's LP is not above 3000. ===== */
fresh();
const mpF=mk('メテオ・プロミネンス',0,'down');mpF.setTurn=gameState.turn-1;
gameState.players[0].sz=[mpF];
gameState.players[0].hand=[mk('ワイト',0),mk('もけもけ',0)];
gameState.players[1].lp=3000;
baselineA();
const legF=strictScriptLegalityV2('メテオ・プロミネンス',0,'sz',0,{});
ok('F: メテオ・プロミネンス is illegal when the opponent has exactly 3000 LP (real legality check)',
  !legF.ok&&/3000/.test(legF.reason||''),JSON.stringify(legF));

/* ===== G. メテオ・プロミネンス: offered from the GY at the normal draw, adds itself. ===== */
graveDrawPhaseBoard('メテオ・プロミネンス',['ワイト']);
requestNormalDraw();drive();
pick('メテオ・プロミネンス');drive();
ok('G: メテオ・プロミネンス adds itself from the GY to hand instead of the normal draw',
  JSON.stringify(hand(0))===JSON.stringify(['メテオ・プロミネンス'])&&grave(0).length===0&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),grave:grave(0)}));
audit('G メテオ・プロミネンス draw replacement');

/* ===== H. スカル・フレイム: MZ-declared, but its own replacement target is a named GY search (not a Deck
   search like the original 3) — confirms the new factory correctly distinguishes the two shapes. ===== */
fresh();
const sf=mk('スカル・フレイム',0);
gameState.players[0].mz=[sf];
gameState.players[0].grave=[mk('バーニング・スカルヘッド',0)];
gameState.players[0].deck=[mk('ワイト',0,'down')];
gameState.players[0].hand=[];
gameState.activePlayer=0;gameState.phase='draw';gameState.drawnThisTurn=false;
baselineA();
requestNormalDraw();drive();
ok('H: at the normal draw, スカル・フレイム offers its GY-search replacement',
  labels().some(l=>l.includes('スカル・フレイム')),JSON.stringify({labels:labels()}));
pick('スカル・フレイム');drive();
ok('H setup: choosing it opens a second, resolution-time choice for which GY copy to add',
  !!pendingChoiceV49(gameState),JSON.stringify({title:title(),labels:labels()}));
pick('バーニング・スカルヘッド');drive();
ok('H: it adds 「バーニング・スカルヘッド」 from the GY (not a Deck search) and there is no normal draw',
  JSON.stringify(hand(0))===JSON.stringify(['バーニング・スカルヘッド'])&&grave(0).length===0&&deck(0)[0]==='ワイト'&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),grave:grave(0),deck:deck(0)}));
audit('H スカル・フレイム grave search');

/* ===== I. Mixed offer: an MZ-declared card and a GY-declared card are both offered together in one choice
   (proves the engine now scans both zones in the SAME offer, the actual point of this unit's engine fix). ===== */
fresh();
const fr=mk('無敗将軍 フリード',0);
gameState.players[0].mz=[fr];
gameState.players[0].grave=[mk('コアキメイルの鋼核',0)];
gameState.players[0].deck=[mk('ワイト',0,'down'),mk('マジック・ストライカー',0,'down')];
gameState.players[0].hand=[];
gameState.activePlayer=0;gameState.phase='draw';gameState.drawnThisTurn=false;
baselineA();
requestNormalDraw();drive();
ok('I: both the MZ card and the GY card appear together in the same draw-replacement offer',
  labels().some(l=>l.includes('無敗将軍 フリード'))&&labels().some(l=>l.includes('コアキメイルの鋼核'))&&labels().length===3,
  JSON.stringify({labels:labels()}));
pick('コアキメイルの鋼核');drive();
ok('I: choosing the GY card resolves correctly even with an MZ candidate also available',
  hand(0).includes('コアキメイルの鋼核')&&gameState.drawnThisTurn===true,JSON.stringify({hand:hand(0)}));
audit('I mixed offer');
`);

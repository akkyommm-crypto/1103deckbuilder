/* S03-U121 (user request): デッキビルダー「このデッキでデュエルする」起動動線 (data/82_builder_launch_s03.js).
   index.html saves currentDeckRecord() ({id,name,cards,side,candidates,memo}; cards/side as {n,q}) to
   sessionStorage["duel1103:launchDeck"] and opens battle.html?from=builder. Real-browser acceptance was done separately
   (both ?from=builder and the normal direct launch); this file pins the flow in the harness. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
setTimeout=(f)=>{ if(typeof f==='function') f(); return 0; };   /* run the flow's deferred screens inline */
/* the harness localStorage has no key()/length; listSavedDecks enumerates keys like a browser does */
{ const KEYS=[]; const si=localStorage.setItem, ri=localStorage.removeItem;
  localStorage.setItem=(k,v)=>{ if(!KEYS.includes(k)) KEYS.push(k); si(k,v); };
  localStorage.removeItem=k=>{ const i=KEYS.indexOf(k); if(i>=0) KEYS.splice(i,1); ri(k); };
  localStorage.key=i=>KEYS[i]==null?null:KEYS[i];
  Object.defineProperty(localStorage,'length',{get:()=>KEYS.length,configurable:true}); }
function setLaunch(search, rec){
  window.location = {search, href:'http://127.0.0.1/battle.html'+search, reload(){}};
  if(rec===undefined) sessionStorage.removeItem('duel1103:launchDeck');
  else sessionStorage.setItem('duel1103:launchDeck', typeof rec==='string' ? rec : JSON.stringify(rec));
}
function REC(){ return {id:'d_launch', name:'ビルダー起動テスト', memo:'', candidates:[{n:'ワイト',q:1}],
  cards:[{n:'サイバー・ドラゴン',q:3},{n:'ワイト',q:3},{n:'存在しないカード名',q:1},{n:'氷結界の龍 ブリューナク',q:1}], side:[{n:'サンダー・ブレイク',q:2}]}; }
function sheetHtml(){ return String(document.getElementById('sheet').innerHTML||''); }
let RESUME_CALLS=0; const ORIG_RESUME=offerResumeDuel; offerResumeDuel=function(){ RESUME_CALLS++; return false; };
/* the boot branch, as runtime/90_boot.js runs it after the card DB is loaded */
function bootBranch(){ if(!(typeof builderLaunchS03==='function' && builderLaunchS03())) offerResumeDuel(); }
`;

/* ===== A. ?from=builder: P1 is set through the existing loader, the key is consumed, P2 selection opens, confirm, start ===== */
harness(COMMON+String.raw`
resetA();
localStorage.setItem('deck1103v2:d_p2', JSON.stringify({id:'d_p2', name:'P2デッキ', cards:[{n:'ワイト',q:3},{n:'ワイトキング',q:2}], side:[], date:'2026-09-24'}));
localStorage.setItem('yg1103_duel_autosave', JSON.stringify({at:Date.now(), turn:3, state:{fake:true}}));
setLaunch('?from=builder', REC());
bootBranch();
const d0=gameState.players[0].loadedDeckV32;
ok('A: the resume dialog is NOT offered (the builder flow has priority)',RESUME_CALLS===0);
ok('A: sessionStorage["duel1103:launchDeck"] is deleted after reading',sessionStorage.getItem('duel1103:launchDeck')===null);
ok('A: Player1 next deck = the builder deck via SET_NEXT_DECK (id, name, side kept; unknown card excluded)',!!d0&&d0.name==='ビルダー起動テスト'&&d0.deckId==='d_launch'&&(d0.main||[]).length===6&&(d0.ex||[]).length===1&&JSON.stringify(d0.side)==='[{"n":"サンダー・ブレイク","q":2}]',JSON.stringify(d0&&{n:d0.name,id:d0.deckId,m:(d0.main||[]).length,e:(d0.ex||[]).length,s:d0.side}));
ok('A: journaled as SET_NEXT_DECK (the existing loader)',v41ReplayPackage(gameState).actions.some(x=>x&&x.action&&x.action.type==='SET_NEXT_DECK'&&x.action.player===0));
ok('A: the unknown card is reported with a button to choose the Player2 deck',/存在しないカード名/.test(sheetHtml())&&/Player2のデッキを選ぶ/.test(sheetHtml()),sheetHtml().slice(0,200));
ok('A: the saved duel is not deleted by the flow itself',!!localStorage.getItem('yg1103_duel_autosave'));
openDeckLoad('saved',1);
ok('A: the existing Player2 deck selection lists the saved deck',DECK_LOAD_PLAYER===1&&/P2デッキ/.test(sheetHtml()));
const key=listSavedDecks().find(d=>d.name==='P2デッキ').key;
loadSavedById(key);
ok('A: after choosing Player2 the first-player confirmation opens',/自分が先攻で開始/.test(sheetHtml())&&/相手が先攻で開始/.test(sheetHtml())&&BUILDER_LAUNCH_S03&&BUILDER_LAUNCH_S03.stage==='confirm',sheetHtml().slice(0,160));
builderLaunchStartS03(1);
ok('A: 相手が先攻で開始 → startSelectedDeckDuel(1): P2 first, both 5-card hands, the flow ends',gameState.firstPlayer===1&&gameState.activePlayer===1&&gameState.players[0].hand.length===5&&gameState.players[1].hand.length===5&&BUILDER_LAUNCH_S03===null,JSON.stringify({fp:gameState.firstPlayer,ap:gameState.activePlayer}));
`);

/* ===== B. 兎ラギア row in the flow → confirmation, 自分が先攻 → startRabbitOpponentDuel(0) ===== */
harness(COMMON+String.raw`
resetA();
setLaunch('?from=builder', REC());
bootBranch();
openDeckLoad('saved',1);
rabbitRowPickS03();
ok('B: the 兎ラギア row inside the flow opens the confirmation (no immediate start)',BUILDER_LAUNCH_S03&&BUILDER_LAUNCH_S03.p2==='rabbit'&&/自分が先攻で開始/.test(sheetHtml())&&gameState.players[0].hand.length===0);
builderLaunchStartS03(0);
ok('B: 自分が先攻で開始 → P1 first vs 兎ラギア',gameState.firstPlayer===0&&gameState.players[1].deck.length+gameState.players[1].hand.length===40&&BUILDER_LAUNCH_S03===null,JSON.stringify({fp:gameState.firstPlayer,d1:gameState.players[1].deck.length}));
`);

/* ===== C. normal direct launch is unchanged; missing / broken data falls back to the normal start ===== */
harness(COMMON+String.raw`
resetA();
setLaunch('', REC());
bootBranch();
ok('C: without from=builder: the resume dialog path runs, nothing is loaded, the stored deck is not consumed',RESUME_CALLS===1&&!gameState.players[0].loadedDeckV32&&sessionStorage.getItem('duel1103:launchDeck')!==null);
RESUME_CALLS=0;
setLaunch('?from=builder', undefined);
bootBranch();
ok('C: from=builder but no deck → toast, normal start (resume dialog path)',RESUME_CALLS===1&&TOASTS.some(t=>/ビルダーからのデッキがありません/.test(t)));
RESUME_CALLS=0;
setLaunch('?from=builder', '{broken');
bootBranch();
ok('C: broken JSON → toast, normal start, the key is still deleted',RESUME_CALLS===1&&TOASTS.some(t=>/読めませんでした/.test(t))&&sessionStorage.getItem('duel1103:launchDeck')===null);
RESUME_CALLS=0;
/* the plain 兎ラギア row outside the flow keeps its old behavior (immediate start) */
resetA();
DECK_LOAD_PLAYER=0;applySavedDeckS03(normalizeSavedDeckEntry(REC(),'x','t'));
rabbitRowPickS03();
ok('C: outside the flow the 兎ラギア row still starts immediately',gameState.players[0].hand.length===5&&gameState.players[1].hand.length===5);
`);

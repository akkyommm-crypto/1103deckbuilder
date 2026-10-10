/* S03-U06: normal-play 「兎ラギアと対戦開始」 (user request 2026-09-11).
   - Player 1 keeps the deck the user loaded; Player 2 gets the 1103兎ラギア sample; fresh duel, both shuffled, both draw 5.
   - Without a user-loaded Player 1 deck nothing starts and the user is asked to load one.
   - The developer both-sides rabbit start (startTestDuel) is kept and is not treated as a user deck.
   The user deck is the standard 40+15 test list, loaded through the normal parse/apply path. */
const harness=require('./astra_harness');
const fs=require('fs'),path=require('path');
const COMMON=String.raw`
const TOASTS=[];showToast=(m)=>TOASTS.push(String(m));
function multiset(ids){const m={};ids.forEach(id=>{m[id]=(m[id]||0)+1;});return JSON.stringify(Object.keys(m).sort().map(k=>[k,m[k]]));}
function ids(p,zones){const out=[];for(const z of zones)for(const c of (gameState.players[p][z]||[]))if(c&&!c.token)out.push(c.id);return out;}
function rabbitIds(){const r=buildTestDeck('rabbit');return {main:r.main.map(c=>c.id),ex:r.ex.map(c=>c.id)};}
const USER_TEXT=TEST_DECK.cards.map(e=>e.n+' x'+e.q).join('\n')+'\n■エクストラ\n'+TEST_DECK.ex.map(e=>e.n+' x'+e.q).join('\n');
`;

const first=harness(COMMON+String.raw`
/* 1. No Player 1 deck: refuse and ask the user to load one. */
resetA();TOASTS.length=0;
let before=JSON.stringify(gameState.players.map(P=>[P.deck.length,P.hand.length,P.ex.length]));
ok('no P1 deck: 兎ラギアと対戦開始 does not start',startRabbitOpponentDuel()===false);
ok('no P1 deck: user is asked to load Player 1 deck',TOASTS.some(t=>t.includes('先にプレイヤー1のデッキを読み込んでください')));
ok('no P1 deck: board is unchanged and P1 is not filled with 兎ラギア',JSON.stringify(gameState.players.map(P=>[P.deck.length,P.hand.length,P.ex.length]))===before);

/* 2. Developer both-sides start is kept, and its rabbit deck is not a user deck. */
startTestDuel(true,0,'rabbit');TOASTS.length=0;
const RAB=rabbitIds();
ok('developer start still gives 兎ラギア to both players',multiset(ids(0,['deck','hand']))===multiset(RAB.main)&&multiset(ids(1,['deck','hand']))===multiset(RAB.main));
ok('developer rabbit deck is marked as a test deck',gameState.players[0].loadedDeckV32.source==='test');
ok('developer rabbit deck is not accepted as the Player 1 user deck',startRabbitOpponentDuel()===false&&TOASTS.some(t=>t.includes('先にプレイヤー1のデッキを読み込んでください')));

/* 3. User deck through the normal load path, some play, then 兎ラギアと対戦開始. */
resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
const parsed=parseDeckText(USER_TEXT);
/* capture the list before loading: LOAD_DECK uses the parsed array itself as the live Deck, which draws then change */
const userMain=parsed.main.map(c=>c.id),userEx=parsed.ex.map(c=>c.id);
applyLoad(0,parsed,true);
ok('user deck loaded for Player 1 is recorded as source user',!!gameState.players[0].loadedDeckV32&&gameState.players[0].loadedDeckV32.source==='user'&&multiset(gameState.players[0].loadedDeckV32.main)===multiset(userMain)&&userMain.length===40);
act({type:'MOVE',player:0,from:'hand',fromIndex:0,to:'grave'});
ok('board is mid-play before the new duel',gameState.players[0].grave.length===1);
globalThis.__SAVE=JSON.stringify({state:gameState});
TOASTS.length=0;
ok('兎ラギアと対戦開始 starts',startRabbitOpponentDuel()===true&&TOASTS.some(t=>t.includes('対戦')));
let P0=gameState.players[0],P1=gameState.players[1];
ok('Player 1 keeps the loaded user deck (not overwritten by 兎ラギア)',multiset(ids(0,['deck','hand']))===multiset(userMain)&&multiset(P0.ex.map(c=>c.id))===multiset(userEx)&&P0.loadedDeckV32.source==='user');
ok('Player 2 is the 1103兎ラギア sample',multiset(ids(1,['deck','hand']))===multiset(RAB.main)&&multiset(P1.ex.map(c=>c.id))===multiset(RAB.ex)&&P1.loadedDeckV32.source==='opponentSample');
ok('fresh duel: both drew 5, no leftover board, turn 1 draw phase',P0.hand.length===5&&P1.hand.length===5&&P0.grave.length===0&&P1.grave.length===0&&P0.mz.length===0&&gameState.turn===1&&gameState.phase==='draw'&&gameState.chain.length===0);
const J=V41_ACTION_JOURNAL.map(x=>x.action.type);
ok('both decks loaded and shuffled by actions',J.filter(t=>t==='LOAD_DECK').length===2&&J.filter(t=>t==='SHUFFLE').length===2&&J.filter(t=>t==='DRAW').length===2);
const pkg=v41ReplayPackage(gameState),audit=v44ReplayAuditPackage(pkg);
ok('opponent duel start Replay is consistent',pkg.actions.length>0&&audit.ok,JSON.stringify(audit));
ok('rematch keeps the user deck for Player 1',startRabbitOpponentDuel()===true&&multiset(ids(0,['deck','hand']))===multiset(userMain)&&multiset(ids(1,['deck','hand']))===multiset(RAB.main));
`);

if(first.__SAVE){
 harness('const SAVED='+JSON.stringify(first.__SAVE)+';'+COMMON+String.raw`
 resetA();gameState=JSON.parse(SAVED).state;
 if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
 if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
 ok('VM2: saved Player 1 user deck is still recognised',!!gameState.players[0].loadedDeckV32&&gameState.players[0].loadedDeckV32.source==='user');
 const userMain=gameState.players[0].loadedDeckV32.main.slice();
 ok('VM2: 兎ラギアと対戦開始 works after reload',startRabbitOpponentDuel()===true&&gameState.players[1].loadedDeckV32.source==='opponentSample'&&gameState.players[0].hand.length===5&&multiset(ids(0,['deck','hand']))===multiset(userMain));
 `);
}else{console.log('FAIL VM2 save missing');process.exitCode=2;}

/* Built single HTML labels (generated from sources). */
const html=fs.readFileSync(path.join(__dirname,'..','dist','battle.html'),'utf8');
for(const [name,v] of [
 ['home button label is 兎ラギアと対戦開始',html.includes('>兎ラギアと対戦開始</button>')&&!html.includes('兎ラギアでランダム開始')],
 ['menu entry uses the opponent start',html.includes('startRabbitOpponentDuel()">⚡ 兎ラギアと対戦開始')],
 ['deck list shows the opponent-only sample',html.includes('1103兎ラギア（対戦相手用）')&&!html.includes('1103兎ラギア・ランダム')],
 ['developer both-sides 兎ラギア is kept separately',html.includes('両側1103兎ラギア')&&html.includes("startTestDuel(true,0,'rabbit')")],
]){console.log((v?'PASS ':'FAIL ')+'S03-U06 '+name);if(!v)process.exitCode=2;}

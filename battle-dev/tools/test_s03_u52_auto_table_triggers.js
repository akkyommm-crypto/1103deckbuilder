/* S03-U52 AUTO_DECK_TABLE "ignition" entries that must be triggers — ジュラック・ヴェロー, カラクリ兵 弐参六, ワーム・カルタロス.
   Found by a DUEL probe after R1 (【Jurrac】 vs 1103兎ラギア): a face-up copy could Special Summon / search from the Deck at will in Main Phase.
   2011 sources (yugioh-wiki): 《ジュラック・ヴェロー》 age 33 (2011-08-20); 《カラクリ兵 弐参六》 age 12 (2011-08-04); 《ワーム・カルタロス》 age 13 (2009-11-06).
   Cards named here: ジュラック・ヴェロー, カラクリ兵 弐参六, ワーム・カルタロス (PARTIAL → TESTED, declared); ジュラック・ガリム (TESTED);
   ジェネティック・ワーウルフ, ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;globalThis.__PICK=null;}
const SEEN=[];
function settle(take){for(let i=0;i<600;i++){
  const q=pendingChoiceV49(gameState);
  if(q){const want=globalThis.__PICK||[];const k=q.candidates.findIndex(c=>want.includes(c.uid));__choicePickV49(k>=0?k:0);continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];g.forEach(c=>SEEN.push(c.name));const k=g.findIndex(c=>c.name===take);if(k>=0)eventPickV2(k);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
/* the Battle Phase and the attacking player are set before baselineA() so the Replay start state matches */
function battleBoard(){gameState.phase='battle';gameState.activePlayer=1;}
function attack(attackerIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:attackerIdx,target});}

/* ===== A. no effect at will in Main Phase (the illegal step) ===== */
for(const name of ['ジュラック・ヴェロー','カラクリ兵 弐参六','ワーム・カルタロス']){
  fresh();
  const c=mk(name,0);gameState.players[0].mz=[c];
  gameState.players[0].deck=[mk('ジュラック・ガリム',0,'down'),mk(name,0,'down')];
  baselineA();
  const ids=getLegalZoneActions(0,'mz',0).map(a=>a.id);
  const L=strictScriptLegalityV2(name,0,'mz',0,{});
  ok('A: face-up '+name+' offers no effect activation in Main Phase',!ids.includes('effect')&&!L.ok,JSON.stringify({ids,L}));
}

/* ===== B. ジュラック・ヴェロー destroyed by battle in attack position → optional Special Summon of ATK ≤ 1700 「ジュラック」 ===== */
fresh();
{
  const velo=mk('ジュラック・ヴェロー',0);gameState.players[0].mz=[velo];
  const galim=mk('ジュラック・ガリム',0,'down');gameState.players[0].deck=[galim];
  const wolf=mk('ジェネティック・ワーウルフ',1);gameState.players[1].mz=[wolf];
  battleBoard();baselineA();
  SEEN.length=0;globalThis.__PICK=[galim.uid];
  attack(0,0);settle('ジュラック・ヴェロー');
  ok('B: ジュラック・ヴェロー was destroyed by battle, its trigger was offered and ジュラック・ガリム is Special Summoned from the Deck',
    zoneOf(velo)==='grave'&&SEEN.includes('ジュラック・ヴェロー')&&zoneOf(galim)==='mz',JSON.stringify({velo:zoneOf(velo),galim:zoneOf(galim),seen:SEEN,toasts:TOASTS.slice(-3)}));
  audit('B');
}

/* ===== C. ジュラック・ヴェロー destroyed by battle in defense position → not offered ===== */
fresh();
{
  const velo=mk('ジュラック・ヴェロー',0,'up','def');gameState.players[0].mz=[velo];
  const galim=mk('ジュラック・ガリム',0,'down');gameState.players[0].deck=[galim];
  const wolf=mk('ジェネティック・ワーウルフ',1);gameState.players[1].mz=[wolf];
  battleBoard();baselineA();
  SEEN.length=0;
  attack(0,0);settle('ジュラック・ヴェロー');
  ok('C: destroyed in defense position, ジュラック・ヴェロー is not offered and ジュラック・ガリム stays in the Deck',
    zoneOf(velo)==='grave'&&!SEEN.includes('ジュラック・ヴェロー')&&zoneOf(galim)==='deck',JSON.stringify({velo:zoneOf(velo),galim:zoneOf(galim),seen:SEEN}));
}

/* ===== D. カラクリ兵 弐参六 destroyed by battle → Special Summon a Level 4 or lower 「カラクリ」 in attack position ===== */
fresh();
{
  const k=mk('カラクリ兵 弐参六',0,'up','def');gameState.players[0].mz=[k];
  const k2=mk('カラクリ兵 弐参六',0,'down');gameState.players[0].deck=[k2];
  const wolf=mk('ジェネティック・ワーウルフ',1);gameState.players[1].mz=[wolf];
  battleBoard();baselineA();
  SEEN.length=0;globalThis.__PICK=[k2.uid];
  attack(0,0);settle('カラクリ兵 弐参六');
  ok('D: カラクリ兵 弐参六 was destroyed by battle and the second copy is Special Summoned in face-up attack position',
    zoneOf(k)==='grave'&&SEEN.includes('カラクリ兵 弐参六')&&zoneOf(k2)==='mz'&&k2.face==='up'&&k2.pos==='atk',JSON.stringify({k:zoneOf(k),k2:zoneOf(k2),pos:k2.pos,seen:SEEN}));
  audit('D');
}

/* ===== E. ワーム・カルタロス flipped by an attack → adds a Level 4 or lower 「ワーム」 Reptile to the hand ===== */
fresh();
{
  const w=mk('ワーム・カルタロス',0,'down','def');w.setTurn=4;gameState.players[0].mz=[w];
  const w2=mk('ワーム・カルタロス',0,'down');gameState.players[0].deck=[w2];
  const wight=mk('ワイト',1);gameState.players[1].mz=[wight];
  battleBoard();baselineA();
  SEEN.length=0;globalThis.__PICK=[w2.uid];
  attack(0,0);settle('ワーム・カルタロス');
  ok('E: flipped by the attack, ワーム・カルタロス adds the other copy from the Deck to the hand',
    w.face==='up'&&zoneOf(w2)==='hand',JSON.stringify({face:w.face,w2:zoneOf(w2),seen:SEEN,toasts:TOASTS.slice(-3)}));
  audit('E');
}
`);

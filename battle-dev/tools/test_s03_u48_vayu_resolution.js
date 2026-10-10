/* S03-U48 BF－大旆のヴァーユ resolution (real-duel stop).
   Found by R1 on Astra's fixed lists (【BF】 vs 1103兎ラギア, R1_DECKS=bf,rabbit, seed 0x52310501, first 1, turn 14): SYSTEM_FAULT
   「BF－大旆のヴァーユ 解決エラー：Cannot read properties of undefined (reading 'undefined')」. The stack (diagnostic harness) was
   resolveTarget ← API.setCardFlag ← the card's resolve: the negation flag was set on {card:h.card} where h = locateCard(...), and
   locateCard returns {p, zone, index} without the card.
   2011 source: yugioh-wiki 《ＢＦ－大旆のヴァーユ》 age 62 (2011-03-23): ignition effect in the GY; this card and the targeted non-Tuner
   「ＢＦ」 are banished at resolution (09/04/18, 09/05/06); if either left the GY, neither is banished and nothing is summoned (09/05/12);
   negated by 王宮の弾圧 the materials stay in the GY (09/04/18); the summoned monster's effects are negated.
   The 09/05/12 case (a target leaves the GY in response) is not covered here: the only TESTED response tried, 転生の予言, did not reach the
   chain after its two target picks in DUEL (recorded as a separate defect).
   Cards named here: BF－大旆のヴァーユ (IMPLEMENTED → TESTED, declared); BF－漆黒のエルフェン, BF－アーマード・ウィング,
   BF－アームズ・ウィング, 王宮の弾圧 (TESTED). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;globalThis.__PICK=null;}
/* answer choices by uid (single or multi-select), else the first candidate */
function answer(){
  const q=pendingChoiceV49(gameState);if(!q)return false;
  const want=globalThis.__PICK||[];
  const idx=q.candidates.map((c,i)=>want.includes(c.uid)?i:-1).filter(i=>i>=0);
  const max=(q.max==null?1:q.max);
  if(max>1&&idx.length){CHOICE_UI_SEL_V49=[];idx.slice(0,max).forEach(i=>{if(pendingChoiceV49(gameState))__choicePickV49(i);});if(pendingChoiceV49(gameState))__choiceCommitV49();return true;}
  __choicePickV49(idx.length?idx[0]:0);return true;
}
function driveTo(name){for(let i=0;i<400;i++){
  if(gameState.chainWindow&&gameState.chain.length&&gameState.chain[gameState.chain.length-1].name===name)return 'window';
  if(pendingChoiceV49(gameState)){answer();continue;}
  if(EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let i=0;i<400;i++){
  if(pendingChoiceV49(gameState)){answer();continue;}
  if(EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function activateVayu(vayu,mate,ex){
  globalThis.__PICK=[mate.uid,ex.uid];
  const i=gameState.players[0].grave.indexOf(vayu);
  duelActivateFromZone(0,'grave',i,{});
  return driveTo('BF－大旆のヴァーユ');
}

/* ===== A. normal resolution: ヴァーユ + BF－漆黒のエルフェン (Lv1 + Lv6) → BF－アーマード・ウィング (Lv7), effects negated ===== */
fresh();
{
  const vayu=mk('BF－大旆のヴァーユ',0), elf=mk('BF－漆黒のエルフェン',0), armored=mk('BF－アーマード・ウィング',0);
  gameState.players[0].grave=[vayu,elf];gameState.players[0].ex=[armored];
  baselineA();
  const r=activateVayu(vayu,elf,armored);
  const link=gameState.chain[gameState.chain.length-1]||{};
  ok('A: the GY ignition effect is on the chain',r==='window'&&link.name==='BF－大旆のヴァーユ',JSON.stringify({r,chain:gameState.chain.map(l=>l.name),toasts:TOASTS.slice(-3)}));
  settle();
  ok('A: no resolution fault; both cards are banished; BF－アーマード・ウィング is Special Summoned with its effects negated',
    !gameState.systemFault&&zoneOf(vayu)==='banish'&&zoneOf(elf)==='banish'&&zoneOf(armored)==='mz'&&effectNegated(armored)===true,
    JSON.stringify({fault:gameState.systemFault||null,vayu:zoneOf(vayu),elf:zoneOf(elf),armored:zoneOf(armored),negated:effectNegated(armored)}));
  ok('A: it is not a Synchro Summon (2011: 09/04/18)',armored.specialSummonKind!=='synchro',JSON.stringify({kind:armored.specialSummonKind}));
  audit('A');
}

/* ===== A2. the R1 pattern: a Synchro BF－アームズ・ウィング (Lv6, non-Tuner) as the other material ===== */
fresh();
{
  const vayu=mk('BF－大旆のヴァーユ',0), arms=mk('BF－アームズ・ウィング',0), armored=mk('BF－アーマード・ウィング',0);
  gameState.players[0].grave=[vayu,arms];gameState.players[0].ex=[armored];
  baselineA();
  const r=activateVayu(vayu,arms,armored);
  settle();
  ok('A2: no resolution fault; BF－アームズ・ウィング and ヴァーユ are banished; BF－アーマード・ウィング is on the field with its effects negated',
    r==='window'&&!gameState.systemFault&&zoneOf(vayu)==='banish'&&zoneOf(arms)==='banish'&&zoneOf(armored)==='mz'&&effectNegated(armored)===true,
    JSON.stringify({r,fault:gameState.systemFault||null,vayu:zoneOf(vayu),arms:zoneOf(arms),armored:zoneOf(armored)}));
  audit('A2');
}

/* ===== C. negated by 王宮の弾圧: the materials stay in the GY (09/04/18) ===== */
fresh();
{
  const vayu=mk('BF－大旆のヴァーユ',0), elf=mk('BF－漆黒のエルフェン',0), armored=mk('BF－アーマード・ウィング',0);
  gameState.players[0].grave=[vayu,elf];gameState.players[0].ex=[armored];
  const ro=mk('王宮の弾圧',1);gameState.players[1].sz=[ro];
  baselineA();
  const r=activateVayu(vayu,elf,armored);
  const resp=r==='window'?getChainResponsesV2(1):[];
  ok('C: 王宮の弾圧 is offered against the Special Summon effect',resp.some(x=>x.card===ro),JSON.stringify(resp.map(x=>x.db.n)));
  if(resp.some(x=>x.card===ro))duelActivateResponseV2(1,'sz',0);
  settle();
  ok('C: the effect is negated: ヴァーユ and BF－漆黒のエルフェン stay in the GY, nothing is summoned, player 1 paid 800',
    !gameState.systemFault&&zoneOf(vayu)==='grave'&&zoneOf(elf)==='grave'&&zoneOf(armored)==='ex'&&gameState.players[1].lp===7200,
    JSON.stringify({fault:gameState.systemFault||null,vayu:zoneOf(vayu),elf:zoneOf(elf),armored:zoneOf(armored),lp:gameState.players[1].lp}));
  audit('C');
}
`);

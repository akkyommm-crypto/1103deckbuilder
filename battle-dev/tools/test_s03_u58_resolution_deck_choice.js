/* S03-U58 C-S03-40 RESOLUTION_DECK_CHOICE — non-target Deck choices happen at resolution.
   Representative cards: 増援, おろかな埋葬, テラ・フォーミング, ワン・フォー・ワン.
   These cards do not target Deck cards. Before U58 their legacy selectTargets fixed the Deck card at activation time. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const h=findCardByUid(c.uid);return h&&h.zone;}
function handNames(p){return gameState.players[p].hand.map(nm);}
function graveNames(p){return gameState.players[p].grave.map(nm);}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function fresh(){
  resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';
}
function drive(stopAtChoice){
  for(let i=0;i<500;i++){
    if(pendingChoiceV49(gameState)) return 'choice';
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    return 'idle';
  }
  return 'loop';
}
function pickUid(uid){
  const q=pendingChoiceV49(gameState);
  if(!q) return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);
  if(i<0) return false;
  __choicePickV49(i);
  return true;
}
function choiceUids(){const q=pendingChoiceV49(gameState);return q?q.candidates.map(c=>c.uid):[];}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function activateSpellAndRemoveFirst(spellName,deckNames){
  fresh();
  const spell=mk(spellName,0);
  const deck=deckNames.map(n=>mk(n,0));
  gameState.players[0].hand=[spell];
  gameState.players[0].deck=deck.slice();
  baselineA();
  duelActivateFromHand(0);
  ok(cardName(spell)+': activation creates a chain link without opening a Deck choice',
    gameState.chain.length===1&&!pendingChoiceV49(gameState)&&!(gameState.chain[0].targets||[]).length,
    JSON.stringify({chain:gameState.chain.map(l=>({name:l.name,targets:l.targets})),choice:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title}));
  act({type:'FX_MILL',player:0,deckIndex:0,reason:'U58 pre-resolution deck change'});
  return {r:drive(true),spell,deck};
}

/* ===== A. 増援: if the first warrior leaves the Deck before resolution, the remaining warrior is chosen at resolution. ===== */
let P=activateSpellAndRemoveFirst('増援',['切り込み隊長','E・HERO エアーマン','サイクロン']);
let r=P.r, spell=P.spell, a=P.deck[0], b=P.deck[1];
ok('A: 増援 opens the Deck choice at resolution using current Deck contents',r==='choice'&&choiceUids().includes(b.uid)&&!choiceUids().includes(a.uid),
  JSON.stringify({r,title:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title,cands:choiceUids(),a:zoneOf(a),b:zoneOf(b)}));
pickUid(b.uid);drive();
ok('A: 増援 adds the resolution-selected warrior',handNames(0).includes('E・HERO エアーマン')&&zoneOf(a)==='grave'&&zoneOf(spell)==='grave',
  JSON.stringify({hand:handNames(0),grave:graveNames(0),spell:zoneOf(spell)}));
audit('A');

/* ===== B. おろかな埋葬: the monster sent to the GY is chosen at resolution. ===== */
P=activateSpellAndRemoveFirst('おろかな埋葬',['クリッター','ライオウ','サイクロン']);
r=P.r; spell=P.spell; a=P.deck[0]; b=P.deck[1];
ok('B: おろかな埋葬 opens the Deck choice at resolution using current Deck contents',r==='choice'&&choiceUids().includes(b.uid)&&!choiceUids().includes(a.uid),
  JSON.stringify({r,title:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title,cands:choiceUids(),a:zoneOf(a),b:zoneOf(b)}));
pickUid(b.uid);drive();
ok('B: おろかな埋葬 mills the resolution-selected monster',graveNames(0).includes('ライオウ')&&zoneOf(a)==='grave'&&zoneOf(spell)==='grave',
  JSON.stringify({grave:graveNames(0),spell:zoneOf(spell)}));
audit('B');

/* ===== C. テラ・フォーミング: field Spell search is chosen at resolution. ===== */
P=activateSpellAndRemoveFirst('テラ・フォーミング',['竜の渓谷','天空の聖域','サイクロン']);
r=P.r; spell=P.spell; a=P.deck[0]; b=P.deck[1];
ok('C: テラ・フォーミング opens the field Spell choice at resolution using current Deck contents',r==='choice'&&choiceUids().includes(b.uid)&&!choiceUids().includes(a.uid),
  JSON.stringify({r,title:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title,cands:choiceUids(),a:zoneOf(a),b:zoneOf(b)}));
pickUid(b.uid);drive();
ok('C: テラ・フォーミング adds the resolution-selected field Spell',handNames(0).includes('天空の聖域')&&zoneOf(a)==='grave'&&zoneOf(spell)==='grave',
  JSON.stringify({hand:handNames(0),grave:graveNames(0),spell:zoneOf(spell)}));
audit('C');

/* ===== D. ワン・フォー・ワン: only the discard is chosen at activation; the Level 1 monster is chosen at resolution. ===== */
fresh();
spell=mk('ワン・フォー・ワン',0); const cost=mk('クリッター',0), lv1a=mk('ワイト',0), lv1b=mk('黄泉ガエル',0), non=mk('サイクロン',0);
gameState.players[0].hand=[spell,cost];
gameState.players[0].deck=[lv1a,lv1b,non];
baselineA();
duelActivateFromHand(0);
ok('D setup: ワン・フォー・ワン asks only for its discard at activation',pendingChoiceV49(gameState)&&/捨てるモンスター/.test(pendingChoiceV49(gameState).title)&&choiceUids().includes(cost.uid)&&!choiceUids().includes(lv1a.uid),
  JSON.stringify({title:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title,cands:choiceUids()}));
pickUid(cost.uid);
ok('D setup: after the discard choice, the chain link exists and no Deck monster is fixed as a target',
  gameState.chain.length===1&&!pendingChoiceV49(gameState)&&((gameState.chain[0].targets||[]).length===1),
  JSON.stringify({chain:gameState.chain.map(l=>({name:l.name,targets:l.targets})),choice:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title}));
act({type:'FX_MILL',player:0,deckIndex:0,reason:'U58 pre-resolution level1 removed'});
r=drive(true);
ok('D: ワン・フォー・ワン opens the Level 1 Deck choice at resolution using current Deck contents',r==='choice'&&choiceUids().includes(lv1b.uid)&&!choiceUids().includes(lv1a.uid),
  JSON.stringify({r,title:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title,cands:choiceUids(),a:zoneOf(lv1a),b:zoneOf(lv1b)}));
pickUid(lv1b.uid);drive();
ok('D: ワン・フォー・ワン discards the cost and summons the resolution-selected Level 1',graveNames(0).includes('クリッター')&&mzNames(0).includes('黄泉ガエル')&&zoneOf(spell)==='grave',
  JSON.stringify({grave:graveNames(0),mz:mzNames(0),spell:zoneOf(spell)}));
audit('D');
`);

/* S03-U46 C-S03-37 SHARED_USE_AND_SPECIAL_SUMMON_EFFECT_LINK — 王宮の弾圧 on the DUEL path, used by its controller and by the opponent.
   Found by R1 on Astra's fixed lists (六武衆 vs 1103兎ラギア, seed 0x52310305 first 1): 王宮の弾圧 was only a manual-only set activation.
   The same unit makes 神の警告 answer the major-deck Special Summon effects that did not declare it (六武衆の荒行 etc.).
   2011 source: yugioh-wiki 《王宮の弾圧》 age 42 (2011-08-28).
   Cards named here: 王宮の弾圧 (ENGINE_GAP → TESTED) and 神の警告 (IMPLEMENTED → TESTED), declared in data/s03_status_changes.json;
   サイバー・ドラゴン, 死者蘇生, サイクロン, 六武衆の荒行, 真六武衆－キザン, 六武衆－ザンジ (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;globalThis.__PICK=null;}
function step(){
  const q=pendingChoiceV49(gameState);
  if(q){const want=globalThis.__PICK;const i=want?q.candidates.findIndex(c=>want.includes(c.uid)):-1;__choicePickV49(i>=0?i:0);return 'choice';}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chainPass';}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'pointPass';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return 'idle';
}
function settle(){for(let i=0;i<400;i++){if(step()==='idle')return 'idle';}return 'loop';}
function journal(){return (v41ReplayPackage(gameState).actions||[]).map(x=>x&&x.action).filter(Boolean);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function setCard(n,p,turn){const c=mk(n,p,'down');c.setTurn=turn==null?4:turn;return c;}
function procedureCyber(){runSummonProcedure('サイバー・ドラゴン',0,'hand',0);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure('サイバー・ドラゴン',0,'hand',0,'atk');}

/* ===== A. summon window: a set 王宮の弾圧 negates サイバー・ドラゴン's summon-rule Special Summon ===== */
fresh();
{
  const cy=mk('サイバー・ドラゴン',0);gameState.players[0].hand=[cy];
  gameState.players[1].mz=[mk('ワイト',1)];
  const ro=setCard('王宮の弾圧',1);gameState.players[1].sz=[ro];
  baselineA();
  procedureCyber();
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('A: the summon-negation window offers the set 王宮の弾圧 to its controller',neg.some(x=>x.card===ro&&x.p===1&&x.ownerS03==null),JSON.stringify({pending:!!gameState.pendingSummon,neg:neg.map(x=>[x.db.n,x.p,x.ownerS03])}));
  activateSummonNegatorV2(1,'sz',0);settle();
  ok('A: the controller pays 800, サイバー・ドラゴン does not reach the field, 王宮の弾圧 stays face-up',
    gameState.players[1].lp===7200&&gameState.players[0].lp===8000&&zoneOf(cy)==='grave'&&!gameState.pendingSummon&&zoneOf(ro)==='sz'&&ro.face==='up',
    JSON.stringify({lp:[gameState.players[0].lp,gameState.players[1].lp],cy:zoneOf(cy),ro:[zoneOf(ro),ro.face],pending:!!gameState.pendingSummon}));
  audit('A');
}

/* ===== B. summon window: the opponent uses the summoning player's face-up 王宮の弾圧 ===== */
fresh();
{
  const cy=mk('サイバー・ドラゴン',0);gameState.players[0].hand=[cy];
  gameState.players[1].mz=[mk('ワイト',1)];
  const ro=mk('王宮の弾圧',0);gameState.players[0].sz=[ro];
  baselineA();
  procedureCyber();
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('B: the window offers player 1 the effect of player 0\'s face-up 王宮の弾圧',neg.some(x=>x.card===ro&&x.p===1&&x.ownerS03===0),JSON.stringify(neg.map(x=>[x.db.n,x.p,x.ownerS03])));
  activateSummonNegatorV2(1,'sz',0,0);
  const add=journal().filter(a=>a.type==='CHAIN_ADD'&&a.name==='王宮の弾圧');
  ok('B: the chain link belongs to player 1 and records the zone owner',add.length===1&&add[0].player===1&&add[0].zoneOwnerS03===0,JSON.stringify(add.map(a=>[a.player,a.zoneOwnerS03])));
  settle();
  ok('B: player 1 pays 800 (not the controller); the summon is negated; 王宮の弾圧 stays on player 0\'s field',
    gameState.players[1].lp===7200&&gameState.players[0].lp===8000&&zoneOf(cy)==='grave'&&findCardByUid(ro.uid).p===0&&zoneOf(ro)==='sz',
    JSON.stringify({lp:[gameState.players[0].lp,gameState.players[1].lp],cy:zoneOf(cy),ro:zoneOf(ro)}));
  audit('B');
}

/* ===== C. chain: a set 王宮の弾圧 answers 死者蘇生; its effect is negated and it is destroyed on the field ===== */
fresh();
{
  const rez=mk('死者蘇生',0);gameState.players[0].hand=[rez];
  const wight=mk('ワイト',0);gameState.players[0].grave=[wight];
  const ro=setCard('王宮の弾圧',1);gameState.players[1].sz=[ro];
  baselineA();
  globalThis.__PICK=[wight.uid];
  duelActivateFromHand(0);
  for(let i=0;i<10&&pendingChoiceV49(gameState);i++)step();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
  ok('C: player 1 is offered the set 王宮の弾圧 in response to 死者蘇生',resp.some(x=>x.card===ro),JSON.stringify({chain:gameState.chain.map(l=>l.name),resp:resp.map(x=>x.db.n),toasts:TOASTS.slice(-3)}));
  duelActivateResponseV2(1,'sz',0);settle();
  const neg=journal().filter(a=>a.type==='CHAIN_NEGATE_LINK');
  ok('C: 死者蘇生\'s effect (not its activation) is negated; ワイト stays in the GY; 死者蘇生 is destroyed; player 1 pays 800',
    neg.length===1&&neg[0].mode==='effect'&&zoneOf(wight)==='grave'&&zoneOf(rez)==='grave'&&gameState.players[1].lp===7200&&zoneOf(ro)==='sz'&&ro.face==='up',
    JSON.stringify({neg,wight:zoneOf(wight),rez:zoneOf(rez),lp:gameState.players[1].lp,ro:[zoneOf(ro),ro.face]}));
  audit('C');
}

/* ===== D. chain: the opponent uses player 0's face-up 王宮の弾圧 against 六武衆の荒行; no second use on top of it ===== */
fresh();
{
  const kizan=mk('真六武衆－キザン',0);gameState.players[0].mz=[kizan];
  const zanji=mk('六武衆－ザンジ',0,'down');gameState.players[0].deck=[zanji];
  const trial=mk('六武衆の荒行',0);gameState.players[0].hand=[trial];
  const ro=mk('王宮の弾圧',0);gameState.players[0].sz=[ro];
  baselineA();
  globalThis.__PICK=[kizan.uid,zanji.uid];
  duelActivateFromHand(0);
  for(let i=0;i<10&&pendingChoiceV49(gameState);i++)step();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
  const hit=resp.find(x=>x.card===ro);
  ok('D: player 1 is offered player 0\'s face-up 王宮の弾圧 against 六武衆の荒行 (a Special Summon effect)',!!hit&&hit.ownerS03===0,JSON.stringify({chain:gameState.chain.map(l=>l.name),resp:resp.map(x=>[x.db.n,x.ownerS03])}));
  duelActivateResponseV2(1,'sz',0,0);
  const again0=getChainResponsesV2(0).some(x=>x.card===ro), again1=getChainResponsesV2(1).some(x=>x.card===ro);
  ok('D: with 王宮の弾圧 on top, neither player can use it again (it only chains directly to the Special Summon effect)',!again0&&!again1,JSON.stringify({again0,again1,chain:gameState.chain.map(l=>l.name)}));
  settle();
  ok('D: 六武衆－ザンジ stays in the Deck, 六武衆の荒行 is destroyed, player 1 paid 800',
    zoneOf(zanji)==='deck'&&zoneOf(trial)==='grave'&&gameState.players[1].lp===7200&&gameState.players[0].lp===8000,
    JSON.stringify({zanji:zoneOf(zanji),trial:zoneOf(trial),lp:[gameState.players[0].lp,gameState.players[1].lp]}));
  audit('D');
}

/* ===== E. dependent recovery: 神の警告 answers 六武衆の荒行 ===== */
fresh();
{
  const kizan=mk('真六武衆－キザン',0);gameState.players[0].mz=[kizan];
  const zanji=mk('六武衆－ザンジ',0,'down');gameState.players[0].deck=[zanji];
  const trial=mk('六武衆の荒行',0);gameState.players[0].hand=[trial];
  const warn=setCard('神の警告',1);gameState.players[1].sz=[warn];
  baselineA();
  globalThis.__PICK=[kizan.uid,zanji.uid];
  duelActivateFromHand(0);
  for(let i=0;i<10&&pendingChoiceV49(gameState);i++)step();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
  ok('E: 神の警告 is offered against 六武衆の荒行',resp.some(x=>x.card===warn),JSON.stringify(resp.map(x=>x.db.n)));
  duelActivateResponseV2(1,'sz',0);settle();
  ok('E: 神の警告 negates it; 六武衆－ザンジ stays in the Deck; player 1 paid 2000',zoneOf(zanji)==='deck'&&zoneOf(trial)==='grave'&&gameState.players[1].lp===6000,
    JSON.stringify({zanji:zoneOf(zanji),trial:zoneOf(trial),lp:gameState.players[1].lp}));
  audit('E');
}

/* ===== G. summon window: a set 王宮の弾圧 negates an Xyz Summon (エヴォルカイザー・ラギア) ===== */
fresh();
{
  /* S03-U163: legal materials — エヴォルカイザー・ラギア is 「恐竜族レベル4モンスター×2」 (the test used two Warriors; the Xyz entry point now
     checks the materials). Two Lv4 Dinosaur Normal Monsters; the names kizan / zanji are kept for the assertions. */
  const kizan=mk('セイバーザウルス',0,'up'), zanji=mk('ワイルド・ラプター',0,'up');gameState.players[0].mz=[kizan,zanji];
  const lagia=mk('エヴォルカイザー・ラギア',0);gameState.players[0].ex=[lagia];
  const ro=setCard('王宮の弾圧',1);gameState.players[1].sz=[ro];
  baselineA();
  beginExSummonV2(0,0,[0,1],'xyz','atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('G: the Xyz Summon waits in the summon-negation window and 王宮の弾圧 is offered',!!gameState.pendingSummon&&gameState.pendingSummon.kind==='xyz'&&neg.some(x=>x.card===ro),
    JSON.stringify({pending:gameState.pendingSummon&&gameState.pendingSummon.kind,neg:neg.map(x=>x.db.n)}));
  activateSummonNegatorV2(1,'sz',0);settle();
  ok('G: the Xyz Summon is negated; エヴォルカイザー・ラギア and both materials are in the GY; player 1 paid 800',
    zoneOf(lagia)==='grave'&&zoneOf(kizan)==='grave'&&zoneOf(zanji)==='grave'&&!gameState.pendingSummon&&!gameState.pendingExV2&&gameState.players[1].lp===7200,
    JSON.stringify({lagia:zoneOf(lagia),kizan:zoneOf(kizan),zanji:zoneOf(zanji),lp:gameState.players[1].lp}));
  audit('G');
}

/* ===== F. refusals ===== */
fresh();
{
  const ro=mk('王宮の弾圧',1);gameState.players[1].sz=[ro];
  const cyc=mk('サイクロン',0);gameState.players[0].hand=[cyc];
  gameState.players[0].sz=[setCard('死者蘇生',0)];
  baselineA();
  const open=getLegalZoneActions?getLegalZoneActions(1,'sz',0).map(a=>a.id):[];
  ok('F: with nothing to answer, the face-up 王宮の弾圧 offers no effect activation',!open.includes('effect'),JSON.stringify(open));
  gameState.players[0].sz.push(setCard('王宮の弾圧',0));
  const setIds=getLegalZoneActions(0,'sz',gameState.players[0].sz.length-1).map(a=>a.id);
  ok('F: a set 王宮の弾圧 offers its controller the scripted card activation (free chain), not the manual one',setIds.includes('activateSet')&&!setIds.includes('activateSetManual'),JSON.stringify(setIds));
  gameState.players[0].sz.pop();
  globalThis.__PICK=[gameState.players[0].sz[0].uid];
  duelActivateFromHand(0);
  for(let i=0;i<10&&pendingChoiceV49(gameState);i++)step();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
  ok('F: 王宮の弾圧 is not offered against サイクロン (no Special Summon)',gameState.chain.length===1&&!resp.some(x=>x.card===ro),JSON.stringify({chain:gameState.chain.map(l=>l.name),resp:resp.map(x=>x.db.n)}));
  settle();
}
fresh();
{
  const ro=mk('王宮の弾圧',1);gameState.players[1].sz=[ro];
  gameState.players[1].lp=700;
  const rez=mk('死者蘇生',0);gameState.players[0].hand=[rez];
  const wight=mk('ワイト',0);gameState.players[0].grave=[wight];
  baselineA();
  globalThis.__PICK=[wight.uid];
  duelActivateFromHand(0);
  for(let i=0;i<10&&pendingChoiceV49(gameState);i++)step();
  const low=getChainResponsesV2(1).some(x=>x.card===ro);
  ok('F: with 700 LP the effect cannot be used',!low);
  gameState.players[1].lp=8000;
  const saved=gameState.battle;gameState.battle={step:'start'};
  const ds=strictScriptLegalityV2('王宮の弾圧',1,'sz',0,{});
  gameState.battle=saved;
  ok('F: in the Damage Step the effect cannot be used',!ds.ok,JSON.stringify(ds));
  const L=strictScriptLegalityV2('王宮の弾圧',1,'sz',0,{});
  ok('F: outside the Damage Step with 8000 LP it can be used against 死者蘇生',L.ok,JSON.stringify(L));
}
`);

/* S03-U464 — 進化の繭. Real hand activation, monster-as-Equip path,
   exact Petit Moth target, dynamic stats, negatives and Replay audit. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function hi(c){return gameState.players[0].hand.indexOf(c);}
function acts(c){const i=hi(c);return i<0?[]:getLegalHandActions(0,i).map(a=>a.id);}
function drive(){for(let i=0;i<500;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
function fresh(){resetA();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=10;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x46401103;}
`;

harness(COMMON+String.raw`
fresh();const moth=mk('プチモス',0,'up'),cocoon=mk('進化の繭',0);gameState.players[0].mz=[moth];gameState.players[0].hand=[cocoon];baselineA();
ok('A: Cocoon hand effect is offered for a face-up Petit Moth',acts(cocoon).includes('handEffect'),JSON.stringify(acts(cocoon)));
duelActivateFromHand(hi(cocoon));drive();
const eq=findCardByUid(cocoon.uid);
ok('A: Cocoon resolves from the hand as a monster Equip on Petit Moth',z(cocoon)==='sz'&&eq.card.v46MonsterEquip===true&&eq.card.equipTo&&eq.card.equipTo.uid===moth.uid,JSON.stringify({zone:z(cocoon),equip:eq.card.equipTo,chain:gameState.chain,log:(gameState.log||[]).slice(-12)}));
ok('A: Petit Moth uses Cocoon printed ATK/DEF (0/2000)',curATK(moth)===0&&curDEF(moth)===2000,JSON.stringify({atk:curATK(moth),def:curDEF(moth)}));
audit('A equipped');
API.destroy(findCardByUid(cocoon.uid),'U464 test');
ok('A: after Cocoon leaves, Petit Moth returns to printed 300/200',z(cocoon)==='grave'&&curATK(moth)===300&&curDEF(moth)===200,JSON.stringify({zone:z(cocoon),atk:curATK(moth),def:curDEF(moth)}));
audit('A removed');
`);

harness(COMMON+String.raw`
fresh();const cocoon=mk('進化の繭',0),wrong=mk('ワイト',0,'up');gameState.players[0].hand=[cocoon];gameState.players[0].mz=[wrong];baselineA();
ok('B negative: no face-up Petit Moth means no hand effect',!acts(cocoon).includes('handEffect'),JSON.stringify(acts(cocoon)));
`);
harness(COMMON+String.raw`
fresh();const cocoon=mk('進化の繭',0),moth=mk('プチモス',0,'down');moth.pos='def';gameState.players[0].hand=[cocoon];gameState.players[0].mz=[moth];baselineA();
ok('C negative: a face-down Petit Moth is not a legal Equip target',!acts(cocoon).includes('handEffect'),JSON.stringify(acts(cocoon)));
`);
harness(COMMON+String.raw`
fresh();const cocoon=mk('進化の繭',0),moth=mk('プチモス',0,'up');gameState.players[0].hand=[cocoon];gameState.players[0].mz=[moth];for(let i=0;i<5;i++){const s=mk('サイクロン',0,'down');s.setTurn=9;gameState.players[0].sz.push(s);}baselineA();
ok('D negative: a full Spell/Trap Zone prevents equipping from the hand',!acts(cocoon).includes('handEffect'),JSON.stringify(acts(cocoon)));
`);

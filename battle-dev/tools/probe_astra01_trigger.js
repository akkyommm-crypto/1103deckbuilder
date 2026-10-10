require('./astra_harness')(String.raw`
resetA();const c=mk('ドラグニティ－ドゥクス'),e=mk('ドラグニティ－ファランクス');
gameState.players[0].hand=[c];gameState.players[0].grave=[e];baselineA();
doNormalSummon(0,'atk');
console.log('NORMAL',h(c),gameState.pendingSummon,gameState.processorWaiting,!!EVT_V2_STATE);
if(EVT_V2_STATE)eventPickV2(0);
console.log('CHOICE',JSON.stringify(pendingChoiceV49(gameState)));
if(pendingChoiceV49(gameState))__choicePickV49(0);
console.log('AFTER',gameState.chain.length,!!EVT_V2_STATE,gameState.systemFault);
ok('probe trigger reaches registry choice',choiceStatsV49().opened>0);
ok('probe selected trigger leaves SEGOC builder',!EVT_V2_STATE);
`);

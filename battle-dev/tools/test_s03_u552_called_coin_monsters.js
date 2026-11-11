const harness=require('./astra_harness'),COMMON=require('./codex_battle_card_test_common');
// Fixed seed 1 gives heads on the first xorshift draw. Both declarations exercise both results.
for(const call of ['heads','tails'])harness(COMMON+String.raw`
fresh();gameState.rngInitialSeed=gameState.rngState=1;const m=mk('暴れ牛鬼',0),foe=setc('地獄の扉越し銃',1);gameState.players[0].mz=[m];gameState.players[1].sz=[foe];baselineA();PREFER=['CALL'];duelActivateFromZone(0,'mz',0,{});for(let i=0;i<4&&pc();i++)pick();
ok('A CALL 暴れ牛鬼の不確定ダメージに扉越し銃を提示しない',!getChainResponsesV2(1).some(x=>x.card.uid===foe.uid));drive();
ok('A CALL ★ 宣言して当たりは相手、外れは自分に1000',gameState.players[0].lp===LP0&&gameState.players[1].lp===LP1&&TITLES.some(x=>x.startsWith('暴れ牛鬼：')),JSON.stringify({lp0:gameState.players[0].lp,lp1:gameState.players[1].lp,t:TITLES}));
ok('A CALL 同ターン2回目の発動不可',!strictScriptLegalityV2('暴れ牛鬼',0,'mz',0,{}).ok);audit('A CALL');
`.replaceAll('CALL',call).replaceAll('LP0',call==='heads'?'8000':'7000').replaceAll('LP1',call==='heads'?'7000':'8000'),{expect:4});
for(const call of ['heads','tails'])for(const target of ['direct','monster'])harness(COMMON+String.raw`
fresh();gameState.rngInitialSeed=gameState.rngState=1;const m=mk('地雷蜘蛛',0),other=mk('ワイト',0),d=mk('ワイト',1);gameState.players[0].mz=[m,other];DEFSETbaselineA();PREFER=['CALL'];phase('battle');const r=attack(0,0,TARGET);
ok('B CALL/TARG ★ 地雷蜘蛛は宣言結果後も同じ攻撃を続ける',r==='idle'&&gameState.players[0].lp===LP0&&gameState.players[1].lp===LP1&&cardLinks('地雷蜘蛛')===1&&TITLES.some(x=>x.startsWith('地雷蜘蛛：')),JSON.stringify({r,lp0:gameState.players[0].lp,lp1:gameState.players[1].lp}));
ok('B CALL/TARG 失うLPは効果ダメージでも発動コストでもない',V41_ACTION_JOURNAL.filter(x=>x.action.type==='LP'&&x.action.cause==='unspecified').length===LOSS);audit('B CALL/TARG');
`.replaceAll('CALL',call).replaceAll('DEFSET',target==='monster'?'gameState.players[1].mz=[d];':'').replaceAll('TARGET',target==='monster'?'0':"'direct'").replaceAll('TARG',target).replaceAll('LP0',call==='heads'?'8000':'4000').replaceAll('LP1',target==='monster'?'6100':'5800').replaceAll('LOSS',call==='heads'?'0':'1'),{expect:3});
harness(COMMON+String.raw`
fresh();const m=mk('地雷蜘蛛',0),other=mk('ジェネティック・ワーウルフ',0);gameState.players[0].mz=[m,other];baselineA();phase('battle');attack(0,1,'direct');ok('C 他の自軍モンスターの攻撃では地雷蜘蛛を発動しない',cardLinks('地雷蜘蛛')===0&&gameState.players[0].lp===8000&&gameState.players[1].lp===6000);audit('C');
`,{expect:2});

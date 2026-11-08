/* S03-U543 equipped target survives activation, leaves by effect, real chain. */
const harness=require('./astra_harness');const COMMON=require('./codex_equip_test_common');
const BOARD=String.raw`
fresh();const delta=mk('デルタトライ',0),trigon=mk('トライゴン',0),laser=mk('ドラゴンレーザー',0);
const f1=mk('デーモンの召喚',1),f2=mk('ワイト',1),cyclone=mk('サイクロン',1,'down');cyclone.setTurn=3;
gameState.players[0].mz=[delta,trigon];gameState.players[0].hand=[laser];gameState.players[1].mz=[f1,f2];gameState.players[1].sz=[cyclone];
baselineA();API.equipMonster(0,h(trigon),h(delta),'fixture');drive();
`;
harness(COMMON+BOARD+String.raw`
PREFER=[trigon.uid];duelActivateFromZone(0,'hand',0,{});for(let i=0;i<20&&pc();i++)pick();
ok('A1 ★ 発動時は対象に取るだけで、トライゴンはコストとして墓地へ行かない',gameState.chain.length===1&&gameState.chain[0].targets.length===1&&zu(trigon.uid)==='sz');
const r=drive();ok('A2 ★ 解決時にトライゴンを破壊せず墓地へ送り、相手だけ全破壊',r==='idle'&&zu(trigon.uid)==='grave'&&cu(trigon.uid).graveInfo.byDestroy===false&&zu(f1.uid)==='grave'&&zu(f2.uid)==='grave'&&zu(delta.uid)==='mz'&&zu(cyclone.uid)==='sz',JSON.stringify({r,trigon:zu(trigon.uid),f1:zu(f1.uid),f2:zu(f2.uid)}));audit('A');
`,{expect:3});
harness(COMMON+BOARD+String.raw`
PREFER=[trigon.uid];duelActivateFromZone(0,'hand',0,{});for(let i=0;i<20&&pc();i++)pick();PREFER=[trigon.uid];respondZone(1,cyclone);const r=drive();
ok('B1 ★ チェーン除去で装備対象が消失すると相手モンスターは破壊されない',r==='idle'&&zu(trigon.uid)==='grave'&&cu(trigon.uid).graveInfo.byDestroy===true&&zu(f1.uid)==='mz'&&zu(f2.uid)==='mz');audit('B');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const laser=mk('ドラゴンレーザー',0);gameState.players[0].hand=[laser];gameState.players[1].mz=[mk('ワイト',1)];baselineA();
ok('C1 ★ 適正な装備トライゴンが無い時は発動できない',strictScriptLegalityV2('ドラゴンレーザー',0,'hand',0,{}).ok===false);
`,{expect:1});

harness(COMMON+String.raw`
fresh();const host=mk('ワイト',0),trigon=mk('トライゴン',0),laser=mk('ドラゴンレーザー',0);
gameState.players[0].mz=[host,trigon];gameState.players[0].hand=[laser];gameState.players[1].mz=[mk('ワイト',1)];baselineA();API.equipMonster(0,h(trigon),h(host),'fixture');drive();
ok('D1 ★ トライゴンが別名モンスターに装備されている場合は発動不可',strictScriptLegalityV2('ドラゴンレーザー',0,'hand',0,{}).ok===false);audit('D');
`,{expect:2});

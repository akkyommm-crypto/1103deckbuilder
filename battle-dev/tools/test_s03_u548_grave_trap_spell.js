/* U548 self-GY triggers, exact source choices, forced targeting and Replay. */
const harness=require('./astra_harness'),COMMON=require('./codex_battle_card_test_common');
for(const from of ['hand','deck','grave'])harness(COMMON+String.raw`
fresh();const lim=mk('リミッター・ブレイク',0),speed=mk('スピード・ウォリアー',0),opponent=mk('スピード・ウォリアー',1),decree=mk('王宮のお触れ',1);gameState.players[0].hand=[lim];gameState.players[0]['FROM'].push(speed);gameState.players[1].grave=[opponent];gameState.players[1].sz=[decree];baselineA();PREFER=[speed.uid,'def'];API.sendHandToGrave(0,h(lim).index,'fixture');const r=drive();
ok('A ★ お触れ下でも自分のFROMから守備表示SS、相手の墓地は使わない',r==='idle'&&zu(speed.uid)==='mz'&&cu(speed.uid).pos==='def'&&zu(opponent.uid)==='grave'&&cardLinks('リミッター・ブレイク')===1,JSON.stringify({r,speed:zu(speed.uid),pos:cu(speed.uid).pos,links:cardLinks('リミッター・ブレイク')}));audit('A');
`.replaceAll('FROM',from),{expect:2});
harness(COMMON+String.raw`
fresh();const lim=mk('リミッター・ブレイク',0),other=mk('ワイト',0),speed=mk('スピード・ウォリアー',0);gameState.players[0].grave=[lim];gameState.players[0].hand=[other,speed];baselineA();API.sendHandToGrave(0,h(other).index,'fixture');drive();
ok('B1 ★ 既に墓地にあるカードは別カードの墓地到達で誘発しない',zu(speed.uid)==='hand'&&cardLinks('リミッター・ブレイク')===0);audit('B');
`,{expect:2});
for(const face of ['down','up'])harness(COMMON+String.raw`
fresh();const zone=mk('Z－ONE',0,'FACE'),cyclone=mk('サイクロン',0),field=mk('海',0),cont=mk('強者の苦痛',0);zone.setTurn=3;gameState.players[0].sz=[zone];gameState.players[0].hand=[cyclone];gameState.players[0].grave=[field,cont];baselineA();PREFER=[zone.uid,field.uid];const r=castActual(0,cyclone);
ok('C ★ セット状態で破壊された時だけ墓地魔法回収（FACE）',r==='idle'&&zu(zone.uid)==='grave'&&zu(field.uid)==='DEST'&&cardLinks('Z－ONE')===COUNT,JSON.stringify({r,field:zu(field.uid),links:cardLinks('Z－ONE')}));audit('C');
`.replaceAll('FACE',face).replaceAll('DEST',face==='down'?'hand':'grave').replaceAll('COUNT',face==='down'?'1':'0'),{expect:2});
harness(COMMON+String.raw`
fresh();const zone=mk('Z－ONE',0,'down'),field=mk('海',0);gameState.players[0].sz=[zone];gameState.players[0].grave=[field];baselineA();API.sendToGrave(h(zone),'fixture non-destruction');drive();ok('D1 ★ 非破壊の墓地送りでは回収しない',zu(field.uid)==='grave'&&cardLinks('Z－ONE')===0);audit('D');
`,{expect:2});

for(const from of ['sz','deck'])harness(COMMON+String.raw`
fresh();const lim=mk('リミッター・ブレイク',0),speed=mk('スピード・ウォリアー',0);gameState.players[0]['FROM'].push(lim);gameState.players[0].hand=[speed];baselineA();PREFER=[speed.uid];API.sendToGrave(h(lim),'fixture');drive();ok('E ★ FROMからの墓地送りでも誘発する',zu(speed.uid)==='mz'&&cardLinks('リミッター・ブレイク')===1);audit('E');
`.replaceAll('FROM',from),{expect:2});

harness(COMMON+String.raw`
fresh();const zone=mk('Z－ONE',0,'down'),own=mk('サイクロン',0),enemy=mk('サイクロン',1,'down'),decoy=mk('砂塵の大竜巻',1,'down'),field=mk('海',0);zone.setTurn=enemy.setTurn=decoy.setTurn=3;gameState.players[0].sz=[zone];gameState.players[0].hand=[own];gameState.players[0].grave=[field];gameState.players[1].sz=[enemy,decoy];baselineA();PREFER=[decoy.uid];duelActivateFromHand(0);for(let i=0;i<20&&pc();i++)pick();PREFER=[zone.uid];respondZone(1,enemy);PREFER=[field.uid];const r=drive();
ok('F1 ★ チェーン2で破壊されても一連の解決後に強制回収する',r==='idle'&&zu(zone.uid)==='grave'&&zu(field.uid)==='hand'&&cardLinks('Z－ONE')===1,JSON.stringify({r,zone:zu(zone.uid),field:zu(field.uid),links:cardLinks('Z－ONE')}));audit('F');
`,{expect:2});

/* S03-U544 multi-target summon, chain capacity loss, exclusion, Replay. */
const harness=require('./astra_harness');const COMMON=require('./codex_equip_test_common');
const BOARD=String.raw`
fresh();const host=mk('デーモンの召喚',0),a=mk('ヴァイロン・プリズム',0),b=mk('ヴァイロン・ステラ',0),poly=mk('ヴァイロン・ポリトープ',0);
const other=mk('ワイト',0),trio=mk('おジャマトリオ',1,'down');trio.setTurn=3;
gameState.players[0].mz=[host,a,b,other];gameState.players[0].hand=[poly];gameState.players[1].sz=[trio];
baselineA();API.equipMonster(0,h(a),h(host),'fixture');API.equipMonster(0,h(b),h(host),'fixture');API.equipMonster(0,h(other),h(host),'fixture');drive();
`;
harness(COMMON+BOARD+String.raw`
PREFER=['count-2',a.uid,b.uid];duelActivateFromZone(0,'hand',0,{});for(let i=0;i<20&&pc();i++)pick();
ok('A1 ★ 発動時にヴァイロン2枚を対象として記録',gameState.chain.length===1&&gameState.chain[0].targets.length===2&&gameState.chain[0].targetCount===2);
const r=drive();
ok('A2 ★ 2枚を守備表示で特殊召喚、装備関係を解除し除外の印を持つ',r==='idle'&&zu(a.uid)==='mz'&&zu(b.uid)==='mz'&&cu(a.uid).pos==='def'&&cu(b.uid).pos==='def'&&cu(a.uid).banishWhenLeavesField===true&&cu(b.uid).banishWhenLeavesField===true&&!cu(a.uid).equipTo&&!cu(a.uid).v46MonsterEquip&&zu(other.uid)==='sz'&&gameState.players[0].lp===8000,JSON.stringify({r,a:zu(a.uid),b:zu(b.uid),other:zu(other.uid)}));
API.returnToHand(h(a),'fixture leave');drive();
ok('A3 ★ 特殊召喚後に場を離れるモンスターは手札の代わりに除外',zu(a.uid)==='banish'&&zu(b.uid)==='mz');audit('A');
`,{expect:4});
harness(COMMON+BOARD+String.raw`
PREFER=['count-2',a.uid,b.uid];duelActivateFromZone(0,'hand',0,{});for(let i=0;i<20&&pc();i++)pick();respondZone(1,trio);const r=drive();
ok('B1 ★ チェーンで空きが1つになると1枚を特殊召喚、残りは墓地へ送る',r==='idle'&&zu(a.uid)==='mz'&&zu(b.uid)==='grave'&&gameState.players[0].mz.length===5&&cu(b.uid).graveInfo.byDestroy===false,JSON.stringify({r,a:zu(a.uid),b:zu(b.uid),mz:gameState.players[0].mz.length,toasts:TOASTS}));audit('B');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const host=mk('デーモンの召喚',0),other=mk('ワイト',0),poly=mk('ヴァイロン・ポリトープ',0);gameState.players[0].mz=[host,other];gameState.players[0].hand=[poly];baselineA();API.equipMonster(0,h(other),h(host),'fixture');drive();
ok('C1 ★ ヴァイロン以外の装備モンスターしか無ければ発動不可',strictScriptLegalityV2('ヴァイロン・ポリトープ',0,'hand',0,{}).ok===false);audit('C');
`,{expect:2});

harness(COMMON+BOARD+String.raw`
PREFER=[b.uid];const r=useCard(0,poly);
ok('D1 ★ 任意枚数なので1枚だけを選び残りは装備として保持',r==='idle'&&zu(a.uid)==='sz'&&zu(b.uid)==='mz'&&cu(b.uid).pos==='def'&&cu(a.uid).equipTo.uid===host.uid);audit('D');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const host=mk('デーモンの召喚',0),a=mk('ヴァイロン・プリズム',0),poly=mk('ヴァイロン・ポリトープ',0);
const goat=mk('スケープ・ゴート',0,'down');goat.setTurn=3;gameState.players[0].mz=[host,a];gameState.players[0].hand=[poly];gameState.players[0].sz=[goat];
baselineA();API.equipMonster(0,h(a),h(host),'fixture');drive();PREFER=[a.uid];duelActivateFromZone(0,'hand',0,{});for(let i=0;i<20&&pc();i++)pick();respondZone(0,goat);const r=drive();
ok('E1 ★ 解決時に空きが0なら対象を特殊召喚せず墓地送り',r==='idle'&&zu(a.uid)==='grave'&&gameState.players[0].mz.length===5&&!cu(a.uid).banishWhenLeavesField,JSON.stringify({r,a:zu(a.uid),mz:gameState.players[0].mz.length,toasts:TOASTS}));audit('E');
`,{expect:2});

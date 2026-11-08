/* S03-U542 real trap/chain/Equip/Replay regression. */
const harness=require('./astra_harness');
const COMMON=require('./codex_equip_test_common');
harness(COMMON+String.raw`
fresh();
const tool=mk('パワー・ツール・ドラゴン',0), tr=mk('パワー・ブレイク',0,'down');tr.setTurn=3;
const axe=mk('デーモンの斧',0), arms=mk('アームズ・エイド',0), trap=mk('鎖付きブーメラン',0);
const wrong=mk('ワイト',0);
gameState.players[0].mz=[tool,arms];gameState.players[0].sz=[tr,axe,trap];gameState.players[0].grave=[wrong];
baselineA();
API.equipSpell(h(axe),h(tool),'fixture');API.equipSpell(h(trap),h(tool),'fixture');API.equipMonster(0,h(arms),h(tool),'fixture');drive();
PREFER=['count-3',axe.uid,arms.uid,trap.uid];
const before=gameState.players[1].lp,r=useCard(0,tr);
ok('A1 ★ 装備魔法・罠・モンスター3枚を戻して1500ダメージ、シンクロはEXへ',r==='idle'&&zu(axe.uid)==='deck'&&zu(trap.uid)==='deck'&&zu(arms.uid)==='ex'&&zu(wrong.uid)==='grave'&&gameState.players[1].lp===before-1500,JSON.stringify({r,axe:zu(axe.uid),trap:zu(trap.uid),arms:zu(arms.uid),lp:gameState.players[1].lp}));audit('A1');
`,{expect:2});
harness(COMMON+String.raw`
fresh();
const tool=mk('パワー・ツール・ドラゴン',0),tr=mk('パワー・ブレイク',0,'down');tr.setTurn=3;
const axe=mk('デーモンの斧',0),pend=mk('黒いペンダント',0), crow=mk('D.D.クロウ',1);
gameState.players[0].mz=[tool];gameState.players[0].sz=[tr];gameState.players[0].grave=[axe,pend];gameState.players[1].hand=[crow];
baselineA();PREFER=['count-2',axe.uid,pend.uid];duelActivateFromZone(0,'sz',0,{});
for(let i=0;i<20&&pc();i++)pick();
ok('B1 ★ 2枚は発動時に対象としてリンクへ記録される',gameState.chain.length===1&&gameState.chain[0].targets.length===2&&gameState.chain[0].targetCount===2);
PREFER=[axe.uid];respondZone(1,crow);const r=drive();
ok('B2 ★ チェーンで1枚消失、残り1枚だけ戻して500ダメージ',r==='idle'&&zu(axe.uid)==='banish'&&zu(pend.uid)==='deck'&&gameState.players[1].lp===7500,JSON.stringify({r,axe:zu(axe.uid),pend:zu(pend.uid),lp:gameState.players[1].lp}));audit('B2');
`,{expect:3});
harness(COMMON+String.raw`
fresh();const tr=mk('パワー・ブレイク',0,'down');tr.setTurn=3;gameState.players[0].sz=[tr];gameState.players[0].grave=[mk('デーモンの斧',0)];baselineA();
ok('C1 ★ パワー・ツールが無ければ発動不可',strictScriptLegalityV2('パワー・ブレイク',0,'sz',0,{}).ok===false);
`,{expect:1});

harness(COMMON+String.raw`
fresh();const tool=mk('パワー・ツール・ドラゴン',0),tr=mk('パワー・ブレイク',0,'down');tr.setTurn=3;
const borrowed=mk('デーモンの召喚',1);gameState.players[0].mz=[tool];gameState.players[0].sz=[tr];gameState.players[1].mz=[borrowed];
baselineA();API.equipMonster(0,h(borrowed),h(tool),'fixture');drive();PREFER=[borrowed.uid];const r=useCard(0,tr);
ok('D1 ★ 自分の装備扱いの相手所有モンスターは相手のデッキへ戻り500ダメージ',r==='idle'&&zu(borrowed.uid)==='deck'&&pu(borrowed.uid)===1&&gameState.players[1].lp===7500);audit('D');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const tool=mk('パワー・ツール・ドラゴン',0),tr=mk('パワー・ブレイク',0,'down');tr.setTurn=3;
const pend=mk('黒いペンダント',0),axe=mk('デーモンの斧',0),hunter=mk('G・B・ハンター',1);
gameState.players[0].mz=[tool];gameState.players[0].sz=[tr,pend];gameState.players[0].grave=[axe];gameState.players[1].mz=[hunter];
baselineA();API.equipSpell(h(pend),h(tool),'fixture');drive();PREFER=['count-2',pend.uid,axe.uid];const r=useCard(0,tr);
ok('E1 ★ フィールドから戻せない対象は数えず墓地から戻った1枚分だけダメージ',r==='idle'&&zu(pend.uid)==='sz'&&zu(axe.uid)==='deck'&&gameState.players[1].lp===7500,JSON.stringify({r,pend:zu(pend.uid),axe:zu(axe.uid),lp:gameState.players[1].lp}));audit('E');
`,{expect:2});

/* S03-U546 real EX material enumeration and rejection, including Skill Drain. */
const harness=require('./astra_harness');const COMMON=require('./codex_equip_test_common');
const BOARD=String.raw`
fresh();const eel=mk('竜宮の白タウナギ',0),ex=mk('ギガンテック・ファイター',0);
`;
for(const drain of [false,true])harness(COMMON+BOARD+String.raw`
const fish=mk('レインボー・フィッシュ',0);gameState.players[0].mz=[eel,fish];gameState.players[0].ex=[ex];
`+(drain?String.raw`gameState.players[0].sz=[mk('スキルドレイン',0)];`:``)+String.raw`
baselineA();const negated=effectNegated(eel),combos=exCombos(0,dbOf(ex)).combos;if(combos.length)beginExSummonV2(0,0,combos[0].materials,'synchro','atk');const r=drive();
ok('A ★ 魚族だけなら正規S召喚できる（スキルドレイン='+DRAIN_VALUE+'）',r==='idle'&&combos.length===1&&zu(ex.uid)==='mz'&&zu(eel.uid)==='grave'&&negated===DRAIN_VALUE,JSON.stringify({r,combos:combos.length,negated,ex:zu(ex.uid)}));audit('A');
`.replaceAll('DRAIN_VALUE',String(drain)),{expect:2});
for(const drain of [false,true])harness(COMMON+BOARD+String.raw`
const other=mk('ホーリー・エルフ',0);gameState.players[0].mz=[eel,other];gameState.players[0].ex=[ex];
`+(drain?String.raw`gameState.players[0].sz=[mk('スキルドレイン',0)];`:``)+String.raw`
baselineA();const combos=exCombos(0,dbOf(ex)).combos;beginExSummonV2(0,0,[0,1],'synchro','atk');drive();
ok('B ★ 魚族以外を含む素材は一覧にも出ず直接指定も拒否（スキルドレイン='+DRAIN_VALUE+'）',combos.length===0&&zu(ex.uid)==='ex'&&zu(eel.uid)==='mz'&&zu(other.uid)==='mz'&&!gameState.pendingExV2,JSON.stringify({combos:combos.length,ex:zu(ex.uid),eel:zu(eel.uid)}));
/* Refused preparation commits no Action, so no empty Replay audit. */
`.replaceAll('DRAIN_VALUE',String(drain)),{expect:1});

harness(COMMON+BOARD+String.raw`
const other=mk('ホーリー・エルフ',0);gameState.players[0].mz=[eel,other];gameState.players[0].ex=[ex];baselineA();API.setRace(h(other),'魚','permanent','fixture');const combos=exCombos(0,dbOf(ex)).combos;if(combos.length)beginExSummonV2(0,0,combos[0].materials,'synchro','atk');drive();
ok('C1 ★ 印刷種族でなく現在の魚族化を見てS素材にできる',combos.length===1&&zu(ex.uid)==='mz');audit('C');
`,{expect:2});
harness(COMMON+BOARD+String.raw`
const fish=mk('レインボー・フィッシュ',0);gameState.players[0].mz=[eel,fish];gameState.players[0].ex=[ex];baselineA();API.setRace(h(fish),'戦士','permanent','fixture');const combos=exCombos(0,dbOf(ex)).combos;beginExSummonV2(0,0,[0,1],'synchro','atk');drive();
ok('D1 ★ 元々魚族でも現在戦士族なら拒否',combos.length===0&&zu(ex.uid)==='ex'&&zu(eel.uid)==='mz');audit('D');
`,{expect:2});

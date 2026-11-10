/* U549 real Ritual, face-down/GY/negation and attribute replacement paths. */
const harness=require('./astra_harness'),COMMON=require('./codex_battle_card_test_common');
const HELP=String.raw`function attrs(c){return currentAttributesV17(c).slice().sort().join(',');}const FIVE=['光','風','水','炎','地'].sort().join(',');`;
harness(COMMON+HELP+String.raw`
fresh();const d=mk('精霊術師 ドリアード',0),spell=mk('ドリアードの祈り',0),mat=mk('ホーリー・エルフ',0);gameState.players[0].hand=[d];gameState.players[0].sz=[spell];gameState.players[0].mz=[mat];baselineA();PREFER=[d.uid,mat.uid];const r=useCard(0,spell);
ok('A1 ★ 正規の儀式召喚で表側の5属性を持つ',r==='idle'&&zu(d.uid)==='mz'&&zu(mat.uid)==='grave'&&attrs(cu(d.uid))===FIVE&&!!API.ritualProvenance(cu(d.uid)),JSON.stringify({r,d:zu(d.uid),attrs:attrs(cu(d.uid))}));audit('A');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const d=mk('精霊術師 ドリアード',0),book=mk('月の書',0);gameState.players[0].mz=[d];gameState.players[0].hand=[book];baselineA();PREFER=[d.uid];const r=castActual(0,book);ok('B1 ★ 裏側表示では印刷属性の光だけ',r==='idle'&&cu(d.uid).face==='down'&&attrs(cu(d.uid))==='光');audit('B');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const d=mk('精霊術師 ドリアード',0);gameState.players[0].mz=[d];baselineA();API.sendToGrave(h(d),'fixture');drive();ok('C1 ★ 墓地では光だけ',zu(d.uid)==='grave'&&attrs(cu(d.uid))==='光');audit('C');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const d=mk('精霊術師 ドリアード',0),drain=mk('スキルドレイン',0,'down');drain.setTurn=3;gameState.players[0].mz=[d];gameState.players[0].sz=[drain];baselineA();const r=useCard(0,drain);ok('D1 ★ スキルドレインで追加属性は失効',r==='idle'&&attrs(cu(d.uid))==='光');audit('D');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const d=mk('精霊術師 ドリアード',0),dna=mk('DNA移植手術',0,'down');dna.setTurn=3;gameState.players[0].mz=[d];gameState.players[0].sz=[dna];baselineA();PREFER=['神'];const r=useCard(0,dna);ok('E1 ★ DNA移植手術で神属性のみになり追加4属性も上書きされる',r==='idle'&&attrs(cu(d.uid))==='神',JSON.stringify({r,attrs:attrs(cu(d.uid)),titles:TITLES}));audit('E');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const d=mk('精霊術師 ドリアード',0);gameState.players[0].mz=[d];baselineA();API.setAttribute(h(d),'闇','permanent','fixture');ok('F1 ★ 特性上書きAPIでも追加属性を足さない',attrs(cu(d.uid))==='闇');API.clearCharMods(h(d),'fixture');ok('F2 ★ 上書きが消えると元の5属性へ戻る',attrs(cu(d.uid))===FIVE);audit('F');
`,{expect:3});

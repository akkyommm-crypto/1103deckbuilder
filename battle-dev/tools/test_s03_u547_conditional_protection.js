/* S03-U547 real effect destruction, battle protection and End Phase trigger. */
const harness=require('./astra_harness');const COMMON=require('./codex_equip_test_common')+String.raw`
/* UI hand activation moves the Spell out of the hand before resolution.
   duelActivateFromZone is the zone primitive and does not perform that UI move. */
function castCardS547(p,c){const hit=h(c);if(hit.zone==='hand'){duelActivateFromHand(hit.index);return drive();}return useCard(p,c);}
`;
for(const who of [1,0])harness(COMMON+String.raw`
fresh();const bear=mk('地獄の番熊',0),pand=mk('万魔殿－悪魔の巣窟－',0),cyclone=mk('サイクロン',WHO_VALUE);gameState.players[0].mz=[bear];gameState.players[0].field=pand;gameState.players[WHO_VALUE].hand=[cyclone];baselineA();
` .replaceAll('WHO_VALUE',String(who))+String.raw`
TURN_VALUE
PREFER=[pand.uid];const r=castCardS547(WHO_VALUE,cyclone);
ok('A ★ 番熊は相手の効果だけから自分の万魔殿を守る（効果側='+WHO_VALUE+'）',r==='idle'&&zu(pand.uid)===DEST_VALUE,JSON.stringify({r,pand:zu(pand.uid)}));audit('A');
`.replaceAll('WHO_VALUE',String(who)).replaceAll('TURN_VALUE',who===1?"phase('end');turn();phase('main1');":'').replaceAll('DEST_VALUE',who===1?"'field'":"'grave'"),{expect:2});
harness(COMMON+String.raw`
fresh();const bear=mk('地獄の番熊',0,'down'),pand=mk('万魔殿－悪魔の巣窟－',0),cyclone=mk('サイクロン',1);gameState.players[0].mz=[bear];gameState.players[0].field=pand;gameState.players[1].hand=[cyclone];baselineA();phase('end');turn();phase('main1');PREFER=[pand.uid];const r=castCardS547(1,cyclone);
ok('B1 ★ 番熊が裏側なら万魔殿を保護しない',r==='idle'&&zu(pand.uid)==='grave');audit('B');
`,{expect:2});
for(const spec of [{att:'レプティレス・メデューサ',pos:'atk',dest:'mz'},{att:'デーモンの召喚',pos:'atk',dest:'grave'},{att:'レプティレス・メデューサ',pos:'def',dest:'grave'}])harness(COMMON+String.raw`
fresh();const att=mk('ATT_VALUE',0),victim=mk('ワイト',1,'up','POS_VALUE'),trap=mk('スネーク・チョーク',0,'down');trap.setTurn=3;gameState.players[0].mz=[att];gameState.players[1].mz=[victim];gameState.players[0].sz=[trap];baselineA();API.setAtk(h(victim),0,'permanent','fixture');castCardS547(0,trap);phase('battle');const r=attack(0,0,0);
ok('C ★ 0攻撃力・相手攻撃表示・レプティレスとの戦闘だけ保護（ATT_VALUE/POS_VALUE）',r==='idle'&&zu(victim.uid)==='DEST_VALUE',JSON.stringify({r,victim:zu(victim.uid)}));audit('C');
`.replaceAll('ATT_VALUE',spec.att).replaceAll('POS_VALUE',spec.pos).replaceAll('DEST_VALUE',spec.dest),{expect:2});
for(const extra of [false,true])harness(COMMON+String.raw`
fresh();const kud=mk('魔轟神獣クダベ',0),hole=mk('ブラック・ホール',0);gameState.players[0].mz=[kud];gameState.players[0].hand=[hole]EXTRA_VALUE;baselineA();const r=castCardS547(0,hole);
ok('D ★ 解決時に手札0なら効果破壊を防ぎ1枚なら防がない（余分手札=BOOL_VALUE）',r==='idle'&&zu(kud.uid)==='DEST_VALUE',JSON.stringify({r,kud:zu(kud.uid),hand:gameState.players[0].hand.length}));audit('D');
`.replaceAll('EXTRA_VALUE',extra?".concat([mk('ワイト',0)])":'').replaceAll('BOOL_VALUE',String(extra)).replaceAll('DEST_VALUE',extra?'grave':'mz'),{expect:2});
for(const extra of [false,true])harness(COMMON+String.raw`
fresh();const kud=mk('魔轟神獣クダベ',0),blue=mk('青眼の白龍',1);gameState.players[0].mz=[kud];gameState.players[1].mz=[blue];HAND_VALUEbaselineA();phase('battle');const r=attack(0,0,0);
ok('E ★ 手札0なら戦闘破壊を防ぎ1枚なら防がない（余分手札=BOOL_VALUE）',r==='idle'&&zu(kud.uid)==='DEST_VALUE'&&gameState.players[0].lp===7200,JSON.stringify({r,kud:zu(kud.uid),lp:gameState.players[0].lp}));audit('E');
`.replaceAll('HAND_VALUE',extra?"gameState.players[0].hand=[mk('ワイト',0)];":'').replaceAll('BOOL_VALUE',String(extra)).replaceAll('DEST_VALUE',extra?'grave':'mz'),{expect:2});
harness(COMMON+String.raw`
fresh();const kud=mk('魔轟神獣クダベ',0),cyclone=mk('サイクロン',0),target=mk('サイクロン',1,'down');target.setTurn=3;gameState.players[0].mz=[kud];gameState.players[0].hand=[cyclone,mk('ワイト',0),mk('ワイト',0)];gameState.players[1].sz=[target];baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
for(let i=0;i<100&&!gameState.chain.some(x=>x.name==='魔轟神獣クダベ');i++){
 if(pc()){pick();continue;}if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
 const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;
}
const triggered=gameState.chain.some(x=>x.name==='魔轟神獣クダベ');PREFER=[target.uid];respondZone(0,cyclone);const r=drive();
ok('F1 ★ 3枚以上で強制誘発した後チェーンで手札を2枚にしても自壊する',triggered&&r==='idle'&&gameState.players[0].hand.length===2&&zu(kud.uid)==='grave',JSON.stringify({triggered,r,kud:zu(kud.uid),hand:gameState.players[0].hand.length}));audit('F');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const kud=mk('魔轟神獣クダベ',0);gameState.players[0].mz=[kud];gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0)];baselineA();const r=phase('end');
ok('G1 ★ 手札2枚のエンドフェイズは自壊しない',r==='idle'&&zu(kud.uid)==='mz');audit('G');
`,{expect:2});

harness(COMMON+String.raw`
fresh();const bear=mk('地獄の番熊',0),pand=mk('万魔殿－悪魔の巣窟－',1),cyclone=mk('サイクロン',0);gameState.players[0].mz=[bear];gameState.players[1].field=pand;gameState.players[0].hand=[cyclone];baselineA();PREFER=[pand.uid];const r=castCardS547(0,cyclone);
ok('H1 ★ 番熊は相手の万魔殿を保護しない',r==='idle'&&zu(pand.uid)==='grave'&&pu(pand.uid)===1);audit('H');
`,{expect:2});
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;gameState.turn=6;const att=mk('レプティレス・メデューサ',1),victim=mk('ワイト',0),trap=mk('スネーク・チョーク',0);gameState.players[1].mz=[att];gameState.players[0].mz=[victim];gameState.players[0].sz=[trap];baselineA();API.setAtk(h(victim),0,'permanent','fixture');phase('battle');const r=attack(1,0,0);
ok('I1 ★ チョークのコントローラー自身の0ATKモンスターは保護しない',r==='idle'&&zu(victim.uid)==='grave');audit('I');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const att=mk('レプティレス・メデューサ',0),victim=mk('ワイト',1),trap=mk('スネーク・チョーク',0);gameState.players[0].mz=[att];gameState.players[1].mz=[victim];gameState.players[0].sz=[trap];baselineA();phase('battle');const r=attack(0,0,0);
ok('J1 ★ ATKが0でなければチョークは保護しない',r==='idle'&&zu(victim.uid)==='grave');audit('J');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const att=mk('レプティレス・メデューサ',0),victim=mk('ワイト',1),trap=mk('スネーク・チョーク',0),decree=mk('王宮のお触れ',1);gameState.players[0].mz=[att];gameState.players[1].mz=[victim];gameState.players[0].sz=[trap];gameState.players[1].sz=[decree];baselineA();API.setAtk(h(victim),0,'permanent','fixture');phase('battle');const r=attack(0,0,0);
ok('K1 ★ お触れで無効のチョークは保護しない',r==='idle'&&zu(victim.uid)==='grave');audit('K');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const kud=mk('魔轟神獣クダベ',0),blue=mk('青眼の白龍',1),drain=mk('スキルドレイン',1);gameState.players[0].mz=[kud];gameState.players[1].mz=[blue];gameState.players[1].sz=[drain];baselineA();phase('battle');const r=attack(0,0,0);
ok('L1 ★ スキルドレイン下では手札0のクダベも戦闘破壊される',r==='idle'&&zu(kud.uid)==='grave');audit('L');
`,{expect:2});

const harness=require('./astra_harness'),COMMON=require('./codex_battle_card_test_common');
harness(COMMON+String.raw`
fresh();const m=mk('人投げトロール',0);gameState.players[0].mz=[m];API.createTokens(0,{name:'U553通常トークン',atk:0,def:0,lv:1,ra:'獣',at:'地',pos:'def'},1);const token=gameState.players[0].mz[1];baselineA();ok('G 正規TOKEN_CREATEの通常トークンは明示的にコスト不可',!!token.token&&!strictScriptLegalityV2('人投げトロール',0,'mz',0,{}).ok);phase('battle');audit('G');
`,{expect:2});
for(const face of ['up','down'])harness(COMMON+String.raw`
fresh();const m=mk('人投げトロール',0),a=mk('ワイト',0,'FACE','def'),b=mk('ホーリー・エルフ',0);gameState.players[0].mz=[m,a,b];baselineA();PREFER=[a.uid];const r=useCard(0,m);
ok('A FACE ★ 通常モンスターをコストに800ダメージ',r==='idle'&&zu(a.uid)==='grave'&&zu(m.uid)==='mz'&&gameState.players[1].lp===7200,JSON.stringify({r,lp:gameState.players[1].lp,z:zu(a.uid)}));
PREFER=[b.uid];useCard(0,m);ok('A FACE ★ 1ターン回数制限はなく2体目でさらに800',zu(b.uid)==='grave'&&gameState.players[1].lp===6400);audit('A FACE');
`.replaceAll('FACE',face),{expect:3});
harness(COMMON+String.raw`
fresh();const m=mk('人投げトロール',0),token=mk('ワイト',0),effect=mk('クリボー',0),locked=mk('ホーリー・エルフ',0);token.token=true;locked.cannotTribute=true;gameState.players[0].mz=[m,token,effect,locked];baselineA();
const legal=()=>strictScriptLegalityV2('人投げトロール',0,'mz',0,{}).ok;
ok('B トークン／効果モンスター／リリース不可だけなら発動不可',!legal());phase('battle');ok('B 戦闘中に起動効果を発動しない',!legal());audit('B');
`,{expect:3});
harness(COMMON+String.raw`
fresh();const m=mk('人投げトロール',0),g=mk('灼熱王パイロン',0);g.summonedTurn=3;gameState.players[0].mz=[m,g];baselineA();
ok('C 再召喚前のデュアルは通常扱いのコスト',strictScriptLegalityV2('人投げトロール',0,'mz',0,{}).ok);doGeminiSummonS03(0,'mz',1);drive();ok('C 再召喚後の効果モンスターはコスト不可',geminiActiveS03(g)&&!strictScriptLegalityV2('人投げトロール',0,'mz',0,{}).ok);audit('C');
`,{expect:3});
harness(COMMON+String.raw`
fresh();const m=mk('人投げトロール',0),a=mk('ワイト',1);a.controller=0;gameState.players[0].mz=[m,a];baselineA();PREFER=[a.uid];useCard(0,m);ok('D ★ 元々の持ち主が相手の通常モンスターもリリースし相手墓地へ',zu(a.uid)==='grave'&&pu(a.uid)===1&&gameState.players[1].lp===7200);audit('D');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const m=mk('人投げトロール',0),a=mk('ワイト',0),drain=mk('スキルドレイン',1);gameState.players[0].mz=[m,a];gameState.players[1].sz=[drain];baselineA();PREFER=[a.uid];useCard(0,m);ok('E スキルドレインではコストを払うが800ダメージは無効',zu(a.uid)==='grave'&&gameState.players[1].lp===8000&&cardLinks('人投げトロール')===1);audit('E');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const m=mk('人投げトロール',0),a=mk('ワイト',0),macro=mk('マクロコスモス',1);gameState.players[0].mz=[m,a];gameState.players[1].sz=[macro];baselineA();PREFER=[a.uid];useCard(0,m);ok('F 墓地送りが除外に置換されてもリリースcostと800ダメージ成立',zu(a.uid)==='banish'&&gameState.players[1].lp===7200);audit('F');
`,{expect:2});

/* U551: real summon windows and real Spell/Trap card activations, fixed-seed Replay. */
const harness=require('./astra_harness'),COMMON=require('./codex_battle_card_test_common');
const SPECS=[['セイバー・ホール','X－セイバー アナペレラ',false],['ブローニング・パワー','クレボンス',true],['ポリノシス','キラー・トマト',true],['王者の看破','青眼の白龍',false]];
for(const level of [7,6])harness(COMMON+String.raw`
fresh();const c=setc('王者の看破',1),m=mk('ワイト',0);gameState.players[1].sz=[c];gameState.players[0].hand=[m];API.createTokens(1,{name:'U551通常トークン',atk:0,def:0,lv:LEVEL,ra:'天使',at:'光',pos:'def'},1);const token=gameState.players[1].mz[0];baselineA();doNormalSummon(0,'atk');
const offered=!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.card.uid===c.uid);ok('R 王者の看破 ★ 正規TOKEN_CREATEのLvLEVEL通常トークン条件',!!token.token&&offered===EXPECTED);
if(offered)activateSummonNegatorV2(1,'sz',0);drive();ok('R 王者の看破 LvLEVELの範囲とトークン非リリース',zu(m.uid)==='MONZONE'&&zu(c.uid)==='TRAPZONE'&&zu(token.uid)==='mz');audit('R LvLEVEL');
`.replaceAll('LEVEL',String(level)).replaceAll('EXPECTED',String(level===7)).replaceAll('MONZONE',level===7?'grave':'mz').replaceAll('TRAPZONE',level===7?'grave':'sz'),{expect:3});
for(const [name,race] of [['ブローニング・パワー','サイキック'],['ポリノシス','植物']])harness(COMMON+String.raw`
fresh();const c=setc('NAME',1),m=mk('ワイト',0);gameState.players[1].sz=[c];gameState.players[0].hand=[m];API.createTokens(1,{name:'U551種族トークン',atk:0,def:0,lv:1,ra:'RACE',at:'地',pos:'def'},1);const token=gameState.players[1].mz[0];baselineA();doNormalSummon(0,'atk');
ok('S NAME ★ 正規TOKEN_CREATEの種族トークンもrelease可能',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.card.uid===c.uid));activateSummonNegatorV2(1,'sz',0);drive();ok('S NAME 種族トークンはcostで消滅し召喚を無効破壊',!cu(token.uid)&&zu(m.uid)==='grave'&&zu(c.uid)==='grave'&&V41_ACTION_JOURNAL.some(x=>x.action.type==='FX_TO_GRAVE'&&x.action.byDestroy===false&&String(x.action.reason).includes('リリース')));audit('S NAME');
`.replaceAll('NAME',name).replaceAll('RACE',race),{expect:3});
for(const spec of [{name:'ポリノシス',monster:'ギガプラント',destroy:false},{name:'王者の看破',monster:'フェニックス・ギア・フリード',destroy:true}])harness(COMMON+String.raw`
fresh();const c=setc('NAME',0),m=mk('MONSTER',0);m.summonedTurn=3;gameState.players[0].sz=[c];gameState.players[0].mz=[m];baselineA();PREFER=[m.uid];doGeminiSummonS03(0,'mz',0);
ok('Q NAME ★ 場に既にいるデュアル再召喚は自身を条件／costから除外しない',!!gameState.pendingSummon&&gameState.pendingSummon.geminiS03===true&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.card.uid===c.uid));activateSummonNegatorV2(0,'sz',0);drive();
ok('Q NAME ★ 再召喚は無効、release costと破壊を区別',zu(m.uid)==='grave'&&zu(c.uid)==='grave'&&cu(m.uid).graveInfo.byDestroy===DESTROY&&gameState.players[0].normalSummonUsed===true);audit('Q NAME');
`.replaceAll('NAME',spec.name).replaceAll('MONSTER',spec.monster).replaceAll('DESTROY',String(spec.destroy)),{expect:3});
for(const [name,support,release] of SPECS)harness(COMMON+String.raw`
fresh();const c=setc('NAME',1),s=mk('SUPPORT',1),m=setc('ワイト',0);m.pos='def';m.summonedTurn=3;gameState.players[1].sz=[c];gameState.players[1].mz=[s];gameState.players[0].mz=[m];baselineA();doFlipUp(0,'mz',0,'atk');
const offered=!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.card.uid===c.uid);
ok('P NAME ★ 反転召喚は本文にある2枚だけ応答',offered===CANFLIP);if(offered)activateSummonNegatorV2(1,'sz',0);drive();ok('P NAME 反転の無効／不干渉とcost範囲',zu(m.uid)==='MONZONE'&&zu(c.uid)==='TRAPZONE'&&zu(s.uid)==='mz');audit('P NAME');
`.replaceAll('NAME',name).replaceAll('SUPPORT',support).replaceAll('CANFLIP',String(!release)).replaceAll('MONZONE',release?'mz':'grave').replaceAll('TRAPZONE',release?'sz':'grave'),{expect:3});
for(const spec of [{name:'ブローニング・パワー',support:'クレボンス',zone:'grave'},{name:'王者の看破',support:'青眼の白龍',zone:'mz'}])harness(COMMON+String.raw`
fresh();const poly=setc('ポリノシス',1),last=setc('NAME',1),seven=setc('盗賊の七つ道具',0),plant=mk('キラー・トマト',1),support=mk('SUPPORT',1),m=mk('ワイト',0);gameState.players[0].sz=[seven];gameState.players[0].hand=[m];gameState.players[1].sz=[poly,last];gameState.players[1].mz=[plant,support];baselineA();PREFER=[plant.uid];doNormalSummon(0,'atk');activateSummonNegatorV2(1,'sz',0);for(let i=0;i<8&&pc();i++)pick();respondZone(0,seven);const middle=gameState.chain.slice(-1)[0],middleId=middle&&middle.chainId;
ok('O NAME ★ 召喚窓内のカウンター罠のカード発動へ応答',!!gameState.pendingSummon&&getChainResponsesV2(1).some(x=>x.card.uid===last.uid));PREFER=[support.uid];respondZone(1,last);
const recorded=gameState.chain.slice(-1)[0];ok('O NAME ★ 直前chainIdを発動リンクにJSON記録',recorded&&recorded.name==='NAME'&&recorded.costCtxS03&&recorded.costCtxS03.u551ResponseS03.kind==='chain'&&recorded.costCtxS03.u551ResponseS03.chainId===middleId);
gameState=JSON.parse(JSON.stringify(gameState));drive();
const neg=V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_NEGATE_LINK'&&x.action.reason==='NAME');
ok('O NAME ★ 元召喚でなく七つ道具を無効、Polinosisが後で召喚無効',neg.length===1&&neg[0].action.chainId===middleId&&zu(m.uid)==='grave'&&zu(poly.uid)==='grave'&&zu(last.uid)==='grave'&&zu(support.uid)==='SUPPORTZONE'&&gameState.players[0].lp===7000,JSON.stringify({neg:neg.map(x=>x.action.chainId),middleId,z:zu(m.uid)}));audit('O NAME');
`.replaceAll('NAME',spec.name).replaceAll('SUPPORTZONE',spec.zone).replaceAll('SUPPORT',spec.support),{expect:4});
for(const [name,support,release] of SPECS)harness(COMMON+String.raw`
fresh();const c=setc('NAME',1),s=mk('SUPPORT',1),m=mk('ワイト',0);gameState.players[1].sz=[c];gameState.players[1].mz=[s];gameState.players[0].hand=[m];baselineA();doNormalSummon(0,'atk');
ok('A NAME ★ 成功前の召喚無効窓に提示',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.card===c));
activateSummonNegatorV2(1,'sz',0);const r=drive();
ok('A NAME ★ 召喚無効で破壊、必要なリリースだけ支払う',r==='idle'&&zu(m.uid)==='grave'&&cu(m.uid).graveInfo.byDestroy&&zu(c.uid)==='grave'&&zu(s.uid)==='SUPPORTZONE',JSON.stringify({r,m:zu(m.uid),s:zu(s.uid)}));audit('A NAME');
`.replaceAll('NAME',name).replaceAll('SUPPORTZONE',release?'grave':'mz').replaceAll('SUPPORT',support),{expect:3});
for(const [name,support] of SPECS)harness(COMMON+String.raw`
fresh();const c=setc('NAME',1),m=mk('ワイト',0);gameState.players[1].sz=[c];gameState.players[0].hand=[m];baselineA();doNormalSummon(0,'atk');const r=drive();
ok('B NAME 条件モンスターが無ければ召喚を妨げない',r==='idle'&&zu(m.uid)==='mz'&&zu(c.uid)==='sz');audit('B NAME');
`.replaceAll('NAME',name),{expect:2});
for(const [name,support,release] of SPECS.slice(1))for(const src of ['ブラック・ホール','強欲な瓶'])harness(COMMON+String.raw`
fresh();const c=setc('NAME',0),s=mk('SUPPORT',0),src=mk('SOURCE',1,'down');src.setTurn=0;gameState.activePlayer=1;gameState.players[0].sz=[c];gameState.players[0].mz=[s];gameState.players[1].sz=[src];baselineA();duelActivateFromZone(1,'sz',0,{});for(let i=0;i<6&&pc();i++)pick();
ok('C NAME ★ SOURCEのカード発動に応答',getChainResponsesV2(0).some(x=>x.card===c));respondZone(0,c);const r=drive();
ok('C NAME ★ SOURCEを無効破壊して既存モンスター維持',r==='idle'&&zu(src.uid)==='grave'&&zu(c.uid)==='grave'&&gameState.players[1].hand.length===0&&zu(s.uid)==='SUPPORTZONE');audit('C NAME SOURCE');
`.replaceAll('NAME',name).replaceAll('SUPPORTZONE',release?'grave':'mz').replaceAll('SUPPORT',support).replaceAll('SOURCE',src),{expect:3});
for(const [name,support] of SPECS.slice(1,3))harness(COMMON+String.raw`
fresh();const c=setc('NAME',1),s=mk('SUPPORT',1,'down','def'),m=mk('ワイト',0);gameState.players[1].sz=[c];gameState.players[1].mz=[s];gameState.players[0].hand=[m];baselineA();doNormalSummon(0,'atk');
ok('D NAME ★ 自軍の裏側の種族もリリース可能',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.card===c));activateSummonNegatorV2(1,'sz',0);drive();ok('D NAME 裏側のコストと召喚モンスターを墓地へ',zu(s.uid)==='grave'&&zu(m.uid)==='grave');audit('D NAME');
`.replaceAll('NAME',name).replaceAll('SUPPORT',support),{expect:3});
harness(COMMON+String.raw`
fresh();const c=setc('セイバー・ホール',0),s=mk('X－セイバー アナペレラ',0),src=mk('ブラック・ホール',1);gameState.activePlayer=1;gameState.players[0].sz=[c];gameState.players[0].mz=[s];gameState.players[1].hand=[src];baselineA();duelActivateFromHand(0);for(let i=0;i<6&&pc();i++)pick();ok('E セイバー・ホールは魔法カード発動を無効にしない',!getChainResponsesV2(0).some(x=>x.card===c));drive();ok('E 魔法は通常通り解決',zu(s.uid)==='grave'&&zu(c.uid)==='sz');audit('E');
`,{expect:3});
for(const [name,support,release] of SPECS)harness(COMMON+String.raw`
fresh();const c=setc('NAME',0),s=mk('SUPPORT',0),m=mk('ワイト',0);gameState.players[0].sz=[c];gameState.players[0].mz=[s];gameState.players[0].hand=[m];baselineA();doNormalSummon(0,'atk');
const before=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
ok('F NAME ★ 自分の召喚も申告した自分の罠で1回だけ応答',before.filter(x=>x.card.uid===c.uid&&x.p===0).length===1);
const saved=JSON.stringify(gameState);gameState=JSON.parse(saved);ok('F NAME 召喚窓のJSON保存復元でも候補保持',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).filter(x=>x.card.uid===c.uid&&x.p===0).length===1);
activateSummonNegatorV2(0,'sz',0);const r=drive();ok('F NAME ★ 自分の召喚を無効にしコスト重複なし',r==='idle'&&zu(m.uid)==='grave'&&zu(c.uid)==='grave'&&zu(s.uid)==='SUPPORTZONE'&&V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_ADD'&&x.action.name==='NAME').length===1);audit('F NAME');
`.replaceAll('NAME',name).replaceAll('SUPPORTZONE',release?'grave':'mz').replaceAll('SUPPORT',support),{expect:4});
for(const [name,support] of SPECS)harness(COMMON+String.raw`
fresh();const c=setc('NAME',0),s=mk('SUPPORT',0),lf=mk('ローンファイア・ブロッサム',1),plant=mk('キラー・トマト',1);gameState.activePlayer=1;gameState.players[0].sz=[c];gameState.players[0].mz=[s];gameState.players[1].mz=[lf];gameState.players[1].deck=[plant,...gameState.players[1].deck];baselineA();duelActivateFromZone(1,'mz',0,{});for(let i=0;i<12&&pc();i++)pick();
ok('G NAME チェーンを組むモンスターSS効果には応答しない',gameState.chain.length>0&&!getChainResponsesV2(0).some(x=>x.card.uid===c.uid));drive();ok('G NAME SS効果は解決し罠未使用',zu(plant.uid)==='mz'&&zu(c.uid)==='sz');audit('G NAME');
`.replaceAll('NAME',name).replaceAll('SUPPORT',support),{expect:3});
harness(COMMON+String.raw`
fresh();const cs=['ブローニング・パワー','ポリノシス','王者の看破'].map(n=>setc(n,0)),s=[mk('クレボンス',0),mk('キラー・トマト',0),mk('青眼の白龍',0)],blood=mk('血の代償',1),m=mk('ワイト',1);gameState.activePlayer=1;gameState.players[0].sz=cs;gameState.players[0].mz=s;gameState.players[1].sz=[blood];gameState.players[1].hand=[m];baselineA();duelActivateFromZone(1,'sz',0,{});for(let i=0;i<8&&pc();i++)pick();
ok('H 表側永続罠の効果発動はカード発動として扱わない',gameState.chain.length>0&&cs.every(c=>!getChainResponsesV2(0).some(x=>x.card.uid===c.uid)));drive();audit('H');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const c=setc('神の宣告',0),m=mk('ワイト',0);gameState.players[0].sz=[c];gameState.players[0].hand=[m];baselineA();doNormalSummon(0,'atk');drive();ok('I opt-inしない既存カードの召喚者側列挙は変えない',zu(m.uid)==='mz'&&zu(c.uid)==='sz'&&gameState.players[0].lp===8000);audit('I');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const c=setc('王者の看破',0),blood=mk('血の代償',0),be=mk('青眼の白龍',0),t1=mk('ワイト',0),t2=mk('ワイト',0);gameState.players[0].sz=[c,blood];gameState.players[0].hand=[be];gameState.players[0].mz=[t1,t2];let seenJ=0,offeredJ=false;const oldJ=summonNegatorsV2;summonNegatorsV2=function(ps){const list=oldJ(ps);if(ps.uid===be.uid){seenJ++;offeredJ=offeredJ||list.some(x=>x.card.uid===c.uid);}return list;};baselineA();PREFER=[be.uid,t1.uid,t2.uid];duelActivateFromZone(0,'sz',1,{});drive();
ok('J 解決中の青眼自身は王者の看破の場の発動条件に数えない',zu(be.uid)==='mz'&&zu(c.uid)==='sz'&&gameState.players[0].lp===7500&&seenJ>0&&!offeredJ,JSON.stringify({seenJ,offeredJ}));audit('J');
`,{expect:2});
for(const [name,support] of SPECS.slice(1,3))harness(COMMON+String.raw`
fresh();const c=setc('NAME',1),s=mk('SUPPORT',1),m=mk('ワイト',0);s.cannotTribute=true;gameState.players[1].sz=[c];gameState.players[1].mz=[s];gameState.players[0].hand=[m];baselineA();doNormalSummon(0,'atk');drive();ok('K NAME リリース不可の種族はコストにしない',zu(m.uid)==='mz'&&zu(s.uid)==='mz'&&zu(c.uid)==='sz');audit('K NAME');
`.replaceAll('NAME',name).replaceAll('SUPPORT',support),{expect:2});
harness(COMMON+String.raw`
fresh();const c=setc('ブローニング・パワー',0),blood=mk('血の代償',0),psy=mk('クレボンス',0);gameState.players[0].sz=[c,blood];gameState.players[0].hand=[psy];let seenL=0,offeredL=false;const oldL=summonNegatorsV2;summonNegatorsV2=function(ps){const list=oldL(ps);if(ps.uid===psy.uid){seenL++;offeredL=offeredL||list.some(x=>x.card.uid===c.uid);}return list;};baselineA();PREFER=[psy.uid];duelActivateFromZone(0,'sz',1,{});drive();ok('L 解決中召喚のサイキック自身を場のreleaseコストに数えない',seenL>0&&!offeredL&&zu(psy.uid)==='mz'&&zu(c.uid)==='sz',JSON.stringify({seenL,offeredL}));audit('L');
`,{expect:2});
harness(COMMON+String.raw`
fresh();const c=setc('セイバー・ホール',1),s=mk('X－セイバー アナペレラ',1),m=mk('サイバー・ドラゴン',0);gameState.players[1].sz=[c];gameState.players[1].mz=[s];gameState.players[0].hand=[m];baselineA();finishSummonProcedure('サイバー・ドラゴン',0,'hand',0,'atk');ok('M セイバー・ホール ★ チェーンを組まない特殊召喚窓に提示',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.card.uid===c.uid));activateSummonNegatorV2(1,'sz',0);drive();ok('M 手順特殊召喚を無効破壊',zu(m.uid)==='grave'&&zu(c.uid)==='grave');audit('M');
`,{expect:3});
for(const spec of [{name:'王者の看破',support:'冥府の使者ゴーズ',face:'up'},{name:'王者の看破',support:'ホーリー・エルフ',face:'up'},{name:'セイバー・ホール',support:'X－セイバー アナペレラ',face:'down'}])harness(COMMON+String.raw`
fresh();const c=setc('NAME',1),s=mk('SUPPORT',1,'FACE'),m=mk('ワイト',0);gameState.players[1].sz=[c];gameState.players[1].mz=[s];gameState.players[0].hand=[m];baselineA();doNormalSummon(0,'atk');drive();ok('N NAME/SUPPORT/FACE 条件不一致の自軍モンスターでは発動不可',zu(m.uid)==='mz'&&zu(c.uid)==='sz');audit('N NAME/SUPPORT/FACE');
`.replaceAll('NAME',spec.name).replaceAll('SUPPORT',spec.support).replaceAll('FACE',spec.face),{expect:2});

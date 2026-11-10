/* S03-U545 fixed-seed, legal EX materials, real trigger paths and Replay. */
const harness=require('./astra_harness');const COMMON=require('./codex_equip_test_common');
const HELP=String.raw`
function synchro(ex){const combos=exCombos(0,dbOf(ex)).combos; if(!combos.length)return 'no-combo';beginExSummonV2(0,h(ex).index,combos[0].materials,'synchro','atk');return drive();}
function links(name){return V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_ADD'&&x.action.name===name).length;}
`;
harness(COMMON+HELP+String.raw`
fresh();const fleur=mk('フルール・シンクロン',0),mat=mk('ジェネティック・ワーウルフ',0),ex=mk('大地の騎士ガイアナイト',0),small=mk('ボルト・ヘッジホッグ',0),big=mk('デーモンの召喚',0);
gameState.players[0].mz=[fleur,mat];gameState.players[0].ex=[ex];gameState.players[0].hand=[small,big];baselineA();PREFER=[small.uid,'def'];const r=synchro(ex);
ok('A1 ★ 正規のS素材から誘発しレベル2だけを手札から守備表示で特殊召喚',r==='idle'&&zu(fleur.uid)==='grave'&&zu(ex.uid)==='mz'&&zu(small.uid)==='mz'&&cu(small.uid).pos==='def'&&zu(big.uid)==='hand'&&links('フルール・シンクロン')===1,JSON.stringify({r,fleur:zu(fleur.uid),small:zu(small.uid),big:zu(big.uid),pos:cu(small.uid).pos,links:links('フルール・シンクロン')}));audit('A');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const fleur=mk('フルール・シンクロン',0),small=mk('ボルト・ヘッジホッグ',0),hole=mk('ブラック・ホール',0);gameState.players[0].mz=[fleur];gameState.players[0].hand=[small,hole];baselineA();const r=useCard(0,hole);
ok('B1 ★ S素材以外の墓地送りでは手札から特殊召喚しない',r==='idle'&&zu(fleur.uid)==='grave'&&zu(small.uid)==='hand'&&links('フルール・シンクロン')===0);audit('B');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const cube=mk('ヴァイロン・キューブ',0),mat=mk('ホーリー・エルフ',0),ex=mk('エンシェント・フェアリー・ドラゴン',0),axe=mk('デーモンの斧',0);gameState.players[0].mz=[cube,mat];gameState.players[0].ex=[ex];gameState.players[0].deck.push(axe);baselineA();let cubeTargets=null;const oldResponses=getChainResponsesV2;getChainResponsesV2=function(p){const link=gameState.chain.find(x=>x.name==='ヴァイロン・キューブ');if(link)cubeTargets=(link.targets||[]).length;return oldResponses.apply(this,arguments);};PREFER=[axe.uid];const r=synchro(ex);
ok('C1 ★ 光属性のS素材になった場合に装備魔法をデッキから手札へ',r==='idle'&&zu(ex.uid)==='mz'&&zu(cube.uid)==='grave'&&zu(axe.uid)==='hand'&&links('ヴァイロン・キューブ')===1&&cubeTargets===0,JSON.stringify({r,axe:zu(axe.uid),links:links('ヴァイロン・キューブ')}));audit('C');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const cube=mk('ヴァイロン・キューブ',0),mat=mk('サイバー・ドラゴン',0),ex=mk('ブラックフェザー・ドラゴン',0),axe=mk('デーモンの斧',0);gameState.players[0].mz=[cube,mat];gameState.players[0].ex=[ex];gameState.players[0].deck.push(axe);baselineA();const r=synchro(ex);
ok('D1 ★ 光属性以外のS召喚ではサーチしない',r==='idle'&&zu(ex.uid)==='mz'&&zu(axe.uid)==='deck'&&links('ヴァイロン・キューブ')===0,JSON.stringify({r,ex:zu(ex.uid),axe:zu(axe.uid)}));audit('D');
`,{expect:2});
harness(COMMON+HELP+String.raw`
fresh();const cube=mk('ヴァイロン・キューブ',0),mat=mk('ホーリー・エルフ',0),ex=mk('エンシェント・フェアリー・ドラゴン',0),axe=mk('デーモンの斧',0),rai=mk('ライオウ',1);gameState.players[0].mz=[cube,mat];gameState.players[0].ex=[ex];gameState.players[0].deck.push(axe);gameState.players[1].mz=[rai];baselineA();const r=synchro(ex);
ok('E1 ★ ライオウの下ではデッキサーチが発動しない',r==='idle'&&zu(axe.uid)==='deck'&&links('ヴァイロン・キューブ')===0);audit('E');
`,{expect:2});

/* Auto cycle 62 dedicated positive / negative / ruling-edge tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=62;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(card){return makeContext(0,card,'hand',0,'summonProcedure',{});}
function h(card){return locateCardAnyV4(card);}
const TARGETS=['インフェルノ','ギガンテス','シルフィード'];
TARGETS.forEach(n=>ok('cycle62 registration '+n,!!sc(n)));
ok('cycle62 枚数は3',TARGETS.length===3);

/* インフェルノ */
reset0();
let inferno=mk('インフェルノ'),fire=mk('E・HERO バーストレディ');gameState.players[0].hand=[inferno];gameState.players[0].grave=[fire];
let proc=sc('インフェルノ').summonProcedure;
ok('インフェルノ positive: 炎属性墓地1体で特殊召喚legal',proc.condition(C(inferno))===true);
let paid=false;proc.cost(C(inferno),v=>paid=v);
ok('インフェルノ cost: 炎属性を除外',paid&&h(fire).zone==='banish');proc.execute(C(inferno));
ok('インフェルノ positive: 手札から特殊召喚',h(inferno).zone==='mz');
let water=mk('グリズリーマザー',1,'up','atk');gameState.players[1].mz=[water];gameState.phase='battle';gameState.battle={player:0,atkIdx:0,target:0,step:'before',atkUid:inferno.uid,targetUid:water.uid};
ok('インフェルノ ruling: 水属性を攻撃するダメージステップ中ATK+700',curATK(inferno)===(dbOf(inferno).atk||0)+700);
gameState.battle=null;ok('インフェルノ negative: 戦闘外は上昇しない',curATK(inferno)===(dbOf(inferno).atk||0));
reset0();inferno=mk('インフェルノ');gameState.players[0].hand=[inferno];gameState.players[0].grave=[mk('ライオウ')];
ok('インフェルノ negative: 炎属性墓地なし不可',!proc.condition(C(inferno)));

/* ギガンテス */
reset0();
let gigantes=mk('ギガンテス'),earth=mk('D.D.アサイラント');gameState.players[0].hand=[gigantes];gameState.players[0].grave=[earth];proc=sc('ギガンテス').summonProcedure;
ok('ギガンテス positive: 地属性墓地1体で特殊召喚legal',proc.condition(C(gigantes))===true);paid=false;proc.cost(C(gigantes),v=>paid=v);proc.execute(C(gigantes));
ok('ギガンテス cost/execute: 地属性除外後に特殊召喚',paid&&h(earth).zone==='banish'&&h(gigantes).zone==='mz');
let ownSpell=mk('サイクロン'),foeTrap=mk('奈落の落とし穴',1),monster=mk('ワイト',1);gameState.players[0].sz=[ownSpell];gameState.players[1].sz=[foeTrap];gameState.players[1].mz=[monster];
API.destroy(h(gigantes),'battle',{cause:'battle'});let gx=makeContext(0,gigantes,'grave',gameState.players[0].grave.indexOf(gigantes),'onBattleDestroy',{event:{card:gigantes,reason:'battle'}});gx.event={card:gigantes,reason:'battle'};
ok('ギガンテス positive: 戦闘破壊墓地で誘発',sc('ギガンテス').condition(gx));sc('ギガンテス').resolve(gx);
ok('ギガンテス resolve: フィールドの魔法・罠を全破壊',gameState.players[0].sz.length===0&&gameState.players[1].sz.length===0);
ok('ギガンテス ruling: モンスターは破壊しない',h(monster).zone==='mz');
reset0();gigantes=mk('ギガンテス');gameState.players[0].grave=[gigantes];
let bad=makeContext(0,gigantes,'grave',0,'onBattleDestroy',{event:{card:mk('ワイト')}});bad.event={card:mk('ワイト')};
ok('ギガンテス negative: 別カードの戦闘破壊では誘発しない',!sc('ギガンテス').condition(bad));

/* シルフィード */
reset0();
let silpheed=mk('シルフィード'),wind=mk('ドラゴンフライ');gameState.players[0].hand=[silpheed];gameState.players[0].grave=[wind];gameState.players[1].hand=[mk('サイクロン',1),mk('奈落の落とし穴',1)];proc=sc('シルフィード').summonProcedure;
ok('シルフィード positive: 風属性墓地1体で特殊召喚legal',proc.condition(C(silpheed))===true);paid=false;proc.cost(C(silpheed),v=>paid=v);proc.execute(C(silpheed));
ok('シルフィード cost/execute: 風属性除外後に特殊召喚',paid&&h(wind).zone==='banish'&&h(silpheed).zone==='mz');
API.destroy(h(silpheed),'battle',{cause:'battle'});let sx=makeContext(0,silpheed,'grave',gameState.players[0].grave.indexOf(silpheed),'onBattleDestroy',{event:{card:silpheed,reason:'battle'}});sx.event={card:silpheed,reason:'battle'};
ok('シルフィード positive: 戦闘破壊墓地かつ相手手札ありで誘発',sc('シルフィード').condition(sx));const before=gameState.players[1].hand.length;sc('シルフィード').resolve(sx);
ok('シルフィード resolve: 相手手札をランダムに1枚捨てる',gameState.players[1].hand.length===before-1&&gameState.players[1].grave.length===1);
reset0();silpheed=mk('シルフィード');gameState.players[0].grave=[silpheed];gameState.players[1].hand=[];sx=makeContext(0,silpheed,'grave',0,'onBattleDestroy',{event:{card:silpheed}});sx.event={card:silpheed};
ok('シルフィード negative: 相手手札0枚なら誘発しない',!sc('シルフィード').condition(sx));
ok('cycle62 ruling: 3枚とも通常召喚不可',TARGETS.every(n=>sc(n).cannotNormalSummon===true));
ok('cycle62 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}if(thrown||f||!RR.length)process.exit(2);

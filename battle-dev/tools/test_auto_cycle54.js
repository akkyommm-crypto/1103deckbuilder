/* Auto cycle 54 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=54;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){return makeContext(p,card,zone,idx,ev||'activate',extra||{});}
const TARGETS=['ダーク・アサシン'];
TARGETS.forEach(n=>ok('cycle54 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle54 枚数は1',TARGETS.length===1);

reset0();
let da=mk('ダーク・アサシン',0), light=mk('青眼の白龍',0), dark1=mk('ワイト',0);
gameState.players[0].mz=[da];
gameState.players[0].grave=[];
ok('ダーク・アサシン positive: 闇0枚ならATK400ダウン',curATK(da)===(dbOf(da).atk||0)-400,'atk='+curATK(da));
gameState.players[0].grave=[dark1,light];
ok('ダーク・アサシン ruling: 闇1枚でもATK400ダウン',curATK(da)===(dbOf(da).atk||0)-400,'atk='+curATK(da));
gameState.players[0].grave=[mk('ワイト',0),mk('ブラック・マジシャン',0)];
ok('ダーク・アサシン positive: 闇2〜4枚ならATK400アップ',curATK(da)===(dbOf(da).atk||0)+400,'atk='+curATK(da));
gameState.players[0].grave.push(mk('ワイト',0),mk('ブラック・マジシャン',0),mk('黒魔族のカーテン',0));
ok('ダーク・アサシン ruling: 闇5枚以上では継続ATK修整ではなく起動効果を得る',curATK(da)===(dbOf(da).atk||0),'atk='+curATK(da));

let fd1=mk('青眼の白龍',1,'down','def'), fd2=mk('ワイト',1,'down','def'), up=mk('ロードポイズン',1,'up','atk');
gameState.players[1].mz=[fd1,fd2,up];
let s=sc('ダーク・アサシン'), ctx=C(0,da,'mz',0,'activate');
ok('ダーク・アサシン positive: 闇5枚以上かつ相手裏側ありで起動可能',s.condition(ctx)===true);
s.cost(ctx,b=>ok('ダーク・アサシン positive: 自身を墓地へ送るコストが成功',b===true));
s.resolve(ctx);
ok('ダーク・アサシン positive: 相手裏側モンスターを全破壊',gameState.players[1].mz.every(c=>c.face!=='down'));
ok('ダーク・アサシン negative: 相手表側モンスターは破壊しない',gameState.players[1].mz.some(c=>c.uid===up.uid));
ok('ダーク・アサシン ruling: 自身は墓地に残る',gameState.players[0].grave.some(c=>c.uid===da.uid));

reset0();
let da2=mk('ダーク・アサシン',0);gameState.players[0].mz=[da2];gameState.players[0].grave=[mk('ワイト',0),mk('ブラック・マジシャン',0),mk('黒魔族のカーテン',0),mk('ワイト',0)];
gameState.players[1].mz=[mk('青眼の白龍',1,'down','def')];
ok('ダーク・アサシン negative: 闇4枚では起動不可',sc('ダーク・アサシン').condition(C(0,da2,'mz',0,'activate'))===false);
gameState.players[0].grave.push(mk('ワイト',0));gameState.players[1].mz=[mk('青眼の白龍',1,'up','atk')];
ok('ダーク・アサシン negative: 相手裏側がなければ起動不可',sc('ダーク・アサシン').condition(C(0,da2,'mz',0,'activate'))===false);
ok('cycle54 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);

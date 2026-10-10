/* Auto cycle 58 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.phase='main1';gameState.turn=58;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(card){return makeContext(0,card,'mz',0,'activate',{});}
ok('cycle58 registration ブラッドストーム',!!sc('ブラッドストーム'));
ok('cycle58 枚数は1', ['ブラッドストーム'].length===1);
reset0();
let self=mk('ブラッドストーム'), b1=mk('BF－疾風のゲイル'), b2=mk('BF－極北のブリザード'), cyc=mk('サイクロン',1);
gameState.players[0].mz=[self,b1,b2];gameState.players[1].sz=[cyc];
let s=sc('ブラッドストーム'), ctx=C(self), base=dbOf(self).atk||0;
ok('ブラッドストーム positive: 自分表側鳥獣3体でATK+300',curATK(self)===base+300);
ok('ブラッドストーム positive: 鳥獣3体以上かつ相手魔法罠でlegal',s.condition(ctx));
ctx.selectedTargets=[{p:1,zone:'sz',index:0,card:cyc}];s.resolve(ctx);
ok('ブラッドストーム positive: 相手魔法罠を破壊',findCardByUid(cyc.uid).zone==='grave');
reset0();
self=mk('ブラッドストーム');b1=mk('BF－疾風のゲイル');let non=mk('ライオウ'), trap=mk('サイクロン',1);
gameState.players[0].mz=[self,b1,non];gameState.players[1].sz=[trap];
ok('ブラッドストーム negative: 鳥獣2体では起動不可',!s.condition(C(self)));
ok('ブラッドストーム negative: 非鳥獣はATK加算しない',curATK(self)===(dbOf(self).atk||0)+200);
reset0();
self=mk('ブラッドストーム');b1=mk('BF－疾風のゲイル');b2=mk('BF－極北のブリザード');
gameState.players[0].mz=[self,b1,b2];gameState.players[1].mz=[mk('クリッター',1)];
ok('ブラッドストーム negative: 相手魔法罠なし不可',!s.condition(C(self)));
reset0();
self=mk('ブラッドストーム');b1=mk('BF－疾風のゲイル');b2=mk('BF－極北のブリザード');let fd=mk('BF－暁のシロッコ',0,'down','def');
gameState.players[0].mz=[self,b1,fd];gameState.players[1].sz=[mk('サイクロン',1)];
ok('ブラッドストーム ruling: 裏側鳥獣は数えない',!s.condition(C(self))&&curATK(self)===(dbOf(self).atk||0)+2*100);
ok('cycle58 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);

/* Auto cycle 56 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.phase='main1';gameState.turn=56;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(card){return makeContext(0,card,'mz',0,'activate',{});}
ok('cycle56 registration A・ジェネクス・ボルキャノン',!!sc('A・ジェネクス・ボルキャノン'));
ok('cycle56 枚数は1', ['A・ジェネクス・ボルキャノン'].length===1);
reset0();
let self=mk('A・ジェネクス・ボルキャノン'), heat=mk('ジェネクス・ヒート'), foe=mk('ライオウ',1);
gameState.players[0].mz=[self,heat];gameState.players[1].mz=[foe];
let s=sc('A・ジェネクス・ボルキャノン'), ctx=C(self);
ok('A・ジェネクス・ボルキャノン positive: 炎属性GENEXコストと相手表側でlegal',s.condition(ctx));
API.selectCard=(label,list,cb)=>cb(list[0]);
let costOk=false;s.cost(ctx,v=>costOk=v);
ok('A・ジェネクス・ボルキャノン positive: 炎属性GENEXを墓地へ送る',costOk&&findCardByUid(heat.uid).zone==='grave');
ctx.selectedTargets=[{p:1,zone:'mz',index:0,card:foe}];const before=gameState.players[1].lp;
s.resolve(ctx);
ok('A・ジェネクス・ボルキャノン positive: 対象を破壊',findCardByUid(foe.uid).zone==='grave');
ok('A・ジェネクス・ボルキャノン positive: Lv×400ダメージ',before-gameState.players[1].lp===(dbOf(foe).lv||0)*400);
reset0();
self=mk('A・ジェネクス・ボルキャノン');let darkGenex=mk('A・ジェネクス・ボルキャノン'), fd=mk('ライオウ',1,'down','def');
gameState.players[0].mz=[self,darkGenex];gameState.players[1].mz=[mk('クリッター',1)];
ok('A・ジェネクス・ボルキャノン negative: 炎属性GENEXなし不可',!s.condition(C(self)));
gameState.players[0].mz=[self,mk('ジェネクス・ヒート')];gameState.players[1].mz=[fd];
ok('A・ジェネクス・ボルキャノン negative: 相手裏側のみ不可',!s.condition(C(self)));
reset0();
self=mk('A・ジェネクス・ボルキャノン');heat=mk('ジェネクス・ヒート');foe=mk('ライオウ',1);
gameState.players[0].mz=[self,heat];gameState.players[1].mz=[foe];
let ctx2=C(self);ctx2.selectedTargets=[{p:1,zone:'mz',index:0,card:foe}];gameState.players[1].mz=[];gameState.players[1].hand=[foe];
const before2=gameState.players[1].lp;
s.resolve(ctx2);
ok('A・ジェネクス・ボルキャノン ruling: 解決時に対象が場を離れていればダメージなし',findCardByUid(foe.uid).zone==='hand'&&gameState.players[1].lp===before2);
ok('cycle56 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);

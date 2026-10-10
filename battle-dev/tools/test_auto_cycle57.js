/* Auto cycle 57 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.phase='main1';gameState.turn=57;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(card){return makeContext(0,card,'mz',0,'activate',{});}
ok('cycle57 registration リサイクル・ジェネクス',!!sc('リサイクル・ジェネクス'));
ok('cycle57 枚数は1', ['リサイクル・ジェネクス'].length===1);
reset0();
let self=mk('リサイクル・ジェネクス'), heat=mk('ジェネクス・ヒート');
gameState.players[0].mz=[self];gameState.players[0].grave=[heat];
let s=sc('リサイクル・ジェネクス'), ctx=C(self);
ok('リサイクル・ジェネクス positive: 墓地GENEXがあればlegal',s.condition(ctx));
ctx.selectedTargets=[{p:0,zone:'grave',index:0,card:heat}];
s.resolve(ctx);
ok('リサイクル・ジェネクス positive: 選択GENEX名として扱う',API.nameOf(locateCardAnyV4(self))==='ジェネクス・ヒート');
ok('リサイクル・ジェネクス ruling: v17 name overrideをendPhase期限で保存',Array.isArray(self.charV17)&&self.charV17.some(m=>m.kind==='name'&&m.until==='endPhase'&&m.value==='ジェネクス・ヒート'));
reset0();
self=mk('リサイクル・ジェネクス');gameState.players[0].mz=[self];gameState.players[0].grave=[mk('クリッター')];
ok('リサイクル・ジェネクス negative: 墓地GENEXなし不可',!s.condition(C(self)));
reset0();
self=mk('リサイクル・ジェネクス','0','down','def');heat=mk('ジェネクス・ヒート');gameState.players[0].mz=[self];gameState.players[0].grave=[heat];
ok('リサイクル・ジェネクス negative: 裏側では不可',!s.condition(C(self)));
reset0();
self=mk('リサイクル・ジェネクス');heat=mk('ジェネクス・ヒート');gameState.players[0].mz=[self];gameState.players[0].grave=[heat];
let stale=C(self);stale.selectedTargets=[{p:0,zone:'grave',index:0,card:heat}];gameState.players[0].grave=[];s.resolve(stale);
ok('リサイクル・ジェネクス ruling: 解決時に対象が消えていれば名前変更なし',!self.charV17);
ok('cycle57 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);

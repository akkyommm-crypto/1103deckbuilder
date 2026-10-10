const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=94000;function mk44(n,p=0){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face:'down',pos:'atk',uid:__u++};}
function reset44(seed=0x44004400){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.rngInitialSeed=seed>>>0;gameState.rngState=seed>>>0;gameState.__v41Seq=0;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;v41ResetActionJournal(gameState);}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
reset44();
const deck=['セイバーザウルス','ライオウ','異次元の女戦士','スノーマンイーター','エフェクト・ヴェーラー','レスキューラビット'].map(n=>mk44(n));
act({type:'LOAD_DECK',player:0,deck,ex:[]});
act({type:'SHUFFLE',player:0});
act({type:'DRAW',player:0,n:2});
act({type:'COIN_TOSS'});
act({type:'MANUAL_TOGGLE_NORMAL_RIGHT_V43',player:0});
const pkg=v41ReplayPackage(gameState), finalDigest=v41StateDigest(gameState), finalJournal=V41_ACTION_JOURNAL.length;
ok('v4.4 package stores initial state',pkg.replayVersion===4&&pkg.initialState&&pkg.initialState.__v41Seq===0&&pkg.initialDigest,'ver='+pkg.replayVersion);
const audit=v44ReplayAuditPackage(pkg);
ok('v4.4 full replay audit passes',audit.ok&&audit.count===pkg.actions.length,audit.reason||'count='+audit.count);
ok('v4.4 full replay audit reaches final digest',audit.finalDigest===pkg.finalDigest,audit.finalDigest+' / '+pkg.finalDigest);
// Preview is a clone and can return to the untouched live state.
v44StartReplayPreview();
ok('v4.4 preview starts at initial state',V44_REPLAY_SESSION&&V44_REPLAY_SESSION.cursor===0&&gameState.__v44ReplayPreview===true);
v44ReplayStep(2);ok('v4.4 preview advances exact action count',V44_REPLAY_SESSION.cursor===2&&gameState.__v41Seq===pkg.actions[1].seq,'cursor='+V44_REPLAY_SESSION.cursor);
const beforeBlocked=gameState.players[0].normalSummonUsed, beforeCursor=V44_REPLAY_SESSION.cursor;
act({type:'MANUAL_TOGGLE_NORMAL_RIGHT_V43',player:0});
ok('v4.4 preview blocks normal act()',gameState.players[0].normalSummonUsed===beforeBlocked&&V44_REPLAY_SESSION.cursor===beforeCursor);
v44ReplayBack();ok('v4.4 preview one-step back is exact',V44_REPLAY_SESSION.cursor===1&&gameState.__v41Seq===pkg.actions[0].seq);
v44ReplayExit();
ok('v4.4 exit restores original live duel',!V44_REPLAY_SESSION&&v41StateDigest(gameState)===finalDigest&&V41_ACTION_JOURNAL.length===finalJournal,'journal='+V41_ACTION_JOURNAL.length);
// Branch: replay two actions, adopt prefix, then create a different third action.
v44StartReplayPreview();v44ReplaySeekIndex(2);const prefix2=JSON.stringify(pkg.actions.slice(0,2).map(e=>e.action.type));v44ReplayBranchHere();
ok('v4.4 branch adopts exact replay prefix',!V44_REPLAY_SESSION&&V41_ACTION_JOURNAL.length===2&&JSON.stringify(V41_ACTION_JOURNAL.map(e=>e.action.type))===prefix2,'journal='+V41_ACTION_JOURNAL.length);
act({type:'MANUAL_TOGGLE_NORMAL_RIGHT_V43',player:0});
ok('v4.4 branch records new action after prefix',V41_ACTION_JOURNAL.length===3&&V41_ACTION_JOURNAL[2].action.type==='MANUAL_TOGGLE_NORMAL_RIGHT_V43');
// Verification must fail loudly on tampering.
const bad=v41JournalClone(pkg);bad.actions[1].digest='00000000';const badAudit=v44ReplayAuditPackage(bad);
ok('v4.4 digest mismatch stops replay',badAudit.ok===false&&badAudit.reason==='digest'&&badAudit.index===1,JSON.stringify(badAudit));
const trunc=v41JournalClone(pkg);trunc.truncated=true;const ready=v44ReplayReady(trunc);
ok('v4.4 truncated package cannot pretend full replay',ready.ok===false&&/2000/.test(ready.reason),ready.reason);
// Automatic rule actions are journaled without adding an Undo checkpoint.
reset44();const h0=HISTORY.length;commitAutomaticActionV44({type:'MANUAL_TOGGLE_NORMAL_RIGHT_V43',player:0});
ok('v4.4 automatic action is journaled',V41_ACTION_JOURNAL.length===1&&gameState.players[0].normalSummonUsed===true);
ok('v4.4 automatic action does not add Undo snapshot',HISTORY.length===h0,'history='+HISTORY.length);
globalThis.__V44R=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},scrollIntoView(){},animate(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){},back(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v440.js',timeout:30000});const r=context.__V44R;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}

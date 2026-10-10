const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__DB;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};
let uid=990000;function mk(n,p=0,face='up'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos:'atk',uid:uid++};}
function reset(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=2;turnActions=[];PLAY_MODE=PLAY_MODES.DUEL;ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE;}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
const sc=CARD_SCRIPTS['ライオウ'];
reset();let rai=mk('ライオウ',0);gameState.players[0].mz=[rai];
let ctx=makeContext(0,rai,'mz',0,'legalCheck',{});
ok('通常時はcondition false',sc.condition(ctx)===false,ctx.reason||'');
ok('通常時はstrict legality false',strictScriptLegalityV2('ライオウ',0,'mz',0).ok===false);
reset();rai=mk('ライオウ',0);gameState.players[0].mz=[rai];gameState.pendingSummon={player:0,name:'サイバー・ドラゴン',kind:'procedure',uid:1,label:'特殊召喚'};ctx=makeContext(0,rai,'mz',0,'legalCheck',{});
ok('自分の特殊召喚には発動不可',sc.condition(ctx)===false,ctx.reason||'');
reset();rai=mk('ライオウ',0);gameState.players[0].mz=[rai];gameState.pendingSummon={player:1,name:'死者蘇生テスト',kind:'effect',uid:2,label:'特殊召喚'};ctx=makeContext(0,rai,'mz',0,'legalCheck',{});
ok('効果による特殊召喚には発動不可',sc.condition(ctx)===false,ctx.reason||'');
for(const kind of ['procedure','synchro','xyz']){
  reset();rai=mk('ライオウ',0);gameState.players[0].mz=[rai];gameState.pendingSummon={player:1,name:'相手モンスター',kind,uid:3,label:'特殊召喚'};ctx=makeContext(0,rai,'mz',0,'legalCheck',{});
  ok(kind+'特殊召喚にはcondition true',sc.condition(ctx)===true,ctx.reason||'');
  ok(kind+'特殊召喚にはstrict legality true',strictScriptLegalityV2('ライオウ',0,'mz',0,{ignoreTiming:true,summonWindow:true}).ok===true);
  const list=summonNegatorsV2(gameState.pendingSummon);ok(kind+' summon window候補にライオウが出る',list.some(x=>x.card===rai));
}
reset();rai=mk('ライオウ',0,'down');gameState.players[0].mz=[rai];gameState.pendingSummon={player:1,name:'相手モンスター',kind:'synchro',uid:4};ctx=makeContext(0,rai,'mz',0,'legalCheck',{});
ok('裏側ライオウは発動不可',sc.condition(ctx)===false);
reset();rai=mk('ライオウ',0);gameState.players[0].mz=[rai];gameState.pendingSummon={player:1,name:'相手モンスター',kind:'synchro',uid:5};
sc.resolve(makeContext(0,rai,'mz',0,'activate',{}));ok('resolveはpending summonを無効化',gameState.pendingSummon.negated===true);
reset();rai=mk('ライオウ',0);gameState.players[0].mz=[rai];let pendingCalls=0;API.registerPendingEffect=()=>{pendingCalls++};sc.resolve(makeContext(0,rai,'mz',0,'activate',{}));ok('pendingSummonなしで手動pending effectを作らない',pendingCalls===0);
globalThis.__R=R;
`;
js+='\n'+probe;
function stub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},querySelector(){return stub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return []},createElement(){return stub()},addEventListener(){},removeEventListener(){},body:stub(),documentElement:stub()};
const store=new Map(),localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__DB:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'raiou-fix.js',timeout:30000});const r=context.__R;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}

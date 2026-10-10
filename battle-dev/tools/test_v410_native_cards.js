const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=62000;function mk41c(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face,pos,uid:__u++};}
function reset41c(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=2;gameState.rngInitialSeed=0x24681357;gameState.rngState=0x24681357;turnActions=[];PLAY_MODE=PLAY_MODES.DUEL;ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE;}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
API.selectCard=(title,cands,done)=>{if(!(cands||[]).length)throw new Error('no candidate '+title);done(cands[0]);};
const defs=[['キラー・トマト','闇'],['シャインエンジェル','光'],['巨大ネズミ','地'],['グリズリーマザー','水'],['ドラゴンフライ','風'],['UFOタートル','炎']];
for(const [name,attr] of defs){
  reset41c();const self=mk41c(name), target=mk41c(name,0,'down');gameState.players[0].grave=[self];gameState.players[0].deck=[target];
  const sc=CARD_SCRIPTS[name],ctx=makeContext(0,self,'grave',0,'onBattleDestroy',{event:{card:self}});
  /* S03-U157: the attribute recruiters moved from a v4 Unified Effect (Deck monster chosen at activation) to the shared deck-trigger
     engine (engine/1ZT): the Deck is examined at resolution through the journaled choice. */
  const S=DECK_TRIGGER_S03[name];
  ok(name+': declared on the shared deck-trigger engine (optional, face-up Attack, ATK ≤ 1500 '+attr+')',!!sc&&!!S&&S.optional===true&&S.pos==='atk'&&S.filter.at===attr&&S.filter.atkmax===1500);
  ok(name+': battle destroy condition',sc.condition(ctx),ctx.reason||'');
  let sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);
  if(pendingChoiceV49(gameState))__choicePickV49(0);
  ok(name+': summons matching attribute from Deck',gameState.players[0].mz.includes(target)&&dbOf(target).at===attr&&target.pos==='atk','mz='+gameState.players[0].mz.map(cardName));
}
// Reject wrong-attribute / high-ATK-only decks.
reset41c();let self=mk41c('キラー・トマト');gameState.players[0].grave=[self];gameState.players[0].deck=[mk41c('青眼の白龍')];let sc=CARD_SCRIPTS['キラー・トマト'],ctx=makeContext(0,self,'grave',0,'onBattleDestroy',{event:{card:self}});
/* S03-U157: the Deck is not checked at activation (it is examined at resolution): with no candidate the optional trigger can be
   activated and resolves doing nothing, the Deck is shuffled (engine/1ZT; same as 仮面竜 etc.). */
const __jl=V41_ACTION_JOURNAL.length;
ok('Recruiter: invalid Deck — still activatable, resolves with no summon and the Deck shuffled',sc.condition(ctx)===true&&(sc.resolve(ctx),!pendingChoiceV49(gameState)&&gameState.players[0].mz.length===0&&V41_ACTION_JOURNAL.slice(__jl).some(x=>x.action.type==='SHUFFLE')),ctx.reason||'');
// noSpecialSummon centrally blocks condition too.
reset41c();self=mk41c('シャインエンジェル');gameState.players[0].grave=[self];gameState.players[0].deck=[mk41c('シャインエンジェル')];gameState.players[0].temporaryFlags.noSpecialSummon=true;sc=CARD_SCRIPTS['シャインエンジェル'];ctx=makeContext(0,self,'grave',0,'onBattleDestroy',{event:{card:self}});
/* S03-U157: the Special Summon lock is applied by the central activation legality (v4.4.0 rule), not by the card condition */
ok('Recruiter: noSpecialSummon blocks activation',strictScriptLegalityV2('シャインエンジェル',0,'grave',0,{event:{card:self},eventName:'onBattleDestroy',ignoreTiming:true}).ok===false,ctx.reason||'');
globalThis.__V41C=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},scrollIntoView(){},animate(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){},back(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v410cards.js',timeout:30000});const r=context.__V41C;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}

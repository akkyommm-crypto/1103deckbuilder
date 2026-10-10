const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};
let __u=50000;function mkN(n,p=0,pos='atk',face='up'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face,pos,uid:__u++};}
function resetN(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=2;turnActions=[];PLAY_MODE=PLAY_MODES.DUEL;ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE;}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
API.selectCard=(title,cands,done)=>{let p=null;if(title.includes('セイバー・スラッシュ'))p=(cands||[]).find(x=>x.p===1);p=p||(cands||[])[0];if(!p)throw new Error('no candidate '+title);done(p);};
// 1) Golden Gearbox: native v4 + setcode + RESET_END
resetN();let kar=mkN('カラクリ商人 壱七七'),box=mkN('黄金の歯車装置箱');gameState.players[0].mz=[kar];gameState.players[0].hand=[box];
let sc=CARD_SCRIPTS['黄金の歯車装置箱'],ctx=makeContext(0,box,'hand',0,'activate',{});ok('v4 native: Gearbox registered',!!sc&&sc.v4Unified&&nativeEffectsV4('黄金の歯車装置箱').length===1);
ok('Gearbox: Karakuri setcode condition',sc.condition(ctx),ctx.reason||'');let sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);
ok('Gearbox: +500/+1500 applies',curATK(kar)===(dbOf(kar).atk||0)+500&&curDEF(kar)===(dbOf(kar).def||0)+1500,'atk='+curATK(kar)+' def='+curDEF(kar));
v4ResetRuntimeEffects('endPhase',{});ok('Gearbox: RESET_END expires boost',curATK(kar)===(dbOf(kar).atk||0)&&curDEF(kar)===(dbOf(kar).def||0),'atk='+curATK(kar)+' def='+curDEF(kar));
// 2) Cunning of the Six Samurai: cost happens before target and cost card can be target
resetN();let kiz=mkN('真六武衆－キザン'),cunning=mkN('六武衆の理');gameState.players[0].mz=[kiz];gameState.players[0].hand=[cunning];
sc=CARD_SCRIPTS['六武衆の理'];ctx=makeContext(0,cunning,'hand',0,'activate',{});ok('六武衆の理: setcode condition',sc.condition(ctx),ctx.reason||'');let paid=null;sc.cost(ctx,x=>paid=x);ok('六武衆の理: cost sends Kizan first',paid===true&&gameState.players[0].grave.includes(kiz)&&!gameState.players[0].mz.includes(kiz),'grave='+gameState.players[0].grave.map(cardName));sel=[];sc.selectTargets(ctx,x=>sel=x);ok('六武衆の理: cost card is now a legal GY target',sel.length===1&&sel[0].card===kiz,sel.map(x=>cardName(x.card)).join(','));ctx.selectedTargets=sel;sc.resolve(ctx);ok('六武衆の理: revives selected Six Samurai',gameState.players[0].mz.includes(kiz)&&!gameState.players[0].grave.includes(kiz),'mz='+gameState.players[0].mz.map(cardName));
// 3) Ragigura summon trigger recovers X-Saber by setcode
resetN();let rag=mkN('XX－セイバー レイジグラ'),xs=mkN('X－セイバー エアベルン');gameState.players[0].mz=[rag];gameState.players[0].grave=[xs];
sc=CARD_SCRIPTS['XX－セイバー レイジグラ'];ctx=makeContext(0,rag,'mz',0,'onNormalSummon',{});ok('レイジグラ: native trigger registered',sc.v4Unified&&nativeEffectsV4('XX－セイバー レイジグラ')[0].type===EFFECT_TYPE.TRIGGER);ok('レイジグラ: X-Saber GY target condition',sc.condition(ctx),ctx.reason||'');sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);ok('レイジグラ: returns X-Saber to hand',gameState.players[0].hand.includes(xs)&&!gameState.players[0].grave.includes(xs),'hand='+gameState.players[0].hand.map(cardName));
// 4) Saber Slash locks exactly N targets at activation and destroys those targets at resolution
resetN();let a=mkN('XX－セイバー フォルトロール'),b=mkN('XX－セイバー エマーズブレイド'),f1=mkN('ライオウ',1),f2=mkN('セイバーザウルス',1),slash=mkN('セイバー・スラッシュ');gameState.players[0].mz=[a,b];gameState.players[0].hand=[slash];gameState.players[1].mz=[f1,f2];
sc=CARD_SCRIPTS['セイバー・スラッシュ'];ctx=makeContext(0,slash,'hand',0,'activate',{});ok('セイバー・スラッシュ: two attack-position X-Sabers counted',sc.condition(ctx),ctx.reason||'');sel=[];sc.selectTargets(ctx,x=>sel=x);ok('セイバー・スラッシュ: exactly two targets fixed',sel.length===2,'targets='+sel.map(x=>cardName(x.card)).join(','));ctx.selectedTargets=sel;sc.resolve(ctx);ok('セイバー・スラッシュ: both fixed targets destroyed',sel.every(t=>!resolveTarget(t)),'P1mz='+gameState.players[1].mz.map(cardName));
// New cards must be native while old cards remain legacy-compatible.
ok('v4 native cards count', ['黄金の歯車装置箱','六武衆の理','XX－セイバー レイジグラ','セイバー・スラッシュ'].every(n=>CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].v4Unified));
ok('old Rescue Rabbit still legacy',!CARD_SCRIPTS['レスキューラビット'].v4Unified&&effectsOfCardV4('レスキューラビット').length===1);
globalThis.__NATIVE_R=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v4native.js',timeout:30000});const r=context.__NATIVE_R;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}

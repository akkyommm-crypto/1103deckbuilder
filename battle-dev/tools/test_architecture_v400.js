const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};
let __u=40000;function mk4(n,p=0,pos='atk',face='up'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face,pos,uid:__u++};}
function reset4(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=2;turnActions=[];PLAY_MODE=PLAY_MODES.DUEL;ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE;}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
// Metadata / setcodes
const kz=CARD_DB[findCardIndex('真六武衆－キザン')], air=CARD_DB[findCardIndex('E・HERO エアーマン')], dia=CARD_DB[findCardIndex('D－HERO ディアボリックガイ')];
const hyp=CARD_DB[findCardIndex('マスター・ヒュペリオン')], earth=CARD_DB[findCardIndex('神秘の代行者 アース')];
ok('setcode: キザンは六武衆',isSetCardV4(kz,SETCODE.SIX_SAMURAI),JSON.stringify(kz.setcode));
ok('setcode: キザンは真六武衆',isSetCardV4(kz,SETCODE.LEGENDARY_SIX_SAMURAI),JSON.stringify(kz.setcode));
ok('setcode: エアーマンはHERO/E・HERO',isSetCardV4(air,SETCODE.HERO)&&isSetCardV4(air,SETCODE.ELEMENTAL_HERO),JSON.stringify(air.setcode));
ok('setcode: ディアボはHERO/D-HERO',isSetCardV4(dia,SETCODE.HERO)&&isSetCardV4(dia,SETCODE.DESTINY_HERO),JSON.stringify(dia.setcode));
ok('setcode: ヒュペリオンは関連だが代行者ではない',isSetCardV4(hyp,SETCODE.AGENT_RELATED)&&!isSetCardV4(hyp,SETCODE.AGENT),JSON.stringify(hyp.setcode));
ok('setcode: アースは代行者',isSetCardV4(earth,SETCODE.AGENT),JSON.stringify(earth.setcode));
const hl=CARD_DB[findCardIndex('ハーピィ・レディ')],hl1=CARD_DB[findCardIndex('ハーピィ・レディ1')];
ok('alias: ハーピィ・レディ1はルール上同名',sameCanonicalCardV4(hl,hl1),String(canonicalCardCodeV4(hl1)));
// Location masks
ok('LOCATION: MZONE/ONFIELD',locationMatchesV4('mz',LOCATION.MZONE)&&locationMatchesV4('mz',LOCATION.ONFIELD)&&!locationMatchesV4('grave',LOCATION.ONFIELD));
ok('LOCATION: grave',locationOfZoneV4('grave')===LOCATION.GRAVE);
// RESET-managed stat effect: LEAVE
reset4();let rai=mk4('ライオウ');gameState.players[0].mz=[rai];let t={p:0,zone:'mz',index:0,card:rai,db:dbOf(rai)};
v4RegisterStatModifier(t,{atk:500},{code:'v4-test-leave',sourceCard:rai,resetMask:RESET.LEAVE});
ok('RESET_LEAVE: modifier applies',curATK(rai)===2400,'atk='+curATK(rai));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'v4 test'});
ok('RESET_LEAVE: field leave expires effect',(gameState.runtimeEffects||[]).length===0,'effects='+JSON.stringify(gameState.runtimeEffects));
// RESET_END
reset4();rai=mk4('ライオウ');gameState.players[0].mz=[rai];t={p:0,zone:'mz',index:0,card:rai,db:dbOf(rai)};
v4RegisterStatModifier(t,{atk:400},{code:'v4-test-end',sourceCard:rai,resetMask:RESET.END});
ok('RESET_END: modifier applies',curATK(rai)===2300,'atk='+curATK(rai));processEndPhaseV30();
ok('RESET_END: End Phase expires effect',curATK(rai)===1900&&(gameState.runtimeEffects||[]).length===0,'atk='+curATK(rai));
// RESET_DISABLE
reset4();rai=mk4('ライオウ');gameState.players[0].mz=[rai];t={p:0,zone:'mz',index:0,card:rai,db:dbOf(rai)};
v4RegisterStatModifier(t,{atk:300},{code:'v4-test-disable',sourceCard:rai,resetMask:RESET.DISABLE});
act({type:'FX_NEGATE',player:0,zone:'mz',index:0,reason:'v4 test negate'});
ok('RESET_DISABLE: negate expires source effect',(gameState.runtimeEffects||[]).length===0);
ok('runtimeEffects is JSON serializable',typeof JSON.stringify(gameState)==='string');
// Unified Effect: condition -> cost -> target -> operation through real chain preparation/resolve
reset4();const src=mk4('ライオウ');const deckCard=mk4('セイバーザウルス');gameState.players[0].mz=[src];gameState.players[0].deck=[deckCard];
const order=[];
defineUnifiedCardV4('__V4_ARCH_TEST__',[{
  key:'draw',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,events:['activate'],speed:1,
  condition(ctx){return ctx.player===gameState.activePlayer;},
  cost(ctx,done){order.push('cost');API.payCost(ctx.player,500);done(true);},
  target(ctx){order.push('target');return [{p:ctx.player,zone:'mz',index:ctx.index,card:ctx.card,db:dbOf(ctx.card)}];},
  operation(ctx){order.push('operation');API.draw(ctx.player,1);}
}],{type:'monster',timing:['mainPhase'],priority:1,targets:true});
const prep=prepareDuelActivation('__V4_ARCH_TEST__',0,'mz',0,{noPriority:true});
ok('Unified Effect: activation prepares',prep&&gameState.chain.length===1,'chain='+gameState.chain.length);
ok('Unified Effect: cost before target',order.join(',')==='cost,target',order.join(','));
ok('Unified Effect: cost paid at activation',gameState.players[0].lp===7500,'lp='+gameState.players[0].lp);
const lk=gameState.chain[0];ok('Unified Effect: effect key persisted on chain',lk.v4EffectKey==='draw',String(lk.v4EffectKey));
act({type:'CHAIN_RESOLVE_TOP'});resolveOnePreparedLinkV27(lk);
ok('Unified Effect: operation at resolution',order.join(',')==='cost,target,operation',order.join(','));
ok('Unified Effect: operation drew card',gameState.players[0].hand.length===1,'hand='+gameState.players[0].hand.map(cardName));
ok('Unified Effect: monster source remains field',gameState.players[0].mz.includes(src));
// Legacy adapter is read-only and exposes old scripts through the same effect view.
const old=CARD_SCRIPTS['レスキューラビット'],adapt=effectsOfCardV4('レスキューラビット');
ok('Legacy adapter: existing script exposed as Effect[]',Array.isArray(adapt)&&adapt.length===1&&typeof adapt[0].operation==='function');
ok('Legacy adapter: original CARD_SCRIPT untouched',CARD_SCRIPTS['レスキューラビット']===old&&!old.v4Unified);
globalThis.__V4R=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v400.js',timeout:30000});const r=context.__V4R;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
